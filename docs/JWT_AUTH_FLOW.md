# Tài liệu JWT và cơ chế xác thực của EasyTalk

Tài liệu này giải thích chi tiết cách JWT đang hoạt động trong dự án EasyTalk, gồm cả frontend và backend. Nội dung bám theo code hiện tại sau khi đã nâng cấp bảo mật: access token lưu ở memory, refresh token lưu bằng HttpOnly cookie, refresh token rotation, lưu session trong MongoDB, kiểm tra `tokenVersion`, kiểm tra role thật từ DB, rate limit, CSRF origin check và security audit log.

## 1. Vấn đề ban đầu của JWT trong dự án

Trước khi nâng cấp, cơ chế JWT có một số vấn đề thường gặp trong các dự án nhỏ:

1. Frontend từng xử lý token theo cách không thống nhất.

   Một số service tự gọi `fetch`, tự gắn token hoặc tự đọc response. Khi backend thống nhất response bằng `responseFormatter`, frontend bị lệch format, ví dụ API trả:

   ```json
   {
     "success": true,
     "data": {
       "token": "...",
       "refreshToken": "..."
     }
   }
   ```

   nhưng frontend lại đọc token ở cấp ngoài, dẫn tới lỗi kiểu `Login response is missing a valid token`.

2. Refresh token từng nằm ở frontend/localStorage hoặc đi qua URL social login.

   Cách này không phù hợp production vì:

   - `localStorage` dễ bị đọc nếu web có XSS.
   - Token trong URL có thể dính vào browser history, log, analytics, referrer.

3. Refresh token từng được quản lý bằng RAM/Map.

   Nếu server restart thì mất refresh token, user bị logout. Nếu deploy nhiều instance/load balancer, request refresh có thể đi vào instance khác và lỗi.

4. Access token cũ vẫn sống đến khi hết hạn.

   Nếu admin khóa user, đổi role admin xuống user, hoặc user đổi mật khẩu, access token cũ vẫn có thể dùng tới 15 phút nếu backend chỉ verify chữ ký JWT.

5. `verifyAdmin` từng có nguy cơ tin role trong token.

   Nếu role trong DB đã bị hạ nhưng access token cũ vẫn ghi `role: "admin"`, route admin vẫn có thể bị dùng cho tới khi access token hết hạn.

6. Refresh token chưa có rotation.

   Một refresh token có thể dùng lại nhiều lần trong 7 ngày. Production thường nên rotate refresh token sau mỗi lần refresh.

Các nâng cấp hiện tại đã giải quyết phần lớn các vấn đề trên.

## 2. Kiến trúc JWT hiện tại

Dự án hiện dùng 2 loại token:

1. Access token

   - Là JWT ngắn hạn.
   - Hết hạn sau 15 phút.
   - Frontend lưu trong biến memory `accessToken`, không lưu localStorage.
   - Được gửi qua header:

   ```http
   Authorization: Bearer <access_token>
   ```

2. Refresh token

   - Là JWT dài hạn hơn.
   - Hết hạn sau 7 ngày.
   - Có payload riêng với `type: "refresh"` và `sessionId`.
   - Không lưu localStorage.
   - Backend set vào HttpOnly cookie.
   - Production dùng cookie tên `__Host-refreshToken`.
   - Development dùng cookie tên `refreshToken`.
   - Backend chỉ lưu hash của refresh token trong collection `usersessions`.

Luồng tổng quát:

```txt
Login thành công
  -> Backend tạo access token + refresh token
  -> Backend trả access token trong response
  -> Backend set refresh token vào HttpOnly cookie
  -> Frontend lưu access token trong memory

Gọi API cần đăng nhập
  -> Frontend gắn Authorization: Bearer access token
  -> Backend verify access token
  -> Backend check user trong DB, active, tokenVersion

Access token hết hạn
  -> API trả 401 TOKEN_EXPIRED
  -> Frontend gọi /user/refresh-token
  -> Browser tự gửi refresh cookie
  -> Backend verify refresh token + session DB
  -> Backend rotate refresh token
  -> Backend set refresh cookie mới
  -> Frontend nhận access token mới
  -> Frontend retry request cũ
```

## 3. Backend: file `authenticationService.js`

File: `apps/src/modules/user/services/authenticationService.js`

Đây là service trung tâm xử lý tạo token, verify refresh token, rotate refresh token và revoke session.

### Hằng số chính

```js
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
const JWT_ALGORITHM = "HS256";
```

Ý nghĩa:

- Refresh token sống 7 ngày.
- `REFRESH_TOKEN_EXPIRES_IN_MS` dùng để ghi `expiresAt` vào MongoDB.
- `JWT_ALGORITHM = "HS256"` giúp cố định thuật toán ký/verify JWT, tránh rủi ro algorithm confusion.

### `createAuthError(message, code)`

Tạo object `Error` có thêm `code`.

Dùng khi cần frontend biết lỗi thuộc loại gì, ví dụ:

```js
REFRESH_TOKEN_REUSED
```

Code này giúp frontend có thể retry trong một số race condition khi nhiều request refresh gần như đồng thời.

### `createSessionId()`

Tạo session id ngẫu nhiên cho refresh token.

Ưu tiên:

```js
crypto.randomUUID()
```

Nếu môi trường Node không hỗ trợ thì fallback:

```js
crypto.randomBytes(32).toString("hex")
```

Session id này được nhúng vào refresh token và cũng được lưu trong DB. Khi verify refresh token, backend so sánh `decoded.sessionId` với session trong DB để chắc chắn token và session khớp nhau.

### `getRequestMetadata(req)`

Lấy thông tin request:

- `userAgent`
- `ipAddress`

Dữ liệu này được lưu vào `usersessions` để hiển thị thiết bị/session và phục vụ audit.

### `constructor(deps = {})`

Khởi tạo:

```js
this.sessionRepository = deps.sessionRepository || new UserSessionRepository();
this.securityAuditService = deps.securityAuditService || new SecurityAuditService();
```

Service này phụ thuộc vào:

- `UserSessionRepository`: thao tác collection `usersessions`.
- `SecurityAuditService`: ghi log bảo mật vào `securitylogs`.

### `generateAccessToken(user)`

Tạo access token ngắn hạn.

Payload gồm:

```js
{
  id: user._id,
  role: user.role,
  username: user.username,
  email: user.email,
  tokenVersion: user.tokenVersion || 0
}
```

Token được ký bằng:

```js
config.jwt.secret
```

Options:

```js
{ expiresIn: "15m", algorithm: JWT_ALGORITHM }
```

Điểm quan trọng là `tokenVersion`. Khi user đổi mật khẩu, bị khóa, bị hạ quyền hoặc logout all sessions, backend tăng `tokenVersion` trong DB. Access token cũ vẫn còn chữ ký hợp lệ, nhưng `verifyToken` sẽ so `tokenVersion` trong JWT với DB. Nếu lệch, token bị reject ngay.

### `hashRefreshToken(refreshToken)`

Hash refresh token bằng SHA-256:

```js
crypto.createHash("sha256").update(refreshToken).digest("hex")
```

Backend không lưu raw refresh token trong MongoDB. Nếu database bị lộ, attacker không lấy được refresh token gốc để gọi API refresh.

### `generateRefreshToken(user, req = null)`

Tạo refresh token mới.

Payload:

```js
{
  id: user._id,
  type: "refresh",
  sessionId
}
```

Options:

```js
{ expiresIn: "7d", algorithm: "HS256" }
```

Sau khi tạo JWT, service lưu session vào MongoDB:

```js
await this.sessionRepository.create({
  userId: user._id,
  sessionId,
  refreshTokenHash: this.hashRefreshToken(token),
  expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
  ...metadata
});
```

MongoDB chỉ lưu hash token, session id, thời hạn, user agent, IP và trạng thái revoke.

### `decodeRefreshToken(refreshToken)`

Verify JWT refresh token bằng secret và algorithm `HS256`.

Các bước:

1. Nếu không có refresh token thì throw lỗi.
2. Verify token bằng `jwt.verify`.
3. Check `decoded.type === "refresh"`.
4. Nếu token hết hạn hoặc sai chữ ký thì throw lỗi.

Hàm này chỉ kiểm tra JWT có hợp lệ về mặt chữ ký, hết hạn và đúng loại token. Việc check session trong DB nằm ở `verifyRefreshToken`.

### `verifyRefreshToken(refreshToken)`

Đây là hàm quan trọng nhất cho refresh token.

Các bước:

1. Decode và verify refresh token.
2. Hash refresh token.
3. Tìm session trong DB bằng `refreshTokenHash`.
4. Nếu không có session thì token không hợp lệ.
5. Nếu session đã bị revoke:
   - Nếu `revokeReason === "rotated"` thì trả lỗi `REFRESH_TOKEN_REUSED`.
   - Nếu không phải rotated, coi là reuse token nguy hiểm, revoke toàn bộ session của user và ghi audit log `refresh_token_reuse_detected`.
6. Nếu session hết hạn thì revoke với reason `expired`.
7. Nếu `decoded.sessionId` không khớp session DB thì revoke token với reason `session_mismatch`.
8. Cập nhật `lastUsedAt`.
9. Trả về `{ decoded, session }`.

Ý nghĩa bảo mật:

- Token phải đúng chữ ký.
- Token phải có session trong DB.
- Token chưa bị revoke.
- Token chưa hết hạn.
- Token phải khớp session id.

### `rotateRefreshToken(user, refreshToken, req = null, verifiedSession = null)`

Rotate refresh token sau mỗi lần refresh.

Các bước:

1. Lấy session hiện tại.
2. Tạo refresh token mới bằng `generateRefreshToken`.
3. Decode token mới để lấy `newDecoded.sessionId`.
4. Revoke session cũ với:

```js
reason: "rotated",
replacedBySessionId: newDecoded.sessionId
```

5. Nếu revoke session cũ thất bại, revoke luôn refresh token mới với reason `rotation_failed`.

Cách này giúp refresh token chỉ được dùng một lần. Sau mỗi refresh, token cũ chết và token mới được set vào cookie.

### `revokeRefreshToken(refreshToken)`

Đăng xuất một thiết bị/session hiện tại.

Hàm hash refresh token rồi revoke session tương ứng:

```js
reason: "logout"
```

### `getSessionFromRefreshToken(refreshToken)`

Lấy session hiện tại từ refresh token.

Được dùng để xác định session nào là `current` khi user mở danh sách thiết bị.

Nếu refresh token thiếu, sai, session bị revoke hoặc session id không khớp thì trả `null`.

### `listUserSessions(userId, currentRefreshToken = null)`

Lấy danh sách session đang hoạt động của user.

Mỗi session được thêm field:

```js
current: true | false
```

để frontend biết thiết bị hiện tại là thiết bị nào.

### `revokeUserSession(userId, sessionId, reason)`

Revoke một session cụ thể của user.

Dùng cho tính năng đăng xuất một thiết bị.

### `revokeAllUserSessions(userId, reason)`

Revoke toàn bộ session còn active của user.

Dùng cho:

- Logout all sessions.
- Đổi mật khẩu.
- Reset mật khẩu.
- User bị khóa.
- User bị xóa.

### `generateTokenPair(user, req = null)`

Tạo cùng lúc:

- Access token
- Refresh token

Được gọi khi:

- Login email/password.
- Login Google.
- Login Facebook.

## 4. Backend: file `userSessionRepository.js`

File: `apps/src/modules/user/repositories/userSessionRepository.js`

Repository này làm việc với collection:

```js
usersessions
```

### `ensureIndexes()`

Tạo index:

```js
sessionId unique
refreshTokenHash unique
userId
expiresAt TTL
```

TTL index:

```js
createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

MongoDB sẽ tự xóa document khi `expiresAt` đã qua. Điều này giúp collection không phình mãi.

### `create(session)`

Tạo document session mới:

```js
{
  userId,
  sessionId,
  refreshTokenHash,
  userAgent,
  ipAddress,
  createdAt,
  updatedAt,
  expiresAt,
  revokedAt: null,
  replacedBySessionId: null,
  revokeReason: null,
  lastUsedAt: null
}
```

Mỗi lần login hoặc refresh rotation thành công sẽ tạo một session document mới.

### `findByRefreshTokenHash(refreshTokenHash)`

Tìm session bằng hash của refresh token.

Đây là cách backend kiểm tra refresh token client gửi lên có thuộc session hợp lệ không.

### `findBySessionId(sessionId)`

Tìm session bằng session id.

Hữu ích khi cần tra cứu theo id session.

### `findActiveByUserId(userId)`

Lấy các session đang active:

```js
revokedAt: null
expiresAt > now
```

Hàm này loại `refreshTokenHash` khỏi kết quả để không gửi hash token ra frontend.

### `revokeBySessionId(sessionId, options)`

Revoke một session theo session id.

Set:

```js
revokedAt
replacedBySessionId
revokeReason
updatedAt
```

Được dùng khi rotate refresh token.

### `revokeByRefreshTokenHash(refreshTokenHash, reason)`

Revoke session theo hash của refresh token.

Được dùng khi logout hoặc khi cần xử lý token mismatch.

### `revokeByUserIdAndSessionId(userId, sessionId, reason)`

Revoke một session cụ thể của một user.

Điều kiện có cả `userId` và `sessionId` giúp user không thể revoke session của người khác.

### `revokeAllByUserId(userId, reason)`

Revoke tất cả session active của user.

Được dùng khi:

- Đổi mật khẩu.
- Reset mật khẩu.
- Logout all sessions.
- User bị khóa.
- Phát hiện refresh token reuse nghiêm trọng.

### `markUsed(sessionId)`

Cập nhật:

```js
lastUsedAt
updatedAt
```

Mỗi lần refresh token được verify thành công, session được đánh dấu đã sử dụng.

## 5. Backend: file `refreshTokenCookie.js`

File: `apps/src/modules/user/utils/refreshTokenCookie.js`

File này quản lý cookie chứa refresh token.

### Cookie name

Production:

```js
__Host-refreshToken
```

Development:

```js
refreshToken
```

Lý do:

- `__Host-` là prefix an toàn hơn cho production.
- Cookie `__Host-` yêu cầu `Secure`, `Path=/` và không có `Domain`.
- Local development thường chạy HTTP nên dùng cookie thường để tránh browser reject.

### `getRefreshTokenCookieName()`

Nếu `NODE_ENV === "production"` thì dùng:

```js
__Host-refreshToken
```

Ngược lại dùng:

```js
refreshToken
```

### `getRefreshTokenCookieOptions()`

Cookie options hiện tại:

```js
{
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 7 ngày,
  path: "/"
}
```

Ý nghĩa:

- `httpOnly`: JavaScript frontend không đọc được refresh token.
- `secure`: production chỉ gửi cookie qua HTTPS.
- `sameSite: "lax"`: phù hợp mô hình frontend/backend cùng site qua Nginx `/api`, giảm rủi ro CSRF.
- `path: "/"`: cookie được gửi cho cả `/user/...` và `/api/user/...`.

### `parseCookies(cookieHeader = "")`

Parse header `Cookie` thủ công thành object.

Ví dụ:

```txt
Cookie: a=1; refreshToken=abc
```

thành:

```js
{
  a: "1",
  refreshToken: "abc"
}
```

### `getRefreshTokenFromRequest(req)`

Đọc refresh token từ cookie.

Hàm có fallback:

```js
cookies[getRefreshTokenCookieName()]
|| cookies[PRODUCTION_REFRESH_TOKEN_COOKIE]
|| cookies[LEGACY_REFRESH_TOKEN_COOKIE]
|| null
```

Điều này giúp migration mượt:

- User cũ còn cookie `refreshToken` vẫn có thể refresh.
- User mới production dùng `__Host-refreshToken`.

### `setRefreshTokenCookie(res, refreshToken)`

Set cookie mới vào response.

Trước khi set cookie mới, backend clear legacy cookie ở:

- `Path=/`
- `Path=/user`

Điều này giúp dọn cookie cũ từ các bản trước.

### `clearRefreshTokenCookie(res)`

Xóa cả cookie production và legacy:

- `__Host-refreshToken`
- `refreshToken` path `/`
- `refreshToken` path `/user`

Được dùng khi:

- Logout.
- Refresh thất bại nghiêm trọng.
- Đổi mật khẩu.
- Revoke current session.
- Logout all sessions.

## 6. Backend: file `verifyToken.js`

File: `apps/src/shared/middleware/verifyToken.js`

Đây là middleware xác thực access token.

### `normalizeTokenVersion(tokenVersion)`

Ép `tokenVersion` về number.

Giúp tránh lỗi so sánh giữa `undefined`, string và number.

### `findAuthenticatedUser(decoded)`

Lấy user thật từ DB theo id trong access token.

Projection chỉ lấy:

```js
username
email
role
active
tokenVersion
```

Hàm này giúp middleware không tin hoàn toàn vào payload JWT.

### `verifyToken(req, res, next)`

Luồng xử lý:

1. Đọc header:

```http
Authorization: Bearer <access_token>
```

2. Nếu không có token thì trả:

```js
401 NO_TOKEN
```

3. Verify JWT bằng secret và algorithm `HS256`.

4. Nếu token có `type === "refresh"` thì reject. Refresh token không được dùng thay access token.

5. Tìm user trong DB.

6. Nếu user không tồn tại thì trả `401 USER_NOT_FOUND`.

7. Nếu user bị locked thì trả `403 ACCOUNT_LOCKED`.

8. So sánh:

```js
decoded.tokenVersion === user.tokenVersion
```

Nếu lệch, trả:

```js
401 TOKEN_REVOKED
```

9. Gán `req.user` và `req.authUser`.

Điểm mạnh:

- Access token cũ bị vô hiệu ngay khi `tokenVersion` tăng.
- Role dùng trong request được lấy lại từ DB.
- User locked không thể tiếp tục gọi API.

### `verifyAdmin(req, res, next)`

Gọi `verifyToken` trước, sau đó check:

```js
req.authUser?.role === "admin"
```

Điểm quan trọng: role admin được check từ DB hiện tại, không tin role nằm trong JWT cũ.

### `optionalAuth(req, res, next)`

Cho phép request có hoặc không có token.

Nếu có token hợp lệ thì set `req.user`.

Nếu token thiếu/sai/hết hạn thì không chặn request, chỉ set:

```js
req.user = null
```

Được dùng cho logout để backend vẫn có thể xử lý logout ngay cả khi access token đã hết hạn, miễn là refresh cookie còn đó.

## 7. Backend: file `userService.js`

File: `apps/src/modules/user/services/userService.js`

Đây là nơi kết nối auth với nghiệp vụ user.

### `login(email, password, req)`

Luồng:

1. Tìm user theo email.
2. So sánh password bằng bcrypt helper.
3. Check user không bị locked.
4. Gọi `authService.generateTokenPair(user, req)`.
5. Update `lastActive`.
6. Xử lý streak/prize/user language.
7. Ghi audit log `login_success`.
8. Trả:

```js
{
  token: accessToken,
  refreshToken,
  role,
  language
}
```

Controller sẽ set refresh token vào cookie rồi xóa `refreshToken` khỏi response trước khi trả frontend.

### `loginWithGoogle(code, req)`

Luồng:

1. Gọi `socialAuthService.handleGoogleLogin`.
2. Nếu user mới thì tạo user progress, gửi email/temp password, tạo notification.
3. Tạo token pair.
4. Update `lastActive`.
5. Ghi audit log `social_login_success` với provider `google`.
6. Trả token pair cho controller.

Controller set refresh token vào cookie và redirect về frontend bằng query an toàn:

```txt
/login?socialLogin=success&provider=google
```

Không đưa token lên URL.

### `loginWithFacebook(code, req)`

Tương tự Google login nhưng provider là Facebook.

### `refreshAccessToken(refreshToken, req)`

Luồng:

1. Verify refresh token bằng `authService.verifyRefreshToken`.
2. Lấy user từ DB theo `decoded.id`.
3. Nếu user không tồn tại thì lỗi.
4. Nếu user bị locked:
   - Revoke toàn bộ session của user.
   - Throw lỗi.
5. Tạo access token mới.
6. Rotate refresh token.
7. Lấy language.
8. Trả access token mới, refresh token mới, role, language.

Controller sẽ set refresh token mới vào cookie và không trả refresh token ra body.

### `logout(refreshToken, req)`

Revoke refresh token hiện tại.

Nếu request có user thì update `lastActive`.

Trả message logout thành công.

### `listSessions(userId, refreshToken)`

Trả danh sách session đang active của user.

Dùng cho UI quản lý thiết bị/session.

### `revokeSession(userId, sessionId, req)`

Revoke một session cụ thể.

Nếu revoke thành công thì ghi audit log:

```js
session_revoked
```

### `revokeAllSessions(userId, req)`

Revoke toàn bộ session của user và tăng `tokenVersion`.

Điểm quan trọng:

- Revoke refresh token làm refresh cookie/session cũ chết.
- Tăng `tokenVersion` làm access token cũ chết ngay.

Ghi audit log:

```js
logout_all_sessions
```

### `changePassword(userId, currentPassword, newPassword, confirmNewPassword, req)`

Luồng:

1. Validate input.
2. Tìm user.
3. Check mật khẩu hiện tại.
4. Hash mật khẩu mới.
5. Gọi `repository.updatePassword`.
6. `updatePassword` vừa set password vừa tăng `tokenVersion`.
7. Revoke toàn bộ user sessions với reason `password_changed`.
8. Ghi audit log `password_changed`.

Kết quả: tất cả access token và refresh token cũ đều không còn dùng được.

### `resetPassword(email, newPassword)`

Dùng khi user quên mật khẩu.

Luồng:

1. Tìm user theo email.
2. Hash password mới.
3. Update password và tăng `tokenVersion`.
4. Revoke toàn bộ sessions với reason `password_reset`.
5. Ghi audit log `password_reset`.

### `resetTempPassword(userId, actorId, req)`

Dùng cho admin đặt lại mật khẩu tạm thời.

Luồng:

1. Tìm user.
2. Tạo temp password.
3. Hash temp password.
4. Update password và tăng `tokenVersion`.
5. Revoke toàn bộ sessions với reason `temp_password_reset`.
6. Ghi audit log `temp_password_reset`.
7. Gửi email và notification.

### `updateUser(user, actorId, req)`

Dùng cho admin update user.

Logic bảo mật:

- Nếu role thay đổi, tăng `tokenVersion`.
- Nếu user bị khóa, revoke toàn bộ sessions và tăng `tokenVersion`.
- Nếu active thay đổi, ghi audit log `user_locked` hoặc `user_unlocked`.
- Nếu role thay đổi, ghi audit log `admin_role_changed`.

Điều này giải quyết vấn đề admin token cũ hoặc user token cũ vẫn dùng được sau khi bị hạ quyền/khóa.

### `deleteUser(id)`

Khi xóa user:

1. Xóa user.
2. Revoke toàn bộ sessions.
3. Xóa notification/progress/flashcards liên quan.

## 8. Backend: file `userController.js`

File: `apps/src/modules/user/controllers/userController.js`

Controller nhận request HTTP, gọi service, set cookie và trả response.

### `getAllowedClientOrigins()`

Đọc `CLIENT_URL` từ env.

Hỗ trợ nhiều origin phân cách bằng dấu phẩy:

```env
CLIENT_URL=https://easytalk.id.vn,https://www.easytalk.id.vn
```

Mỗi origin được normalize bằng `new URL(origin).origin`.

### `validateRefreshRequestOrigin(req, res, next)`

Bảo vệ refresh endpoint khỏi CSRF.

Luồng:

1. Đọc `Origin`.
2. Nếu không có thì đọc `Referer`.
3. Production mà thiếu cả hai thì reject.
4. Normalize origin.
5. So với danh sách `CLIENT_URL`.
6. Nếu không khớp thì trả `403 CSRF_ORIGIN_FORBIDDEN`.

Vì refresh token nằm trong cookie, browser có thể tự gửi cookie theo request. Origin check giúp đảm bảo request refresh đến từ frontend hợp lệ.

### `loginRateLimiter`

Rate limit login:

```js
10 lần / phút / IP + email
```

Key:

```js
IP:email
```

Giúp chống brute force password.

### `refreshTokenRateLimiter`

Rate limit refresh:

```js
30 lần / phút / IP
```

Giúp chống spam refresh endpoint.

### `POST /user/login`

Luồng:

1. Validate email/password.
2. Gọi `userService.login`.
3. Set refresh token cookie.
4. Xóa `refreshToken` khỏi result.
5. Trả access token, role, language.

Refresh token không đi vào response body.

### `GET /user/auth/google/callback`

Luồng:

1. Nhận `code` từ Google.
2. Gọi `loginWithGoogle`.
3. Set refresh token cookie.
4. Redirect về frontend:

```txt
/login?socialLogin=success&provider=google
```

Không đưa token lên URL.

### `GET /user/auth/facebook/callback`

Tương tự Google callback.

### `POST /user/refresh-token`

Middleware:

```js
refreshTokenRateLimiter
validateRefreshRequestOrigin
```

Luồng:

1. Đọc refresh token từ cookie.
2. Gọi `userService.refreshAccessToken`.
3. Set refresh token mới vào cookie.
4. Xóa refresh token khỏi response.
5. Trả access token mới.

Nếu lỗi không phải `REFRESH_TOKEN_REUSED`, controller clear refresh cookie.

Trường hợp `REFRESH_TOKEN_REUSED` được giữ cookie để tránh race condition làm response cũ xóa cookie mới.

### `GET /user/sessions`

Yêu cầu `verifyToken`.

Trả danh sách session active của user.

### `DELETE /user/sessions/:sessionId`

Yêu cầu `verifyToken`.

Revoke một session cụ thể. Nếu session bị revoke là session hiện tại thì clear refresh cookie.

### `DELETE /user/sessions`

Yêu cầu `verifyToken`.

Revoke toàn bộ sessions, tăng `tokenVersion`, clear refresh cookie.

### `POST /user/logout`

Dùng `optionalAuth`.

Ngay cả khi access token hết hạn, logout vẫn có thể revoke refresh token từ cookie.

### `POST /user/change-password`

Yêu cầu `verifyToken`.

Sau khi đổi mật khẩu thành công:

- Clear refresh cookie.
- Sessions cũ bị revoke.
- `tokenVersion` tăng.

### Admin routes

Các route như:

```txt
GET /user/api/user-list
POST /user/add
PUT /user/update/:id
POST /user/reset-temp-password/:userId
DELETE /user/delete/:id
```

dùng `verifyAdmin`, nghĩa là phải qua `verifyToken` và role hiện tại trong DB phải là admin.

## 9. Backend: file `rateLimiter.js`

File: `apps/src/shared/middleware/rateLimiter.js`

Rate limiter hỗ trợ Redis và fallback memory.

### `getClientIp(req)`

Lấy IP từ:

```js
x-forwarded-for
req.ip
req.socket.remoteAddress
```

Nếu chạy sau Nginx, nên đảm bảo cấu hình proxy đúng và backend không public trực tiếp.

### `incrementRedisCounter(key, windowMs)`

Dùng Redis `INCR` để đếm số request trong cửa sổ thời gian.

Nếu count lần đầu thì set TTL bằng `PEXPIRE`.

### `incrementMemoryCounter(key, windowMs)`

Fallback nếu Redis không sẵn sàng.

Chạy được cho một instance. Nếu deploy nhiều instance, nên dùng Redis để rate limit thống nhất.

### `createRateLimiter(options)`

Tạo middleware Express.

Middleware set response headers:

```http
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

Nếu vượt giới hạn thì trả:

```js
429 RATE_LIMITED
```

## 10. Backend: file `securityAuditService.js`

File: `apps/src/modules/user/services/securityAuditService.js`

Ghi log bảo mật vào collection:

```js
securitylogs
```

### `ensureIndexes()`

Tạo index:

```js
{ userId: 1, createdAt: -1 }
{ event: 1, createdAt: -1 }
{ createdAt: -1 }
```

Giúp dashboard/admin tra cứu log nhanh hơn.

### `log(event, options)`

Ghi document:

```js
{
  event,
  status,
  userId,
  actorId,
  email,
  reason,
  metadata,
  ipAddress,
  userAgent,
  createdAt
}
```

Các event hiện được ghi gồm:

- `login_success`
- `login_failed`
- `social_login_success`
- `refresh_token_reuse_detected`
- `session_revoked`
- `logout_all_sessions`
- `password_changed`
- `password_reset`
- `temp_password_reset`
- `admin_role_changed`
- `user_locked`
- `user_unlocked`

## 11. Backend: `user.js` và `userRepository.js`

### `user.js`

Model user có thêm:

```js
tokenVersion = 0
```

Đây là version bảo mật của token.

### `userRepository.insert(user)`

Khi tạo user mới:

```js
user.tokenVersion = user.tokenVersion || 0
```

### `updatePassword(id, hashedPassword)`

Vừa update password vừa tăng tokenVersion:

```js
$inc: { tokenVersion: 1 }
```

### `updateAndIncrementTokenVersion(id, updateFields)`

Dùng khi admin đổi role hoặc khóa user.

Vừa update thông tin user vừa tăng tokenVersion.

### `incrementTokenVersion(id)`

Tăng riêng tokenVersion.

Dùng khi logout all sessions.

## 12. Backend: `envValidator.js`, `database.js`, `app.js`, `socket.js`

### `envValidator.js`

Kiểm tra `JWT_SECRET`.

Dev:

- Bắt buộc có `JWT_SECRET`.
- Tối thiểu 32 ký tự.

Production:

- Tối thiểu 64 ký tự.
- Không được giống JWT secret development.

Nếu thiếu hoặc yếu, app fail fast khi start.

### `database.js`

MongoDB dùng singleton `MongoClient`.

Điểm này tránh việc mỗi repository tạo một MongoClient riêng, làm tốn connection pool trong production.

Hỗ trợ:

```env
MONGODB_URI=
```

Nếu không có `MONGODB_URI`, code tự build URI từ username/password.

### `app.js`

Các điểm liên quan JWT/auth:

1. Load env theo:

```js
APP_ENV || NODE_ENV
ENV_FILE
```

2. Validate env sau khi load.

3. CORS hỗ trợ nhiều `CLIENT_URL`.

4. `credentials: true` để cookie refresh token hoạt động.

5. Socket.IO dùng cùng danh sách allowed origins.

### `socket.js`

Socket.IO nhận `allowedOrigins` từ `app.js`.

Không còn hard-code `localhost:5173`, phù hợp production domain.

## 13. Frontend: file `AuthService.jsx`

File: `webapp/src/services/AuthService.jsx`

Đây là request helper chính cho frontend auth.

### Biến module-level

```js
let accessToken = null;
let isRefreshing = false;
let refreshPromise = null;
let refreshSubscribers = [];
```

Ý nghĩa:

- `accessToken`: access token hiện tại, chỉ lưu trong memory.
- `isRefreshing`: đánh dấu đang refresh để tránh nhiều request tự refresh cùng lúc.
- `refreshPromise`: gom các lời gọi refresh trực tiếp cùng thời điểm.
- `refreshSubscribers`: hàng đợi các request đang chờ refresh xong.

### `setAccessToken(token)`

Gán access token vào memory.

Không ghi access token vào `localStorage`.

### `getAccessToken()`

Trả access token đang nằm trong memory.

### `isAuthenticated()`

Trả `true` nếu memory đang có access token.

### `bootstrapSession()`

Được gọi khi app mới load.

Luồng:

1. Xóa token cũ khỏi localStorage:

```js
localStorage.removeItem("token");
localStorage.removeItem("refreshToken");
```

2. Gọi:

```js
refreshToken({ logoutOnFailure: false })
```

3. Nếu refresh thành công, app có access token mới trong memory.
4. Nếu refresh thất bại, user coi như chưa đăng nhập nhưng không ép logout redirect.

Điểm này giúp reload trang không mất đăng nhập nếu refresh cookie còn hợp lệ.

### `login(email, password)`

Luồng:

1. Gửi POST `/user/login`.
2. Dùng `credentials: "include"` để browser nhận Set-Cookie từ backend.
3. Backend trả access token trong `responseData.data.token`.
4. Frontend lưu access token bằng `setAccessToken`.
5. Xóa `token` và `refreshToken` cũ khỏi localStorage.
6. Lưu `role` và `language` vào localStorage.
7. Start auto refresh timer.

Refresh token không nằm trong JS. Browser giữ cookie.

### `refreshToken({ logoutOnFailure, retryOnReuse })`

Luồng:

1. Nếu đang có `refreshPromise`, return promise đó để tránh gọi trùng.
2. POST `/user/refresh-token` với:

```js
credentials: "include"
```

3. Browser tự gửi refresh cookie.
4. Nếu backend trả lỗi `REFRESH_TOKEN_REUSED` và còn retry, frontend chờ 250ms rồi thử lại một lần.
5. Nếu thành công:
   - Lưu access token mới vào memory.
   - Update role/language.
   - Start lại refresh timer.
6. Nếu thất bại và `logoutOnFailure = true`, gọi `logout()`.

Cơ chế retry `REFRESH_TOKEN_REUSED` dùng để giảm lỗi race khi nhiều request refresh sát nhau.

### `startTokenRefreshTimer()`

Tự refresh trước khi access token hết hạn.

Code tính thời điểm refresh:

```js
expiresAt - Date.now() - 60 * 1000
```

Tức là refresh trước khi hết hạn khoảng 1 phút.

Nếu không đọc được thời hạn token thì fallback 12 phút.

### `fetchWithAuth(url, options = {})`

Đây là helper chính cho API cần đăng nhập.

Luồng:

1. Lấy access token từ memory.
2. Gắn header:

```js
Authorization: Bearer <token>
```

3. Nếu body là `FormData`, không tự set `Content-Type`.
4. Nếu không phải FormData, set `Content-Type: application/json`.
5. Gọi fetch.
6. Nếu response là `401 TOKEN_EXPIRED`:
   - Gọi refresh token.
   - Gắn access token mới.
   - Retry request cũ.
7. Nếu là `403 FORBIDDEN` hoặc lỗi khác, không refresh bừa.

Điểm này giải quyết lỗi permission sai và logout bất thường.

### `getCurrentUser()`

Lấy user hiện tại.

Ưu tiên đọc `localStorage.user` nếu có. Nếu không có, decode access token trong memory để lấy:

```js
id
username
email
role
```

### `logout()`

Luồng:

1. Gọi POST `/user/logout` với access token nếu có.
2. Dùng `credentials: "include"` để backend đọc refresh cookie và clear cookie.
3. Xóa access token memory.
4. Xóa localStorage token/refreshToken/role/language.
5. Clear refresh timer.
6. Redirect theo role.

### `changePassword()`

Gọi `/user/change-password` qua `fetchWithAuth`.

Sau khi backend đổi mật khẩu, backend sẽ:

- Tăng tokenVersion.
- Revoke all sessions.
- Clear refresh cookie.

## 14. Frontend: `App.jsx` và `Login.jsx`

### `App.jsx`

Khi app mount:

```js
AuthService.bootstrapSession()
```

App chỉ render sau khi bootstrap xong.

Điều này tránh trạng thái app render route khi chưa biết user còn session hay không.

### `Login.jsx`

Login thường:

1. User nhập email/password.
2. Gọi `AuthService.login`.
3. Nếu role admin thì redirect `/admin/dashboard`.
4. Nếu user thường thì redirect `/`.

Social login:

1. Backend redirect về:

```txt
/login?socialLogin=success&provider=google
```

2. Frontend không nhận token từ URL.
3. Frontend gọi `AuthService.refreshToken`.
4. Nếu refresh cookie hợp lệ, frontend nhận access token mới.
5. Redirect theo role.

## 15. Frontend: `UserService.jsx`

File: `webapp/src/services/UserService.jsx`

Các API user/admin hiện đi qua `AuthService.fetchWithAuth`, ví dụ:

- `fetchUser`
- `getUserById`
- `addUser`
- `updateUser`
- `updateProfile`
- `getSessions`
- `revokeSession`
- `revokeAllSessions`
- `deleteUser`

Điểm quan trọng:

- Tất cả API protected dùng chung cơ chế access token + auto refresh.
- Session management frontend dùng `/user/sessions`.

## 16. Các luồng hoạt động chi tiết

### Luồng login email/password

Client gửi request:

1. User nhập email/password ở màn hình đăng nhập.
2. `Login.jsx` gọi:

```js
AuthService.login(email, password)
```

3. `AuthService.login()` gửi request:

```http
POST /user/login
Content-Type: application/json
credentials: include
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

`credentials: "include"` rất quan trọng. Nó cho phép browser nhận và lưu cookie từ response `Set-Cookie`, đồng thời gửi cookie trong các request sau nếu cookie hợp lệ.

Backend nhận request:

1. `userController.js` nhận route `POST /user/login`.
2. `loginRateLimiter` kiểm tra số lần login theo IP + email.
3. Controller validate email/password.
4. Controller gọi:

```js
userService.login(email, password, req)
```

5. `userService.login()` kiểm tra:

- Email có tồn tại không.
- Password có đúng không.
- User có bị khóa không.

6. Nếu hợp lệ, service gọi:

```js
this.authService.generateTokenPair(user, req)
```

7. `AuthenticationService.generateTokenPair()` tạo:

- Access token.
- Refresh token.

8. `generateAccessToken()` tạo access token 15 phút, payload có `id`, `role`, `username`, `email`, `tokenVersion`.
9. `generateRefreshToken()` tạo refresh token 7 ngày, payload có `id`, `type: "refresh"`, `sessionId`.
10. Backend hash refresh token rồi lưu vào collection `usersessions`.

Backend trả response:

Trong controller có đoạn:

```js
setRefreshTokenCookie(res, result.refreshToken);
delete result.refreshToken;
res.json(result);
```

Điều này có nghĩa là refresh token được gửi về bằng response header `Set-Cookie`, không nằm trong response body.

Response headers có dạng:

```http
Set-Cookie: refreshToken=<refresh_token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```

Production sẽ là:

```http
Set-Cookie: __Host-refreshToken=<refresh_token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

Response body chỉ còn:

```json
{
  "success": true,
  "data": {
    "token": "<access_token>",
    "role": "user",
    "language": "vi"
  }
}
```

Client nhận response:

1. Browser nhìn thấy header `Set-Cookie`.
2. Browser tự lưu refresh token vào cookie storage.
3. Vì cookie có `HttpOnly`, JavaScript không đọc được refresh token bằng `document.cookie`.
4. `AuthService.login()` đọc response body.
5. JavaScript chỉ lấy được access token từ:

```js
responseData.data.token
```

6. Frontend lưu access token vào memory:

```js
accessToken = data.token
```

7. Frontend lưu `role` và `language` vào localStorage.
8. Frontend gọi `startTokenRefreshTimer()`.
9. `Login.jsx` redirect user theo role.

Tóm tắt chỗ quan trọng:

```txt
Refresh token:
  Backend gửi qua Set-Cookie header
  Browser tự lưu
  JavaScript không đọc được

Access token:
  Backend gửi trong response body
  JavaScript đọc được
  Frontend lưu vào memory
```

### Luồng gọi API protected

Client gửi request:

1. Một service frontend gọi API qua:

```js
AuthService.fetchWithAuth(url, options)
```

2. `fetchWithAuth()` lấy access token đang nằm trong memory:

```js
const token = this.getAccessToken();
```

3. Nếu có token, frontend gắn vào request header:

```http
Authorization: Bearer <access_token>
```

4. Nếu body là JSON, frontend set:

```http
Content-Type: application/json
```

5. Nếu body là `FormData`, frontend không tự set `Content-Type` để browser tự set boundary.

Backend nhận request:

1. Route protected dùng middleware `verifyToken`.
2. `verifyToken` đọc access token từ header `Authorization`.
3. Backend verify JWT bằng `JWT_SECRET` và algorithm `HS256`.
4. Backend reject nếu token là refresh token:

```js
decoded.type == "refresh"
```

5. Backend tìm user thật trong DB theo id trong token.
6. Backend check user còn tồn tại.
7. Backend check user không bị `locked`.
8. Backend so sánh:

```js
decoded.tokenVersion === user.tokenVersion
```

9. Nếu hợp lệ, backend gán:

```js
req.user
req.authUser
```

10. Request được đi tiếp vào controller.

Client nhận response:

1. Nếu API thành công, frontend đọc data bình thường.
2. Nếu access token còn hạn, không cần refresh.
3. Nếu backend trả lỗi không phải `TOKEN_EXPIRED`, frontend không tự refresh.

### Luồng refresh access token

Tình huống:

1. Client gọi một API protected bằng access token cũ.
2. Access token đã hết hạn.
3. Backend `verifyToken` trả:

```http
401 Unauthorized
```

Response body có code:

```json
{
  "code": "TOKEN_EXPIRED"
}
```

Client xử lý:

1. `fetchWithAuth()` kiểm tra response.
2. Nếu response là `401 TOKEN_EXPIRED`, frontend gọi:

```js
AuthService.refreshToken()
```

3. Nếu lỗi là `403 FORBIDDEN`, `TOKEN_REVOKED`, `ACCOUNT_LOCKED` hoặc lỗi khác, frontend không refresh bừa.

Client gửi request refresh:

```http
POST /user/refresh-token
Content-Type: application/json
credentials: include
```

Request này không cần body.

Điểm quan trọng:

```txt
Frontend không tự lấy refresh token.
Frontend không tự gắn refresh token.
Browser tự gửi refresh token cookie.
```

Browser tự gắn cookie vào request nếu cookie hợp lệ theo domain/path/sameSite/secure:

```http
Cookie: __Host-refreshToken=<refresh_token>
```

Development có thể là:

```http
Cookie: refreshToken=<refresh_token>
```

Backend nhận request refresh:

1. `userController.js` nhận `POST /user/refresh-token`.
2. `refreshTokenRateLimiter` kiểm tra số lần refresh theo IP.
3. `validateRefreshRequestOrigin` kiểm tra `Origin` hoặc `Referer` để chống CSRF.
4. Controller gọi:

```js
getRefreshTokenFromRequest(req)
```

5. Hàm này đọc cookie từ:

```js
req.headers.cookie
```

6. Backend lấy được refresh token raw từ cookie.
7. Controller gọi:

```js
userService.refreshAccessToken(refreshToken, req)
```

Backend verify refresh token:

1. `AuthenticationService.verifyRefreshToken()` verify chữ ký JWT.
2. Check `type === "refresh"`.
3. Hash refresh token bằng SHA-256.
4. Tìm session trong `usersessions` bằng `refreshTokenHash`.
5. Check session tồn tại.
6. Check session chưa bị revoke.
7. Check session chưa hết hạn.
8. Check `decoded.sessionId` khớp session DB.
9. Update `lastUsedAt`.

Backend tạo token mới:

1. `userService.refreshAccessToken()` lấy user từ DB.
2. Check user chưa bị locked.
3. Tạo access token mới.
4. Gọi `rotateRefreshToken()` để tạo refresh token mới.
5. Backend tạo session mới trong `usersessions`.
6. Backend revoke session cũ với reason `rotated`.

Backend trả response refresh:

1. Controller set refresh token mới vào cookie:

```js
setRefreshTokenCookie(res, result.refreshToken)
```

2. Controller xóa refresh token khỏi body:

```js
delete result.refreshToken
```

3. Response header có `Set-Cookie` mới:

```http
Set-Cookie: __Host-refreshToken=<new_refresh_token>; HttpOnly; Secure; SameSite=Lax; Path=/
```

4. Response body chỉ trả access token mới:

```json
{
  "success": true,
  "data": {
    "token": "<new_access_token>",
    "role": "user",
    "language": "vi"
  }
}
```

Client nhận response refresh:

1. Browser tự thay cookie refresh token cũ bằng cookie mới từ `Set-Cookie`.
2. JavaScript vẫn không đọc được refresh token mới.
3. `AuthService.refreshToken()` đọc access token mới từ response body.
4. Frontend lưu access token mới vào memory.
5. Frontend update role/language nếu có.
6. Frontend start lại timer refresh.
7. `fetchWithAuth()` retry request API ban đầu với access token mới.

### Luồng refresh token rotation

Ví dụ ban đầu browser đang giữ refresh token A.

Khi client gọi refresh:

1. Browser gửi cookie chứa refresh token A.
2. Backend verify token A.
3. Backend tìm session A trong `usersessions`.
4. Backend tạo refresh token B.
5. Backend lưu hash token B thành session B.
6. Backend revoke session A:

```txt
revokeReason = rotated
replacedBySessionId = sessionId của B
```

7. Backend trả `Set-Cookie` chứa refresh token B.
8. Browser tự lưu token B thay token A.

Sau đó token A không còn dùng được.

Nếu token A bị gửi lại sau khi đã rotated:

1. Backend thấy session A đã `revokedAt`.
2. Nếu reason là `rotated`, backend trả code `REFRESH_TOKEN_REUSED`.
3. Frontend có thể retry một lần để xử lý race condition khi nhiều request refresh sát nhau.

### Luồng logout

Client gửi request:

1. Frontend gọi:

```js
AuthService.logout()
```

2. Frontend gửi:

```http
POST /user/logout
credentials: include
Authorization: Bearer <access_token nếu có>
```

3. Browser tự gửi refresh cookie nếu còn hợp lệ.

Backend xử lý:

1. Route logout dùng `optionalAuth`, nên access token hết hạn cũng không làm logout fail.
2. Backend đọc refresh token từ cookie.
3. Backend revoke refresh session hiện tại trong `usersessions`.
4. Backend clear refresh cookie bằng `Set-Cookie` hết hạn.

Response header có dạng:

```http
Set-Cookie: __Host-refreshToken=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax; Path=/
```

Client nhận response:

1. Browser tự xóa refresh cookie.
2. Frontend xóa access token khỏi memory.
3. Frontend xóa token/refreshToken cũ khỏi localStorage nếu còn.
4. Frontend xóa role/language.
5. Frontend clear refresh timer.
6. Frontend redirect.

### Luồng đổi mật khẩu

Client gửi request:

1. Frontend gọi:

```js
AuthService.changePassword(...)
```

2. Request đi qua `fetchWithAuth()`.
3. Frontend gắn access token vào header:

```http
Authorization: Bearer <access_token>
```

Backend xử lý:

1. Route `/user/change-password` dùng `verifyToken`.
2. Backend verify access token.
3. Backend check user trong DB, active, tokenVersion.
4. `userService.changePassword()` kiểm tra mật khẩu hiện tại.
5. Backend hash mật khẩu mới.
6. `userRepository.updatePassword()` update password và tăng `tokenVersion`.
7. Backend revoke toàn bộ refresh sessions của user.
8. Backend ghi security log `password_changed`.
9. Controller clear refresh cookie.

Kết quả:

- Access token hiện tại và access token cũ chết vì `tokenVersion` trong JWT không còn khớp DB.
- Refresh token cũ chết vì toàn bộ sessions bị revoke.
- Browser bị clear refresh cookie.
- User cần đăng nhập lại.

### Luồng admin hạ quyền hoặc khóa user

Admin client gửi request:

1. Frontend admin gọi update user qua `fetchWithAuth()`.
2. Request có:

```http
Authorization: Bearer <admin_access_token>
```

Backend xác thực admin:

1. Route dùng `verifyAdmin`.
2. `verifyAdmin` gọi `verifyToken`.
3. Backend verify JWT.
4. Backend lấy admin thật từ DB.
5. Backend check role hiện tại trong DB phải là `admin`.

Backend update target user:

1. `userService.updateUser()` lấy user hiện tại từ DB.
2. Nếu role thay đổi, backend tăng `tokenVersion`.
3. Nếu user bị khóa, backend revoke toàn bộ sessions và tăng `tokenVersion`.
4. Backend ghi audit log:

- `admin_role_changed`
- `user_locked`
- `user_unlocked`

Kết quả:

- Nếu một admin bị hạ quyền, access token admin cũ sẽ bị reject ngay ở lần request tiếp theo do `tokenVersion` lệch hoặc role DB không còn là admin.
- Nếu user bị khóa, refresh token bị revoke và access token bị reject.
- Nếu user đang mở app, request tiếp theo sẽ lỗi auth và frontend sẽ đưa user về trạng thái cần đăng nhập lại.

### Luồng reload trang

Tình huống:

1. User đang đăng nhập.
2. User bấm reload trình duyệt.
3. Access token nằm trong memory nên bị mất.
4. Refresh token cookie vẫn còn trong browser nếu chưa hết hạn/chưa bị revoke.

Client khi app khởi động:

1. `App.jsx` gọi:

```js
AuthService.bootstrapSession()
```

2. `bootstrapSession()` xóa token cũ khỏi localStorage nếu có.
3. `bootstrapSession()` gọi:

```js
AuthService.refreshToken({ logoutOnFailure: false })
```

4. Browser tự gửi refresh cookie.

Backend xử lý:

1. Nhận request `/user/refresh-token`.
2. Verify refresh token và session DB.
3. Rotate refresh token.
4. Set refresh cookie mới.
5. Trả access token mới.

Client nhận response:

1. Browser tự cập nhật refresh cookie.
2. JS nhận access token mới từ body.
3. JS lưu access token mới vào memory.
4. App render tiếp trong trạng thái đã đăng nhập.

Nếu refresh token hết hạn hoặc bị revoke:

1. Backend trả lỗi.
2. `bootstrapSession()` set access token memory về `null`.
3. App render như user chưa đăng nhập.

### Luồng quản lý thiết bị/session

Lấy danh sách session:

1. Frontend gọi `UserService.getSessions()`.
2. Request đi qua `fetchWithAuth()`, có access token trong Authorization header.
3. Backend route `GET /user/sessions` dùng `verifyToken`.
4. Backend đọc refresh cookie hiện tại để biết session nào là current.
5. Backend trả danh sách active sessions, không trả `refreshTokenHash`.

Revoke một session:

1. Frontend gọi:

```http
DELETE /user/sessions/:sessionId
```

2. Backend verify access token.
3. Backend revoke session theo `userId` và `sessionId`.
4. Nếu session bị revoke là session hiện tại, backend clear refresh cookie.

Revoke toàn bộ sessions:

1. Frontend gọi:

```http
DELETE /user/sessions
```

2. Backend revoke toàn bộ refresh sessions.
3. Backend tăng `tokenVersion`.
4. Backend clear refresh cookie.
5. Access token cũ chết ngay vì `tokenVersion` lệch.

## 17. Dữ liệu lưu ở đâu

### Frontend

Access token:

```txt
RAM/memory trong AuthService.jsx
```

Refresh token:

```txt
Không đọc được từ JavaScript.
Nằm trong HttpOnly cookie của browser.
```

LocalStorage hiện chỉ còn dùng cho:

- `role`
- `language`
- có cleanup `token` và `refreshToken` cũ

### Backend MongoDB collection `users`

Lưu:

```js
tokenVersion
role
active
```

### Backend MongoDB collection `usersessions`

Lưu:

```js
userId
sessionId
refreshTokenHash
userAgent
ipAddress
expiresAt
revokedAt
replacedBySessionId
revokeReason
lastUsedAt
```

Không lưu raw refresh token.

### Backend MongoDB collection `securitylogs`

Lưu event bảo mật:

```js
login_success
login_failed
refresh_token_reuse_detected
password_changed
admin_role_changed
user_locked
...
```

## 18. Những gì đã làm được sau nâng cấp

1. Gom frontend về một auth helper chính: `AuthService.fetchWithAuth`.
2. Chỉ refresh khi backend trả `401 TOKEN_EXPIRED`.
3. Không refresh bừa khi `403 FORBIDDEN`.
4. Đưa refresh token ra khỏi localStorage.
5. Đưa refresh token vào HttpOnly cookie.
6. Không đưa token qua URL social login.
7. Dùng refresh token rotation.
8. Lưu refresh session trong MongoDB thay vì RAM/Map.
9. Lưu hash refresh token thay vì raw token.
10. Thêm `tokenVersion` vào user.
11. `verifyToken` check user thật trong DB.
12. `verifyAdmin` check role hiện tại từ DB.
13. Khóa user/đổi mật khẩu/hạ quyền làm access token cũ chết ngay.
14. Revoke toàn bộ sessions khi đổi mật khẩu/reset mật khẩu/khóa user.
15. Có rate limit cho login và refresh.
16. Có CSRF origin check cho refresh cookie.
17. Có security audit log.
18. Có API quản lý session/thiết bị.
19. Cookie production dùng `__Host-refreshToken`.
20. Cookie config phù hợp Nginx `/api` production với `SameSite=Lax` và `Path=/`.
21. MongoDB client dùng singleton.
22. CORS và Socket.IO hỗ trợ nhiều origin.
23. Env validator kiểm tra JWT secret.

## 19. Các điểm còn có thể nâng cấp tiếp

Hiện tại thiết kế JWT đã phù hợp production cho quy mô dự án. Một số nâng cấp có thể làm sau:

1. Thêm `app.set("trust proxy", 1)` khi chạy sau Nginx.

   Điều này giúp Express hiểu đúng IP thật qua proxy.

2. Không public port backend `3000` ra internet.

   Chỉ cho Nginx nội bộ gọi backend.

3. Thêm TTL cho `securitylogs`.

   Ví dụ giữ log 90 hoặc 180 ngày.

4. Thêm MFA/2FA cho admin.

   Đây là nâng cấp rất đáng làm nếu admin có quyền quản lý dữ liệu thật.

5. Thêm JWT key rotation.

   Hiện dùng một `JWT_SECRET`. Production lớn hơn có thể dùng `kid` và nhiều secret theo version.

6. Tối ưu refresh rotation document.

   Hiện mỗi lần refresh tạo một document mới. Cách này bảo mật ổn và TTL sẽ dọn sau 7 ngày. Nếu user rất đông, có thể đổi sang token family/session document update.

7. Chuẩn hóa response lỗi auth.

   Một số endpoint trả `{ message, code }`, một số trả `{ success, message }`. Có thể chuẩn hóa để frontend xử lý gọn hơn.

## 20. Kết luận

Cơ chế JWT hiện tại của EasyTalk đã chuyển từ mô hình đơn giản sang mô hình gần chuẩn production:

- Access token ngắn hạn.
- Refresh token HttpOnly cookie.
- Refresh token rotation.
- Session lưu DB.
- TokenVersion để invalidation ngay lập tức.
- Role/admin check từ DB.
- Revoke sessions.
- Rate limit.
- CSRF origin check.
- Security audit log.
- Frontend dùng một auth request helper.

Với điều kiện production có HTTPS, domain/CORS đúng, Redis/MongoDB ổn định và backend không bị expose trực tiếp, thiết kế hiện tại đủ tốt cho dự án EasyTalk.
