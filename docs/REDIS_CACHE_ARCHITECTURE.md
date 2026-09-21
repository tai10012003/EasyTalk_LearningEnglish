# Tài liệu kiến trúc Redis Cache trong EasyTalk Backend

Tài liệu này giải thích chi tiết cách Redis cache đang hoạt động trong backend EasyTalk, các file đã được thêm hoặc chỉnh sửa, từng hàm quan trọng, luồng xử lý cache, cách invalidate, cách chống cache stampede, cách fallback khi Redis lỗi, và các vấn đề cũ đã được giải quyết.

Mục tiêu của phần Redis cache hiện tại là:

- Giảm số lần query MongoDB cho dữ liệu đọc nhiều như grammar, story, pronunciation, exercise, journey, gate, stage.
- Chuẩn hóa cache key để tránh key lộn xộn, khó invalidate.
- Invalidate cache đúng theo quan hệ dữ liệu, ví dụ sửa stage thì journey detail cũng phải được xóa cache.
- Chống cache stampede khi nhiều request cùng đọc một key vừa hết hạn.
- Cho phép Redis lỗi nhưng backend vẫn chạy bằng DB fallback.
- Có logging, metrics, manual purge, warm-up, TTL jitter, stale-while-revalidate.
- Có test để kiểm tra behavior cache quan trọng.

## 1. Vấn đề của Redis cache ban đầu

Trước khi chuẩn hóa, Redis cache thường gặp các vấn đề sau trong dự án:

1. Cache key dễ bị nối chuỗi thủ công.

   Ví dụ kiểu key có thể được ghép trực tiếp từ `search`, `category`, `role`, `page`. Cách này dễ làm key dài, lộ raw query, sai thứ tự field, khó đổi schema và khó quản lý.

2. Invalidation còn thô.

   Khi update một item, thường chỉ xóa cache của module đó hoặc xóa theo pattern rộng. Nhưng dữ liệu thực tế có quan hệ: journey detail có thể populate gate/stage; user progress detail có thể nhúng tên/title content. Nếu chỉ xóa module hiện tại thì cache liên quan có thể bị stale sai.

3. Pattern scan/delete có thể nặng.

   `SCAN` tốt hơn `KEYS`, nhưng nếu mỗi request update đều scan nhiều pattern khi số key lớn thì vẫn có chi phí đáng kể.

4. Chưa chống cache stampede đầy đủ.

   Khi key hot hết hạn, nhiều request cùng miss Redis và cùng query DB. Với traffic lớn, DB có thể bị spike.

5. TTL đồng loạt dễ gây expire cùng lúc.

   Nếu nhiều key đều TTL 300s hoặc 600s, chúng có thể hết hạn cùng thời điểm và gây spike DB.

6. Middleware cache generic có rủi ro dữ liệu user.

   Nếu cache response theo URL mà endpoint phụ thuộc token/user/role thì dễ trả nhầm dữ liệu giữa user.

7. Logging và metrics chưa đủ chuẩn vận hành.

   Dùng `console.log` rải rác khó kiểm soát level và khó biết cache hit rate, miss rate, lỗi set, lỗi parse, latency Redis.

8. Redis lỗi có thể làm request bị chậm.

   Nếu request nào cũng thử Redis khi Redis đang lỗi, backend bị kéo chậm bởi timeout lặp lại.

Phần code mới giải quyết các vấn đề trên bằng key builder, namespace registry, policy tập trung, tag-based invalidation, single-flight lock, stale-while-revalidate, TTL jitter, circuit breaker, timeout ngắn, metrics, logger và test.

## 2. Bức tranh tổng thể

Luồng chính của cache nằm ở service layer:

```text
Controller
  -> Module Service
      -> build cache key bằng cacheNamespaces/cacheKeyBuilder
      -> chọn policy TTL bằng cachePolicies
      -> cache.getOrSet(key, policy, fetchDbFn)
          -> Redis get
          -> cache hit: trả data
          -> stale hit: trả data cũ + refresh nền
          -> miss: lấy lock Redis
              -> request thắng lock query DB rồi set Redis
              -> request khác chờ cache xuất hiện
          -> Redis lỗi: fallback DB
```

Luồng invalidation:

```text
Create/Update/Delete trong module service
  -> gọi module utils/cacheHelper.js
      -> build tags liên quan
      -> cache.invalidateTags(tags)
          -> đọc Redis Set của từng tag
          -> UNLINK các key thuộc tag
          -> xóa tag set
```

Redis cache trong dự án không chỉ là một middleware HTTP. Thiết kế hiện tại ưu tiên cache ở service layer để mỗi service hiểu dữ liệu của mình và biết khi nào an toàn cache.

## 3. Quy ước cache key

File chính: `apps/src/shared/utils/cacheKeyBuilder.js`

Key chuẩn có dạng:

```text
<namespace>:<version>:<module>:<resource>:<id-or-query-hash>
```

Ví dụ:

```text
easytalk:v1:grammar:list:8f3a9c12ab34
easytalk:v1:grammar:item:64abc...
easytalk:v1:story:slug:basic-greeting
```

Trong đó:

- `namespace`: mặc định là `easytalk`, lấy từ `CACHE_NAMESPACE`.
- `version`: mặc định là `v1`, lấy từ `CACHE_VERSION`.
- `module`: tên domain như `grammar`, `story`, `journey`.
- `resource`: loại dữ liệu như `list`, `item`, `slug`, `details`.
- `id`: dùng cho detail/item/slug.
- `query hash`: dùng cho list có filter/search/page/role.

Điểm quan trọng: list key không nối raw query trực tiếp vào key. Query được normalize và hash để key ngắn, ổn định, không lộ raw search quá nhiều.

## 4. File `cacheKeyBuilder.js`

### `normalizeValue(value)`

Chuẩn hóa value trước khi hash.

Logic:

- Nếu là `Date`, đổi thành ISO string.
- Nếu là array, normalize từng phần tử.
- Nếu là object, sort key theo alphabet.
- Bỏ qua field `undefined`, `null`, chuỗi rỗng.
- Primitive thì giữ nguyên.

Mục đích:

- `{ page: 1, limit: 10 }` và `{ limit: 10, page: 1 }` tạo cùng hash.
- Query rỗng hoặc field rỗng không tạo key khác vô nghĩa.
- Cache key ổn định giữa các request giống nhau.

### `stableStringify(value)`

Gọi `normalizeValue()` rồi `JSON.stringify()`.

Mục đích là tạo string ổn định để hash query.

### `hashQuery(query, length = 12)`

Tạo SHA-1 hash từ query đã stable stringify, lấy mặc định 12 ký tự đầu.

Ví dụ:

```js
hashQuery({ page: 1, limit: 12, search: "hello" })
```

Kết quả là một đoạn hash ngắn, ví dụ `8f3a9c12ab34`.

### `buildCacheKey({ module, resource, id, query, namespace, version })`

Tạo cache key chuẩn.

Logic:

- Ghép `namespace`, `version`, `module`, `resource`.
- Nếu có `id`, thêm `id`.
- Nếu không có `id` nhưng có `query`, thêm `hashQuery(query)`.
- Nếu không có cả `id` và query hữu ích, key chỉ dừng ở resource.

Ví dụ:

```js
buildCacheKey({
  module: "grammar",
  resource: "list",
  query: { page: 1, limit: 12, search: "", role: "user" }
})
```

Tạo key dạng:

```text
easytalk:v1:grammar:list:<hash>
```

### `buildTag(module, resource, id)`

Tạo tag key dùng cho tag-based invalidation.

Dạng:

```text
easytalk:v1:tag:<module>:<resource>:<id>
```

Ví dụ:

```text
easytalk:v1:tag:grammar:list
easytalk:v1:tag:grammar:item:64abc...
```

Tag không chứa data chính, mà là Redis Set chứa danh sách cache key thuộc tag đó.

### `buildLockKey(key)`

Tạo lock key cho single-flight lock.

Dạng:

```text
easytalk:v1:lock:<hash>
```

Không dùng raw cache key làm lock key trực tiếp, mà hash lại để lock key gọn và ổn định.

## 5. File `cacheNamespaces.js`

File này là registry tập trung cho cache namespace, resource và dependency.

### `modules`

Khai báo module nào có resource cache nào.

Ví dụ:

- `grammar`: `list`, `item`
- `story`: `list`, `item`
- `journey`: `list`, `details`
- `gate`: `list`, `item`, `journey`
- `stage`: `list`, `detail`, `gate`
- `userprogress`: `list`, `detail`

Mục đích:

- Admin purge biết module nào hợp lệ.
- Developer có nơi xem tổng quan cache domain.
- Tránh mỗi service tự nhớ resource string.

### `key(module, resource, options)`

Wrapper quanh `buildCacheKey()`.

Dùng khi resource không thuộc helper phổ biến, ví dụ:

```js
cacheNs.key("journey", "details", { id: journeyId })
```

### `tag(module, resource, id)`

Wrapper quanh `buildTag()`.

Dùng để tạo tag invalidation.

### `listKey(module, query)`

Tạo key cho list.

Ví dụ:

```js
cacheNs.listKey("grammar", { page, limit, search, role })
```

### `itemKey(module, id)`

Tạo key cho item detail theo id.

Ví dụ:

```js
cacheNs.itemKey("grammar", id)
```

### `slugKey(module, slug)`

Tạo key cho detail theo slug.

Ví dụ:

```js
cacheNs.slugKey("story", slug)
```

### `listTags(module)`

Trả về tags chung cho list của module.

Ví dụ với grammar:

```js
[
  "easytalk:v1:tag:grammar:list",
  "easytalk:v1:tag:grammar:all"
]
```

Một list cache được gắn tag `grammar:list` và `grammar:all`.

### `itemTags(module, id, slug)`

Trả về tags cho item detail.

Nếu có id:

- `module:item`
- `module:item:<id>`
- `module:all`

Nếu có slug:

- `module:slug`
- `module:slug:<slug>`

Mục đích:

- Update đúng một item có thể xóa cache detail theo id.
- Nếu slug đổi, có thể xóa cả slug cũ và slug mới.
- Vẫn có tag tổng `all` để purge toàn module.

### `contentTags(module, id, slug)`

Gộp `listTags()` và `itemTags()`.

Hàm này hữu ích khi một response vừa cần thuộc list vừa cần thuộc item. Hiện code chủ yếu dùng trực tiếp `listTags()` hoặc `itemTags()`.

### `dependencies`

Khai báo dependency graph giữa các module.

Hiện tại:

- `gate` phụ thuộc `journey`.
- `stage` phụ thuộc `gate` và `journey`.

Ý nghĩa:

- Update gate thì journey detail/list có thể bị stale.
- Update stage thì gate/journey có thể bị stale vì gate/journey có thể populate stage.

### `dependencyTags(module)`

Trả về tag cần invalidate thêm khi module thay đổi.

Ví dụ:

```js
cacheNs.dependencyTags("stage")
```

Sẽ trả về tags của gate và journey liên quan.

## 6. File `cachePolicies.js`

File này quản lý TTL/stale TTL theo loại dữ liệu.

### `domainPolicies`

Khai báo policy theo module và resource.

Ví dụ:

- Grammar list user: TTL 1200s, stale 300s.
- Public content detail: TTL dài hơn, thường 1800-3600s.
- User progress list: TTL ngắn, 30s, stale 15s.
- Journey/gate/stage: TTL 900-1800s.

Ý nghĩa:

- Dữ liệu public ít đổi có thể cache lâu.
- Dữ liệu user hoặc admin cần ngắn hơn.
- Không dùng một TTL chung cho mọi thứ.

### `forRole(policy, role)`

Nếu policy có nhánh `admin` và `user`, hàm này chọn policy theo role.

Ví dụ:

- Admin list TTL 60s.
- User list TTL 900s.

Lý do: admin cần thấy dữ liệu mới nhanh hơn.

### `domain(moduleName, resource, role, fallback)`

Lấy policy theo module/resource/role.

Nếu không có policy khai báo, dùng fallback.

### `policies.contentList(moduleName, role)`

Lấy policy cho list content public như grammar/story/pronunciation.

### `policies.contentDetail(moduleName)`

Lấy policy cho detail content public.

### `policies.relationList(moduleName)`

Lấy policy cho list quan hệ như journey/gate/stage.

### `policies.relationDetail(moduleName)`

Lấy policy cho detail quan hệ như journey detail, gate detail, stage detail.

### `policies.userList()`

Policy cho list user progress.

### `policies.userDetail()`

Policy dự phòng cho user progress detail nếu sau này cache detail theo user. Hiện phần detail user progress đang thận trọng, chưa cache trực tiếp ở nhiều chỗ để tránh sai dữ liệu user.

### `policies.noCache()`

Trả về:

```js
{ ttl: 0, staleTtl: 0, enabled: false }
```

Dùng cho dữ liệu không nên cache.

### `withTags(policy, tags)`

Gắn tags vào policy.

Ví dụ:

```js
withTags(
  policies.contentList("grammar", role),
  cacheNs.listTags("grammar")
)
```

Kết quả là options truyền vào `cache.getOrSet()`.

## 7. File `cacheSerializer.js`

File này xử lý format value lưu trong Redis, TTL jitter, stale-while-revalidate và giới hạn payload.

### `DEFAULT_JITTER_RATIO`

Mặc định là `0.15`, tức TTL được cộng random tối đa khoảng 15%.

Ví dụ TTL 300s có thể thành 300-345s.

Mục đích: tránh nhiều key expire cùng lúc.

### `MAX_CACHE_PAYLOAD_BYTES`

Lấy từ `CACHE_MAX_PAYLOAD_BYTES`, mặc định 1MB.

Nếu payload serialize lớn hơn mức này thì không set Redis.

Mục đích:

- Tránh cache object quá lớn.
- Bảo vệ memory Redis.

### `withJitter(ttl, jitterRatio)`

Trả TTL đã cộng random.

Nếu ttl <= 0 hoặc jitterRatio <= 0 thì giữ nguyên.

### `createEnvelope(value, ttl, staleTtl)`

Bọc data thành envelope:

```js
{
  __cacheEnvelope: true,
  data,
  expiresAt,
  staleUntil
}
```

Trong đó:

- `expiresAt`: hết hạn fresh.
- `staleUntil`: hết hạn stale.

Ví dụ TTL 300s, staleTtl 60s:

- 0-300s: fresh.
- 300-360s: stale nhưng vẫn có thể trả tạm.
- Sau 360s: expired, Redis key thường cũng hết hạn.

### `isEnvelope(value)`

Kiểm tra object có phải cache envelope mới không.

### `serializeCacheValue(value, ttl, options)`

Chuyển data thành string JSON để set Redis.

Logic:

- Nếu có staleTtl thì wrap bằng envelope.
- Tính TTL Redis bằng TTL + staleTtl nếu wrap.
- Thêm jitter.
- Tính payload size.

Trả về:

```js
{
  serialized,
  redisTtl,
  payloadBytes
}
```

### `parseCacheEntry(serialized)`

Parse JSON từ Redis.

Nếu data không có envelope, coi là legacy cache:

```js
{
  data,
  fresh: true,
  stale: false,
  legacy: true
}
```

Nếu có envelope:

- `fresh = expiresAt > now`
- `stale = expiresAt <= now && staleUntil > now`
- `expired = staleUntil <= now`

Mục đích: code mới vẫn đọc được cache cũ nếu trước đó lưu raw JSON.

## 8. File `redisClient.js`

File này là Redis adapter an toàn cho toàn backend.

Nó không expose trực tiếp `ioredis` cho service dùng lung tung, mà cung cấp `safeRedisClient`.

### Biến trạng thái

- `redisClient`: instance ioredis thật.
- `isConnected`: Redis đã ready chưa.
- `connectPromise`: tránh gọi connect nhiều lần cùng lúc.
- `circuit`: trạng thái circuit breaker.

### ENV liên quan

- `REDIS_ENABLED`: nếu `false`, không tạo Redis client.
- `REDIS_URL`: nếu có thì ưu tiên dùng.
- `REDIS_HOST`: host Redis.
- `REDIS_PORT`: port Redis.
- `REDIS_PASSWORD`: password Redis.
- `REDIS_COMMAND_TIMEOUT_MS`: timeout cho từng command.
- `REDIS_CONNECT_TIMEOUT_MS`: timeout connect.
- `REDIS_CIRCUIT_FAILURE_THRESHOLD`: số lỗi liên tiếp để mở circuit.
- `REDIS_CIRCUIT_OPEN_MS`: thời gian tạm ngưng gọi Redis khi circuit mở.

### `buildRedisUrl()`

Tạo Redis URL.

Logic:

- Nếu có `REDIS_URL`, dùng luôn.
- Nếu không, build từ `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- Nếu production mà không set host, mặc định host là `redis`.
- Nếu development mà không set host, mặc định host là `localhost`.

Lưu ý: nếu dùng `REDIS_URL`, phải tự đảm bảo URL có password nếu Redis yêu cầu password.

### `isRedisEnabled()`

Trả `false` khi:

```env
REDIS_ENABLED=false
```

Khi disabled:

- Backend không cố connect Redis.
- Không có log warn spam.
- Cache fallback DB.
- Rate limiter fallback memory.

### `isCircuitOpen()`

Kiểm tra circuit breaker có đang mở không.

Nếu Redis lỗi liên tiếp nhiều lần, circuit mở trong vài giây để request không tiếp tục bị timeout Redis.

### `recordRedisSuccess()`

Reset số lỗi và đóng circuit.

### `recordRedisFailure(command, err)`

Tăng counter lỗi Redis.

Nếu số lỗi vượt threshold:

- Mở circuit.
- Log warning.
- Metrics tăng `redis.error` và `redis.<command>.error`.

### `timeoutAfter(ms, command)`

Tạo promise reject sau `ms`.

Dùng trong `Promise.race()` để đảm bảo Redis command không treo request quá lâu.

### `runRedisCommand(command, fallback, fn)`

Wrapper an toàn cho tất cả Redis command.

Logic:

1. Nếu Redis chưa connected hoặc circuit đang mở, trả fallback ngay.
2. Chạy command Redis với timeout.
3. Thành công thì ghi latency metric và reset circuit.
4. Lỗi thì ghi metric, log warning, trả fallback.

Đây là hàm rất quan trọng vì nó đảm bảo Redis lỗi không làm API chết.

### `getRedisClient()`

Tạo hoặc trả về Redis client thật.

Cấu hình ioredis:

- `lazyConnect: false`
- `maxRetriesPerRequest: 2`
- `enableOfflineQueue: false`
- `connectTimeout`
- `commandTimeout`
- `retryStrategy` giới hạn retry

Event:

- `error`: đánh dấu disconnected, log warn.
- `ready`: đánh dấu connected.
- `close/end`: đánh dấu disconnected.

### `connectRedis(timeoutMs)`

Được gọi khi app start.

Logic:

- Nếu `REDIS_ENABLED=false`, log `Redis disabled...` và trả `false`.
- Nếu enabled, đợi event `ready`.
- Nếu quá timeout, throw `Redis connect timeout`.
- App sẽ catch lỗi và tiếp tục chạy DB fallback.

### `isRedisConnected()`

Trả `true` khi:

- Redis enabled.
- `isConnected = true`.
- client status là `ready`.
- circuit không mở.

### `safeRedisClient`

Object chứa các command an toàn:

- `get`
- `setex`
- `set`
- `del`
- `unlink`
- `sadd`
- `smembers`
- `expire`
- `incr`
- `pexpire`
- `pttl`
- `scan`
- `keys`
- `eval`

Mỗi command đều đi qua `runRedisCommand()`.

## 9. File `cacheLock.js`

File này xử lý single-flight lock để chống cache stampede.

### `DEFAULT_LOCK_TTL_MS`

Mặc định 5000ms.

Nếu request thắng lock nhưng bị lỗi hoặc chết giữa chừng, lock tự hết hạn sau 5 giây.

### `RELEASE_LOCK_SCRIPT`

Lua script:

```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
end
return 0
```

Mục đích: chỉ request giữ đúng token mới được release lock.

Nếu không có token check, request khác có thể lỡ xóa lock không thuộc về nó.

### Class `CacheLockManager`

#### `constructor(redis)`

Nhận Redis adapter. Điều này giúp test dễ hơn vì có thể truyền fake Redis.

#### `acquire(key, lockTtl)`

Logic:

1. Tạo lock key từ cache key.
2. Tạo token random.
3. Gọi Redis:

```text
SET lockKey token PX lockTtl NX
```

4. Nếu Redis trả `OK`, lock thành công.
5. Nếu không, trả `null`.

#### `release(lock)`

Gọi Lua script để xóa lock nếu token khớp.

Nếu Redis lỗi, log warn và trả false.

## 10. File `cacheTagIndex.js`

File này implement tag-based caching bằng Redis Set.

Ý tưởng:

- Mỗi cache key khi set sẽ được đăng ký vào một hoặc nhiều tag.
- Mỗi tag là một Redis Set.
- Khi invalidate tag, đọc set để biết key nào cần xóa.

Ví dụ:

```text
easytalk:v1:tag:grammar:list
  -> easytalk:v1:grammar:list:abc123
  -> easytalk:v1:grammar:list:def456
```

### `DEFAULT_TAG_SET_TTL_BUFFER`

Mặc định 86400s, tức tag set sống lâu hơn cache key 1 ngày.

Mục đích:

- Tag set không mất quá sớm.
- Nhưng cũng không tồn tại mãi.

### Class `CacheTagIndex`

#### `constructor(redis, options)`

Nhận Redis adapter và optional `tagSetTtlBuffer`.

#### `register(key, tags, ttl)`

Đăng ký key vào các tag.

Logic:

1. Bỏ tag rỗng.
2. Unique tag.
3. Với mỗi tag:
   - `SADD tag key`
   - `EXPIRE tag ttl + buffer`

#### `keysForTag(tag)`

Gọi `SMEMBERS tag` để lấy danh sách cache key thuộc tag.

## 11. File `cacheService.js`

Đây là trung tâm điều phối cache.

### Hằng số

- `DEFAULT_WAIT_MS = 60`
- `DEFAULT_WAIT_ATTEMPTS = 20`

Khi request không lấy được lock, nó chờ tối đa khoảng:

```text
60ms * 20 = 1200ms
```

để request thắng lock query DB và set cache.

### `sleep(ms)`

Utility delay dùng trong vòng chờ lock.

### Class `CacheService`

#### `constructor(redis = getSafeRedisClient())`

Khởi tạo:

- `this.redis`
- `this.tagIndex = new CacheTagIndex(redis)`
- `this.locks = new CacheLockManager(redis)`

Thiết kế này tốt cho test vì có thể inject fake Redis.

#### `getEntry(key)`

Đọc raw JSON từ Redis và parse.

Logic:

1. `redis.get(key)`.
2. Nếu null/undefined, trả `undefined`.
3. Parse bằng `parseCacheEntry()`.
4. Nếu JSON lỗi:
   - tăng metric `cache.parse_error`
   - log warn
   - trả `undefined`

Ý nghĩa: cache corrupt không làm API lỗi, chỉ coi như cache miss.

#### `get(key)`

Wrapper đơn giản để lấy data.

Nếu entry fresh/stale/legacy thì trả `entry.data`.

Hàm này dùng cho middleware hoặc thao tác đọc cache đơn giản.

#### `set(key, ttl, value, options)`

Set value vào Redis.

Logic:

1. Nếu `value === undefined`, bỏ qua.
2. Nếu ttl <= 0, bỏ qua.
3. Serialize value bằng `serializeCacheValue()`.
4. Nếu payload vượt `MAX_CACHE_PAYLOAD_BYTES`, bỏ qua và log warn.
5. `SETEX key redisTtl serialized`.
6. Đăng ký key vào tag index.
7. Tăng metric `cache.set`.
8. Nếu lỗi, tăng `cache.set_error` và log warn.

Điểm quan trọng: cache set lỗi không làm request lỗi.

#### `delete(...keys)`

Xóa nhiều key bằng `UNLINK`.

`UNLINK` tốt hơn `DEL` cho production vì Redis xóa bất đồng bộ hơn, giảm block event loop Redis khi key lớn.

#### `scanAndDelete(pattern)`

Scan key theo pattern rồi xóa.

Hiện hàm này vẫn giữ lại để tương thích hoặc dùng khi cần khẩn cấp, nhưng luồng chính không dùng pattern scan nữa. Luồng chính dùng tag-based invalidation.

#### `invalidatePatterns(patterns, label)`

Invalidate bằng pattern.

Logic:

- Duyệt từng pattern.
- Gọi `scanAndDelete`.
- Ghi metric/log.

Khuyến nghị: hạn chế dùng trong request path production lớn.

#### `invalidateTags(tags, label)`

Invalidate theo tag.

Logic:

1. Unique tags.
2. Với mỗi tag:
   - `SMEMBERS tag` lấy danh sách cache key.
   - `UNLINK` các cache key.
   - xóa chính tag set.
3. Tăng `cache.invalidate_count`.
4. Log số key đã xóa.

Đây là invalidation chính hiện tại.

#### `acquireLock(key, lockTtl)`

Gọi `CacheLockManager.acquire()`.

#### `releaseLock(lock)`

Gọi `CacheLockManager.release()`.

#### `refreshInBackground(key, ttl, fetchFn, options)`

Dùng cho stale-while-revalidate.

Logic:

1. Khi request đọc được stale cache, vẫn trả data stale ngay.
2. Đồng thời chạy refresh nền.
3. Refresh nền cũng cố lấy lock.
4. Nếu lấy được lock:
   - query DB bằng `fetchFn`
   - set cache mới
   - release lock
5. Nếu lỗi, log warn.

Mục đích: user không phải chờ DB khi cache chỉ vừa hết fresh TTL.

#### `normalizeGetOrSetOptions(ttlOrOptions)`

Chuẩn hóa options truyền vào `getOrSet()`.

Nếu truyền object:

- `ttl`
- `staleTtl`
- `tags`
- `enabled`
- `lockTtl`
- `waitMs`
- `waitAttempts`
- `jitterRatio`
- `wrap`

Nếu truyền number, hiểu là TTL legacy.

#### `getOrSet(key, ttlOrOptions, fetchFn)`

Đây là hàm quan trọng nhất của cache service.

Luồng đầy đủ:

1. Chuẩn hóa options.
2. Nếu cache disabled hoặc ttl <= 0:
   - gọi thẳng `fetchFn()`.
3. Đọc cache bằng `getEntry(key)`.
4. Nếu fresh hoặc legacy:
   - tăng `cache.hit`
   - trả cache data.
5. Nếu stale:
   - tăng `cache.hit_stale`
   - gọi `refreshInBackground()`
   - trả data stale ngay.
6. Nếu miss:
   - tăng `cache.miss`
   - thử acquire lock.
7. Nếu lấy được lock:
   - query DB bằng `fetchFn()`
   - set Redis
   - release lock
   - trả data.
8. Nếu không lấy được lock và Redis unavailable:
   - tăng `cache.lock_skipped_redis_unavailable`
   - query DB
   - thử set cache
   - trả data.
9. Nếu không lấy được lock nhưng Redis vẫn available:
   - chờ ngắn nhiều lần.
   - mỗi lần chờ xong đọc lại cache.
   - nếu cache có data thì trả data.
10. Nếu chờ hết mà vẫn không có cache:
   - tăng `cache.lock_wait_timeout`
   - query DB
   - set cache
   - trả data.

Đây là cơ chế chống cache stampede.

## 12. File `cacheInvalidation.js`

File này chứa helper invalidation dùng chung cho các content module.

### `unique(values)`

Lọc falsy value và loại trùng.

### `invalidateContentCache(module, label, options)`

Dùng cho các module có logic giống nhau như grammar, story, pronunciation, exercise.

Options:

- `id`: id item.
- `slug`: slug item.
- `slugs`: danh sách slug, thường gồm slug cũ và slug mới khi update.
- `extraTags`: tag liên quan ngoài module hiện tại.

Logic:

1. Luôn invalidate:
   - `<module>:list`
   - `<module>:all`
2. Nếu có id:
   - invalidate `<module>:item:<id>`
3. Nếu không có id:
   - invalidate `<module>:item`
4. Nếu có slug/slugs:
   - invalidate `<module>:slug:<slug>`
5. Nếu không có id và không có slug:
   - invalidate `<module>:slug`
6. Gắn thêm `extraTags`.
7. Gọi `cache.invalidateTags()`.

Ví dụ update grammar có slug đổi:

```js
invalidateGrammarCache({
  id,
  slugs: [existing.slug, document.slug]
})
```

Kết quả:

- Xóa grammar list.
- Xóa grammar item id.
- Xóa slug cũ.
- Xóa slug mới.
- Xóa userprogress detail tag nếu có response userprogress nhúng title grammar.

## 13. File `cacheMetrics.js`

File này là metrics in-memory.

### `increment(name, value = 1)`

Tăng counter.

Ví dụ:

- `cache.hit`
- `cache.miss`
- `cache.set`
- `cache.set_error`
- `cache.invalidate_count`
- `redis.get.error`

### `observe(name, durationMs)`

Ghi timing.

Ví dụ:

- `redis.get.latencyMs`
- `redis.setex.latencyMs`
- `cache.stampede_lock_wait_ms`

Nó lưu:

- count
- totalMs
- minMs
- maxMs

### `snapshot()`

Trả toàn bộ metrics hiện tại.

Có thêm:

```js
rates: {
  hitRate,
  missRate
}
```

Hit rate được tính từ `cache.hit` và `cache.miss`.

### `reset()`

Xóa toàn bộ counters và timings.

Lưu ý production: metrics này hiện là in-memory, phù hợp quan sát local/single instance. Nếu chạy nhiều instance backend, cần đẩy sang Prometheus/APM/Datadog để tổng hợp.

## 14. File `logger.js`

Logger đơn giản có level.

### `levels`

Thứ tự:

- `error`
- `warn`
- `info`
- `debug`

### `configuredLevel`

Lấy từ `LOG_LEVEL`.

Nếu không có:

- production: `info`
- development: `debug`

### `shouldLog(level)`

Kiểm tra log level hiện tại có được ghi không.

### `format(level, message, meta)`

Format log.

- Production: JSON string.
- Development: text dễ đọc.

### `write(level, message, meta)`

Ghi ra `console.error`, `console.warn`, hoặc `console.log`.

### Export

```js
logger.error()
logger.warn()
logger.info()
logger.debug()
```

Mục đích là bỏ dần `console.log` trực tiếp trong cache layer.

## 15. File `cacheMiddleware.js`

Middleware cache HTTP vẫn tồn tại, nhưng được giới hạn rủi ro.

Khuyến nghị hiện tại: ưu tiên service-layer cache. Middleware chỉ nên dùng cho public GET response đơn giản.

### `normalizeCacheOptions(options)`

Cho phép truyền number hoặc object.

Nếu number:

```js
{ ttl: options, keyPrefix: "cache:", enabled: true }
```

Nếu object:

- `ttl`
- `keyPrefix`
- `enabled`
- `keyGenerator`
- `cacheAuthenticated`
- `tags`

### `cacheMiddleware(options)`

Luồng:

1. Nếu disabled, next.
2. Nếu không phải GET, next.
3. Nếu request có `req.user` mà không bật `cacheAuthenticated`, skip cache.
4. Nếu Redis chưa connected, skip cache.
5. Build cache key:
   - Nếu có `keyGenerator`, dùng nó.
   - Nếu không, dùng `buildCacheKey()` với method/path/query/role/userId/locale.
6. Đọc cache.
7. Nếu hit, `res.json(cachedData)`.
8. Nếu miss, override `res.json`.
9. Khi response status < 400, set cache.

Điểm bảo vệ quan trọng:

- Protected endpoint không bị cache mặc định.
- Nếu bắt buộc cache authenticated endpoint thì key phải có userId/role/locale/query.

### `invalidateCache(tagOrTags)`

Invalidate HTTP cache theo tag.

### `clearCacheByKey(key)`

Xóa chính xác một cache key.

### `cacheResponse(keyGenerator, ttl)`

Helper legacy để cache response theo custom key generator.

## 16. File `rateLimiter.js`

Redis còn được dùng cho rate limiter.

Đây không phải response cache, nhưng vẫn dùng `safeRedisClient`.

### `getClientIp(req)`

Lấy IP client.

Ưu tiên:

- `x-forwarded-for`
- `req.ip`
- `req.socket.remoteAddress`

Nếu `x-forwarded-for` có nhiều IP, lấy IP đầu tiên.

### `cleanupMemoryStore()`

Xóa record rate limit in-memory đã hết hạn.

### `incrementRedisCounter(key, windowMs)`

Tăng counter trong Redis.

Logic:

1. Lấy safe Redis client.
2. Nếu Redis unavailable, trả `null`.
3. `INCR key`.
4. Nếu count = 1, set `PEXPIRE key windowMs`.
5. Lấy `PTTL key`.
6. Trả `{ count, resetAt }`.

### `incrementMemoryCounter(key, windowMs)`

Fallback in-memory khi Redis unavailable.

Logic:

- Nếu key chưa có hoặc hết hạn, tạo record mới.
- Nếu còn hạn, tăng count.

### `createRateLimiter({ windowMs, max, keyPrefix, keyGenerator, message })`

Tạo middleware rate limit.

Luồng:

1. Build key theo IP hoặc `keyGenerator`.
2. Thử Redis counter.
3. Nếu Redis lỗi/unavailable, dùng memory counter.
4. Set response headers:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `X-RateLimit-Reset`
5. Nếu quá limit, trả 429.

Ý nghĩa: khi chạy nhiều backend instance, Redis giúp rate limit đồng bộ hơn. Nếu Redis chết, vẫn có fallback local memory.

## 17. File `envValidator.js`

File này validate ENV khi app start.

### `parseEnvFile(filePath)`

Đọc file env thành object.

Dùng để so sánh JWT secret development và production.

### `validateJwtSecret()`

Kiểm tra JWT secret:

- Bắt buộc có.
- Tối thiểu 32 ký tự.
- Production tối thiểu 64 ký tự.
- Production không được trùng development.

### `validateEnv()`

Gọi `validateJwtSecret()`.

Thêm rule Redis:

```js
if (process.env.NODE_ENV === "production" && !process.env.REDIS_PASSWORD) {
  throw new Error("REDIS_PASSWORD is required in production.");
}
```

Mục đích: production không được chạy Redis không password.

## 18. File `cacheAdminService.js`

File này phục vụ admin/internal cache operations.

### `DEFAULT_WARM_UP_MODULES`

Mặc định warm-up:

- `journey`
- `grammar`
- `story`

### `timingSafeTokenEqual(expected, provided)`

So sánh token bằng hash SHA-256 và `crypto.timingSafeEqual`.

Mục đích: tránh timing attack khi so sánh `CACHE_ADMIN_TOKEN`.

### `hasInternalCacheToken(req)`

Kiểm tra header:

```text
x-cache-admin-token
```

So với `CACHE_ADMIN_TOKEN`.

Nếu khớp, request được xem là internal cache admin request.

### `tagsForModule(moduleName, resource, id)`

Build tags cần purge cho một module.

Nếu truyền resource:

```js
tagsForModule("grammar", "item", id)
```

Trả về tag cụ thể.

Nếu không truyền resource:

- tag `module:all`
- tất cả resource tags đã khai báo trong registry

### `allKnownTags()`

Lấy toàn bộ tags của các module đã khai báo.

### `purgeTagsForTarget({ module, resource, id, all })`

Build danh sách tag cần purge theo request body.

Nếu `all = true`, purge tất cả known tags.

Nếu module không hợp lệ, trả mảng rỗng.

### `warmUpSelectedCache(services, selectedModules)`

Warm cache bằng cách gọi service read hot data.

Hiện hỗ trợ:

- journey list
- journey details all
- grammar page đầu
- story page đầu
- pronunciation page đầu

Nếu không truyền module, dùng `DEFAULT_WARM_UP_MODULES`.

## 19. File `cacheController.js`

Đăng ký các endpoint quản trị cache.

Base route trong `app.js`:

```text
/cache
```

### `internalOrAdmin(req, res, next)`

Cho phép request nếu:

1. Có `x-cache-admin-token` đúng.
2. Hoặc pass `verifyAdmin`.

### `warmUpSelectedCache(selectedModules)`

Wrapper gọi `cacheAdminService.warmUpSelectedCache()`.

### `GET /cache/api/metrics`

Trả metrics hiện tại.

Response:

```js
{
  success: true,
  metrics: metrics.snapshot()
}
```

### `POST /cache/api/purge`

Manual purge theo module/resource/id/all.

Ví dụ body:

```json
{ "module": "grammar" }
```

Hoặc:

```json
{ "all": true }
```

### `POST /cache/api/warm-up`

Warm cache thủ công.

Ví dụ:

```json
{ "modules": ["journey", "grammar", "story"] }
```

### `POST /cache/api/metrics/reset`

Reset metrics in-memory.

## 20. File `app.js`

Các thay đổi liên quan Redis/cache:

### Load env

App load `.env.production` nếu runtime production, ngược lại `.env.development`.

### `validateEnv()`

Validate JWT và Redis password production.

### `initRedis()`

Logic:

1. Gọi `connectRedis(5000)`.
2. Nếu trả `true`, log Redis connected.
3. Nếu Redis disabled, `connectRedis()` trả `false`, không báo lỗi.
4. Nếu lỗi/timeout, log:
   - Redis init failed.
   - Running without Redis cache.

Backend vẫn chạy kể cả Redis chết.

### Route cache admin

```js
app.use("/cache", controllers.cacheController);
```

### `initCacheWarmUp()`

Nếu:

```env
CACHE_WARM_UP_ON_START=true
```

thì app gọi warm-up cache sau khi init background tasks.

## 21. File `bootstrap/dependencies.js`

File này inject cache service vào các module service.

Điểm quan trọng:

```js
const cacheService = require('../shared/utils/cacheService');
```

Sau đó truyền `cacheService` vào:

- GrammarService
- PronunciationService
- StoryService
- GrammarExerciseService
- PronunciationExerciseService
- VocabularyExerciseService
- DictationExerciseService
- JourneyService
- GateService
- StageService

`cacheController.setCacheServices(services)` giúp cache admin service gọi warm-up qua các service thật.

Thiết kế này giúp:

- Service có thể dùng cache chung.
- Test có thể inject fake cache.
- Warm-up có thể dùng chính logic service production.

## 22. Các module content: grammar, story, pronunciation, exercises

Các module này có logic gần giống nhau. Vì vậy tài liệu giải thích một lần bằng ví dụ `grammar`; các module còn lại tương tự.

Các module tương tự gồm:

- `grammar`
- `story`
- `pronunciation`
- `grammarexercise`
- `pronunciationexercise`
- `vocabularyexercise`
- `dictationexercise`

### Ví dụ `GrammarService.getGrammarList()`

Logic:

1. Build key:

```js
cacheNs.listKey("grammar", { page, limit, search, role })
```

2. Chọn policy:

```js
policies.contentList("grammar", role)
```

3. Gắn tags:

```js
cacheNs.listTags("grammar")
```

4. Gọi:

```js
cache.getOrSet(cacheKey, options, async () => {
  // query DB
})
```

Nếu cache hit, không query repository.

Nếu miss, query repository và set cache.

### `getGrammar(id)`

Dùng key:

```js
cacheNs.itemKey("grammar", id)
```

Gắn tags:

```js
cacheNs.itemTags("grammar", id)
```

### `getGrammarBySlug(slug)`

Dùng key:

```js
cacheNs.slugKey("grammar", slug)
```

Gắn tags:

```js
cacheNs.itemTags("grammar", null, slug)
```

### `insertGrammar()`

Sau khi insert DB thành công:

```js
invalidateGrammarCache({ id: result.insertedId, slug: document.slug })
```

Xóa:

- grammar list
- grammar item id nếu có
- grammar slug
- grammar all
- userprogress detail nếu cần

### `updateGrammar()`

Trước khi update, service lấy existing item để biết slug cũ.

Sau update:

```js
invalidateGrammarCache({
  id,
  slugs: [existing.slug, document.slug]
})
```

Điều này quan trọng vì slug có thể đổi. Nếu chỉ xóa slug mới, slug cũ vẫn có thể còn cache sai.

### `deleteGrammar()`

Sau khi delete DB:

```js
invalidateGrammarCache({ id, slug: existing.slug })
```

## 23. Cache helper của các content module

Các file:

- `apps/src/modules/grammar/utils/cacheHelper.js`
- `apps/src/modules/story/utils/cacheHelper.js`
- `apps/src/modules/pronunciation/utils/cacheHelper.js`
- `apps/src/modules/grammarexercise/utils/cacheHelper.js`
- `apps/src/modules/pronunciationexercise/utils/cacheHelper.js`
- `apps/src/modules/vocabularyexercise/utils/cacheHelper.js`
- `apps/src/modules/dictationexercise/utils/cacheHelper.js`

Các helper này đều gọi `invalidateContentCache()`.

Một số module thêm:

```js
extraTags: [cacheNs.tag("userprogress", "detail")]
```

Lý do: nếu user progress detail hoặc response liên quan có nhúng title/name của content, update content cần invalidate user progress detail để tránh stale data.

## 24. Module journey

File chính:

- `apps/src/modules/journey/services/journeyService.js`
- `apps/src/modules/journey/utils/cacheHelper.js`

### `getJourneyList(page, limit)`

Cache list journey:

- key: `journey:list:<query-hash>`
- tags: `journey:list`, `journey:all`
- policy: relation list

### `getAllJourneysWithDetails()`

Cache toàn bộ journey kèm gate/stage details.

Key:

```js
cacheNs.key("journey", "details", { id: "all" })
```

Tags:

- `journey:details`
- `journey:all`

### `getJourneyWithDetails(journeyId)`

Cache detail một journey có populate.

Tags:

- `journey:details`
- `journey:details:<journeyId>`
- `journey:all`

### `invalidateJourneyCache()`

Invalidate:

- `journey:list`
- `journey:details`
- `journey:all`
- `userprogress:detail`

Vì journey có thể ảnh hưởng đến dữ liệu học tập/user progress.

## 25. Module gate

File chính:

- `apps/src/modules/gate/services/gateService.js`
- `apps/src/modules/gate/utils/cacheHelper.js`

### Cache read

Gate cache:

- list gate
- gate item
- gate theo journey

Ví dụ gate theo journey dùng:

```js
cacheNs.key("gate", "journey", { id: journeyId })
```

### `invalidateGateCache()`

Invalidate:

- `gate:list`
- `gate:item`
- `gate:journey`
- `gate:all`
- dependency tags của gate

Dependency tags của gate gồm journey tags, vì update gate làm journey detail stale.

## 26. Module stage

File chính:

- `apps/src/modules/stage/services/stageService.js`
- `apps/src/modules/stage/utils/cacheHelper.js`

### Cache read

Stage cache:

- stage list
- stage detail

### `invalidateStageCache()`

Invalidate:

- `stage:list`
- `stage:detail`
- `stage:gate`
- `stage:all`
- dependency tags của stage

Dependency tags của stage gồm:

- gate list/item/journey/all
- journey list/details/all

Lý do: journey detail có thể populate gate, gate có thể populate stage. Nếu stage đổi mà không xóa journey/gate cache thì user có thể nhìn thấy stage cũ.

## 27. Module userprogress

File chính:

- `apps/src/modules/userprogress/services/userprogressService.js`
- `apps/src/modules/userprogress/utils/cacheHelper.js`

### `getUserProgressList(page, limit, search, role)`

List user progress được cache ngắn.

Key:

```js
cacheNs.listKey("userprogress", { page, limit, search, role })
```

Policy:

```js
policies.userList()
```

TTL ngắn vì đây là dữ liệu thay đổi thường xuyên.

### Detail user progress

Các hàm như:

- `getUserProgress(id)`
- `getDetailUserProgressByUserId(userId)`
- `getUserProgressByUserId(userId)`

hiện vẫn query repository trực tiếp.

Đây là lựa chọn thận trọng vì dữ liệu user-specific thay đổi nhiều và dễ nhạy cảm. Cache sai user progress nghiêm trọng hơn cache miss.

### `invalidateUserProgressCache(userId)`

Nếu có userId:

- invalidate userprogress list
- invalidate userprogress all
- invalidate userprogress detail của user đó

Nếu không có userId:

- invalidate tag detail chung

### `invalidateUserProgressCaches(userIds)`

Invalidate nhiều userId.

Dùng trong follow/unfollow vì thao tác đó ảnh hưởng cả current user và target user.

## 28. Module flashcard

File:

- `apps/src/modules/flashcard/utils/cacheHelper.js`
- `apps/src/modules/flashcard/services/flashcardService.js`

Hiện flashcard service đang comment cache invalidation, tức không cache response flashcard cá nhân theo Redis response cache.

Điều này phù hợp với rule production:

- flashcard cá nhân thay đổi nhiều
- phụ thuộc user
- dễ sai dữ liệu nếu key không đủ định danh

`invalidateFlashcardCache()` vẫn tồn tại để dùng sau nếu có cache public/shared flashcard.

## 29. Docker Compose và ENV

### Development

Trong `.env.development` có:

```env
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...
```

Mặc định local không dùng Redis để máy nhẹ.

Khi muốn test Redis local:

1. Chạy Redis container có password.
2. Đổi:

```env
REDIS_ENABLED=true
```

3. Restart backend.

### Production

Trong `.env.production` cần:

```env
REDIS_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=...
```

Redis production không publish port 6379 ra public internet trong `docker-compose.yml`, chỉ expose nội bộ cho backend container.

Các ENV vận hành:

- `REDIS_COMMAND_TIMEOUT_MS`
- `REDIS_CONNECT_TIMEOUT_MS`
- `REDIS_CIRCUIT_FAILURE_THRESHOLD`
- `REDIS_CIRCUIT_OPEN_MS`
- `CACHE_NAMESPACE`
- `CACHE_VERSION`
- `CACHE_MAX_PAYLOAD_BYTES`
- `CACHE_ADMIN_TOKEN`
- `CACHE_WARM_UP_ON_START`
- `LOG_LEVEL`
- `REDIS_MAXMEMORY`
- `REDIS_MAXMEMORY_POLICY`
- `REDIS_APPENDONLY`

Lưu ý bảo mật: không nên ghi password thật trong tài liệu public hoặc commit lên repo public.

## 30. Test Redis cache

Các test chính:

- `apps/test/cacheService.test.js`
- `apps/test/cacheAdminService.test.js`
- `apps/test/rateLimiter.test.js`

### Test cache service đang kiểm tra gì?

- Cache miss gọi fetch DB và set cache.
- Cache hit không gọi fetch DB.
- Tag invalidation xóa đúng key.
- Redis down vẫn fallback fetch DB.
- Disabled policy bypass cache.
- Parse cache lỗi fallback như miss.
- Concurrent miss chỉ một request query DB nhờ single-flight lock.
- Lock release phải đúng token.
- Stage dependency invalidation có journey/gate tags.

### Test cache admin service

- So sánh token đúng/sai.
- Purge target build đúng tags.
- Unknown module bị reject.

### Test rate limiter

- Redis unavailable thì fallback memory.
- Lấy đúng IP đầu tiên từ `x-forwarded-for`.

## 31. Luồng cache hit chi tiết

Ví dụ user gọi:

```text
GET /grammar?page=1&limit=12&search=&role=user
```

Service gọi:

```js
getGrammarList(1, 12, "", "user")
```

Luồng:

1. Build key:

```text
easytalk:v1:grammar:list:<hash>
```

2. Gọi `cache.getOrSet()`.
3. Redis `GET key`.
4. Nếu có data fresh:
   - tăng `cache.hit`
   - trả data ngay
   - không gọi MongoDB.

## 32. Luồng cache miss chi tiết

Nếu key chưa có:

1. `cache.miss + 1`
2. Tạo lock key:

```text
easytalk:v1:lock:<hash>
```

3. Request đầu tiên `SET lock NX PX`.
4. Request thắng lock query MongoDB.
5. Serialize data.
6. `SETEX cacheKey ttl data`.
7. Register cache key vào tags:

```text
easytalk:v1:tag:grammar:list
easytalk:v1:tag:grammar:all
```

8. Release lock bằng Lua script.
9. Trả data.

## 33. Luồng concurrent request khi cache miss

Giả sử 100 request cùng gọi grammar list khi key hết hạn.

1. Cả 100 request cùng miss.
2. Chỉ 1 request lấy được lock Redis.
3. Request thắng lock query MongoDB.
4. 99 request còn lại chờ ngắn.
5. Khi request đầu set cache xong, các request đang chờ đọc lại Redis và trả cache.
6. DB không bị 100 query cùng lúc.

Nếu chờ hết mà cache vẫn chưa có, request sẽ query DB để không treo user quá lâu.

## 34. Luồng stale-while-revalidate

Với dữ liệu public có `staleTtl > 0`:

1. Trong TTL fresh: trả cache bình thường.
2. Sau fresh TTL nhưng trước staleUntil:
   - trả data stale ngay.
   - chạy refresh nền.
3. Refresh nền:
   - lấy lock.
   - query DB.
   - set cache mới.
4. User không phải chờ DB trong lúc refresh.

Đây là cách giảm spike DB khi cache vừa hết hạn.

## 35. Luồng invalidate khi update content

Ví dụ update story:

1. Service lấy existing story để biết slug cũ.
2. Update DB.
3. Gọi:

```js
invalidateStoryCache({
  id,
  slugs: [existing.slug, document.slug]
})
```

4. Helper build tags:

- `story:list`
- `story:all`
- `story:item:<id>`
- `story:slug:<oldSlug>`
- `story:slug:<newSlug>`
- `userprogress:detail`

5. `cache.invalidateTags()` đọc các Redis Set tag.
6. Xóa các cache key thuộc tags đó bằng `UNLINK`.
7. Xóa tag set.

## 36. Luồng Redis disabled local

Khi:

```env
REDIS_ENABLED=false
```

Luồng:

1. App start.
2. `connectRedis()` trả `false`.
3. App không báo lỗi Redis.
4. `safeRedisClient.isAvailable()` trả false.
5. Cache get trả fallback.
6. Service query DB bình thường.

Đây là mode local nhẹ máy.

## 37. Luồng Redis down

Khi `REDIS_ENABLED=true` nhưng Redis không chạy hoặc lỗi:

1. App cố connect Redis.
2. Nếu timeout, app log Redis init failed.
3. Server vẫn chạy.
4. Mỗi Redis command đi qua safe wrapper.
5. Nếu Redis unavailable, trả fallback.
6. Nếu lỗi liên tiếp, circuit breaker mở.
7. Trong lúc circuit mở, request bỏ qua Redis nhanh hơn.

## 38. Đã làm được những gì

Phần Redis cache hiện tại đã có:

- Chuẩn hóa cache key.
- Versioning cache key.
- Query hash thay vì nối raw search/filter.
- Cache namespace registry.
- Cache policy theo domain.
- TTL khác nhau theo loại dữ liệu.
- TTL jitter.
- Stale-while-revalidate.
- Single-flight lock chống stampede.
- Tag-based invalidation.
- Dependency invalidation giữa stage/gate/journey.
- Exact-ish invalidation theo id/slug/list tag.
- Redis safe wrapper.
- Command timeout.
- Circuit breaker.
- `REDIS_ENABLED=false` cho local.
- Fallback DB khi Redis lỗi.
- Logger có level.
- Metrics hit/miss/set/error/latency.
- Admin/internal cache metrics endpoint.
- Manual purge endpoint.
- Warm-up endpoint và warm-up on start.
- Payload size guard.
- Rate limiter dùng Redis và fallback memory.
- Test behavior cache quan trọng.
- Docker Compose Redis production không expose public port.
- Production yêu cầu `REDIS_PASSWORD`.

## 39. Những điểm vẫn cần nhớ khi vận hành production lớn

Thiết kế hiện tại tốt cho production vừa và khá lớn, nhưng nếu lên mức doanh nghiệp hoặc traffic rất cao, nên tiếp tục nâng cấp:

1. Metrics nên đưa ra Prometheus/APM thay vì chỉ in-memory.
2. Redis nên có HA, ví dụ managed Redis, Sentinel hoặc Cluster.
3. Tag invalidation có thể làm atomic hơn bằng Lua script nếu traffic update cực cao.
4. Nên có integration test với Redis thật trong CI.
5. Nên monitor số lượng tag set và memory Redis.
6. Nên có background job cho purge lớn nếu cache key/cardinality tăng mạnh.
7. Nên có dashboard hit rate/miss rate theo module.
8. Nên review kỹ mọi endpoint protected trước khi cache.
9. Khi đổi response schema, tăng `CACHE_VERSION` từ `v1` lên `v2`.
10. Không cache dữ liệu user-sensitive nếu key không có userId/role/locale đầy đủ.

## 40. Cách đọc code nhanh cho developer mới

Nếu muốn hiểu Redis cache trong dự án, đọc theo thứ tự này:

1. `apps/src/shared/utils/cacheKeyBuilder.js`
2. `apps/src/shared/utils/cacheNamespaces.js`
3. `apps/src/shared/utils/cachePolicies.js`
4. `apps/src/shared/utils/cacheSerializer.js`
5. `apps/src/shared/utils/redisClient.js`
6. `apps/src/shared/utils/cacheLock.js`
7. `apps/src/shared/utils/cacheTagIndex.js`
8. `apps/src/shared/utils/cacheService.js`
9. Một service mẫu: `apps/src/modules/grammar/services/grammarService.js`
10. Một helper mẫu: `apps/src/modules/grammar/utils/cacheHelper.js`
11. Relation cache: `journey`, `gate`, `stage`
12. User-specific cache: `userprogress`
13. Admin operations: `modules/cache`
14. Tests trong `apps/test`

## 41. Kết luận

Redis cache hiện tại đã được chuyển từ kiểu cache đơn giản sang một kiến trúc có tổ chức:

- Key được chuẩn hóa.
- Policy được tập trung.
- Invalidation đi theo tag và dependency.
- Redis lỗi không làm app chết.
- Có chống stampede và stale cache.
- Có metrics, logging, purge, warm-up.
- Có test behavior quan trọng.

Điểm quan trọng nhất của thiết kế này là cache nằm chủ yếu ở service layer. Service biết dữ liệu nào public, dữ liệu nào user-specific, dữ liệu nào populate từ module khác, vì vậy cache an toàn và dễ kiểm soát hơn middleware generic.

Với quy mô dự án hiện tại, thiết kế này đủ tốt để chạy production thực tế mức vừa đến khá lớn. Khi traffic tăng mạnh hoặc backend chạy nhiều instance, bước tiếp theo nên là observability chuẩn, Redis HA và integration/load test với Redis thật.
