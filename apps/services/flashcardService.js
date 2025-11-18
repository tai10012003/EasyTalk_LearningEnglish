const { ObjectId } = require('mongodb');
const config = require('../config/setting');
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { FlashcardRepository } = require('./../repositories');
// const { getRedisClient } = require('../util/redisClient');
const UserprogressService= require('./userprogressService');
const userprogressService = new UserprogressService();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class FlashcardService {
    constructor() {
        this.flashcardRepository = new FlashcardRepository();
        this.db = require('./../database/database').getMongoClient().db(config.mongodb.database);
        this.usersCollection = this.db.collection("users");
        this.cloudFolder = "easytalk/flashcard";
    }

    async getUsername(userId) {
        if (!userId) return null;
        const user = await this.usersCollection.findOne({ _id: new ObjectId(userId) });
        return user?.username;
    }

    async _extractPublicIdFromUrl(url) {
        try {
            if (!url) return null;
            const match = url.match(/\/([^\/\?]+)\.[^\/\?]+$/);
            return match ? match[1] : null;
        } catch (err) {
            return null;
        }
    }

    async uploadNewImage(fileBuffer, userId) {
        if (!fileBuffer || !userId) return null;
        const username = await this.getUsername(userId);
        if (!username) throw new Error("User not found");
        const folder = `${this.cloudFolder}/${username}`;
        const publicId = `flashcard-${Date.now()}`;
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    folder: folder,
                    overwrite: true,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }

    async uploadReplacementImage(fileBuffer, existingImageUrl, userId) {
        if (!fileBuffer || !existingImageUrl || !userId) return null;
        const username = await this.getUsername(userId);
        if (!username) throw new Error("User not found");
        const folder = `${this.cloudFolder}/${username}`;
        const publicId = this._extractPublicIdFromUrl(existingImageUrl);
        if (!publicId) throw new Error("Invalid image URL");
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    folder: folder,
                    overwrite: true,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }

    async getFlashcardList(page = 1, limit = 12, tab = "explore", userId) {
        // const redis = getRedisClient();
        // const cacheKey = `flashcard:list:page=${page}:limit=${limit}:tab=${tab}:userId=${userId}`;
        // const ttl = 300;
        // try {
        //     const cached = await redis.get(cacheKey);
        //     if (cached) {
        //         console.log(`Direct cache hit: ${cacheKey}`);
        //         return JSON.parse(cached);
        //     }
        // } catch (err) {
        //     console.error('Direct cache get error:', err);
        // }
        let filter = {};
        if (tab === "mine") {
            filter.user = new ObjectId(userId);
        } else if (tab === "explore") {
            filter.user = { $ne: new ObjectId(userId) };
        }
        const { flashcardLists, totalFlashcardLists } = await this.flashcardRepository.findFlashcardLists(filter, page, limit);
        if (tab === "mine") {
            for (let list of flashcardLists) {
                const pipeline = [
                    { $match: { flashcardList: new ObjectId(list._id) } },
                    { $group: { _id: { $ifNull: ["$difficulty", 2] }, count: { $sum: 1 } } }
                ];
                const counts = await this.flashcardRepository.flashcardsCollection.aggregate(pipeline).toArray();
                const countMap = counts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {});
                list.toReview = (countMap[2] || 0) + (countMap[3] || 0);
                list.remembered = countMap[1] || 0;
            }
        }
        const result = {
            flashcardLists,
            currentPage: page,
            totalPages: Math.ceil(totalFlashcardLists / limit),
        };
        // try {
        //     await redis.setex(cacheKey, ttl, JSON.stringify(result));
        //     console.log(`Direct cache set: ${cacheKey}`);
        // } catch (err) {
        //     console.error('Direct cache set error:', err);
        // }
        return result;
    }

    async getFlashcardListById(id, page = 1, limit = 12, userId) {
        // const redis = getRedisClient();
        // const cacheKey = `flashcard:listById:id=${id}:page=${page}:limit=${limit}:userId=${userId}`;
        // const ttl = 300;
        // try {
        //     const cached = await redis.get(cacheKey);
        //     if (cached) {
        //         console.log(`Direct cache hit: ${cacheKey}`);
        //         return JSON.parse(cached);
        //     }
        // } catch (err) {
        //     console.error('Direct cache get error:', err);
        // }
        const { flashcardList, flashcards } = await this.flashcardRepository.findFlashcardListById(id);
        if (!flashcardList) {
            throw new Error("Không tìm thấy danh sách flashcards.");
        }
        const isOwner = flashcardList.user.toString() === userId;
        const totalFlashcards = flashcards.length;
        const skip = (page - 1) * limit;
        const paginatedFlashcards = flashcards.slice(skip, skip + limit);
        const result = {
            flashcardList,
            flashcards: paginatedFlashcards,
            currentPage: page,
            totalPages: Math.ceil(totalFlashcards / limit),
            totalFlashcards,
            isOwner
        };
        // try {
        //     await redis.setex(cacheKey, ttl, JSON.stringify(result));
        //     console.log(`Direct cache set: ${cacheKey}`);
        // } catch (err) {
        //     console.error('Direct cache set error:', err);
        // }
        return result;
    }

    async insertFlashcardList(flashcardListData, userId) {
        const { name, description } = flashcardListData;
        if (!name || !description) throw new Error("Thiếu thông tin cần thiết");
        const result = await this.flashcardRepository.insertFlashcardList({ 
            name, 
            description, 
            user: new ObjectId(userId) 
        });
        // await this._invalidateCache();
        return result;
    }

    async updateFlashcardList(id, flashcardListData, userId) {
        const existing = await this.flashcardRepository.findFlashcardListByIdOnly(id);
        if (!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép cập nhật danh sách này");
        }
        const updated = await this.flashcardRepository.updateFlashcardList(id, flashcardListData);
        if (!updated.modifiedCount) throw new Error("Không tìm thấy danh sách để cập nhật");
        // await this._invalidateCache();
        return updated;
    }

    async deleteFlashcardList(id, userId) {
        const existing = await this.flashcardRepository.findFlashcardListByIdOnly(id);
        if (!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép xóa danh sách này");
        }
        const flashcards = await this.flashcardRepository.flashcardsCollection.find({ flashcardList: new ObjectId(id) }).toArray();
        for (let flashcard of flashcards) {
            if (flashcard.image) {
                const username = await this.getUsername(userId);
                const publicId = this._extractPublicIdFromUrl(flashcard.image);
                if (publicId && username) {
                    const fullPublicId = `easytalk/flashcard/${username}/${publicId}`;
                    try {
                        await cloudinary.uploader.destroy(fullPublicId);
                    } catch (err) {
                        console.warn("Không thể xóa ảnh Cloudinary:", err.message);
                    }
                }
            }
        }
        await this.flashcardRepository.deleteFlashcardsByListId(id);
        const result = await this.flashcardRepository.deleteFlashcardList(id);
        // await this._invalidateCache();
        return result;
    }

    async insertFlashcard(flashcardData, userId) {
        const { word, meaning, pos, pronunciation, exampleSentence, flashcardList } = flashcardData;
        if (!word || !meaning) throw new Error("Thiếu dữ liệu bắt buộc (word, meaning)");
        const existingList = await this.flashcardRepository.findFlashcardListByIdOnly(flashcardList);
        if (!existingList || existingList.user.toString() !== userId) {
            throw new Error("Không được phép thêm flashcard vào danh sách này");
        }
        let imageUrl = null;
        if (flashcardData.imageBuffer) {
            imageUrl = await this.uploadNewImage(flashcardData.imageBuffer, userId);
        }
        const result = await this.flashcardRepository.insertFlashcard({
            word,
            meaning,
            pos,
            pronunciation,
            exampleSentence,
            image: imageUrl,
            flashcardList: new ObjectId(flashcardList),
            user: new ObjectId(userId),
            difficulty: 2
        });
        // await this._invalidateCache();
        return result;
    }

    async updateFlashcard(id, data, fileBuffer = null, userId) {
        const existing = await this.flashcardRepository.findFlashcardById(id);
        if (!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép cập nhật flashcard này");
        }
        let imageUrl = existing.image;
        if (fileBuffer) {
            if (existing.image) {
                imageUrl = await this.uploadReplacementImage(fileBuffer, existing.image, userId);
            } else {
                imageUrl = await this.uploadNewImage(fileBuffer, userId);
            }
        }
        const updatedData = {
            word: data.word,
            meaning: data.meaning,
            pos: data.pos,
            pronunciation: data.pronunciation,
            exampleSentence: data.exampleSentence,
            image: imageUrl,
        };
        if (data.difficulty !== undefined) {
            updatedData.difficulty = data.difficulty;
        }
        const updated = await this.flashcardRepository.updateFlashcard(id, updatedData);
        if (updated.matchedCount == 0) throw new Error("Flashcard không tồn tại");
        // await this._invalidateCache();
        return updated;
    }

    async updateFlashcardDifficulty(bulkOps) {
        return await this.flashcardRepository.updateFlashcardbulkWrite(bulkOps);
    }

    async deleteFlashcard(id, userId) {
        const existing = await this.flashcardRepository.findFlashcardById(id);
        if (!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép xóa flashcard này");
        }
        if (existing.image) {
            const username = await this.getUsername(userId);
            const publicId = this._extractPublicIdFromUrl(existing.image);
            if (publicId && username) {
                const fullPublicId = `easytalk/flashcard/${username}/${publicId}`;
                try {
                    await cloudinary.uploader.destroy(fullPublicId);
                } catch (err) {
                    console.warn("Không thể xóa ảnh Cloudinary:", err.message);
                }
            }
        }
        const result = await this.flashcardRepository.deleteFlashcard(id);
        // await this._invalidateCache();
        return result;
    }

    async getFlashcardReview(listId, userId) {
        const { flashcardList, flashcards } = await this.flashcardRepository.findFlashcardListById(listId);
        if (!flashcardList) {
            throw new Error("Không tìm thấy danh sách flashcards.");
        }
        const isOwner = flashcardList.user.toString() === userId;
        if (!flashcards || flashcards.length === 0) {
            throw new Error("Không có flashcard nào trong danh sách này.");
        }
        return { flashcards, flashcardList, isOwner };
    }

    async deleteUserFlashcards(userId) {
        const lists = await this.flashcardRepository.flashcardListsCollection.find({ user: new ObjectId(userId) }).toArray();
        for (let list of lists) {
            const flashcards = await this.flashcardRepository.flashcardsCollection.find({ flashcardList: list._id }).toArray();
            for (let flashcard of flashcards) {
                if (flashcard.image) {
                    const username = await this.getUsername(userId);
                    const publicId = this._extractPublicIdFromUrl(flashcard.image);
                    if (publicId && username) {
                        const fullPublicId = `easytalk/flashcard/${username}/${publicId}`;
                        try {
                            await cloudinary.uploader.destroy(fullPublicId);
                        } catch (err) {
                            console.warn("Không thể xóa ảnh Cloudinary:", err.message);
                        }
                    }
                }
            }
            await this.flashcardRepository.deleteFlashcardsByListId(list._id.toString());
        }
        const result = await this.flashcardRepository.flashcardListsCollection.deleteMany({ user: new ObjectId(userId) });
        // await this._invalidateCache();
        return result;
    }

    // async _invalidateCache() {
    //     const redis = getRedisClient();
    //     const scanAndDelete = async (pattern) => {
    //         let cursor = '0';
    //         let totalDeleted = 0;
    //         do {
    //             const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    //             if (keys.length > 0) {
    //                 const deleted = await redis.del(keys);
    //                 totalDeleted += deleted;
    //             }
    //             cursor = nextCursor;
    //         } while (cursor !== '0');
    //         return totalDeleted;
    //     };
    //     try {
    //         const deletedList = await scanAndDelete('flashcard:list:*');
    //         const deletedItem = await scanAndDelete('flashcard:item:*');
    //         const deletedApi = await scanAndDelete('cache:/api/flashcard*');
    //         const total = deletedList + deletedItem + deletedApi;
    //         if (total > 0) {
    //             console.log(`Flashcard cache invalidated (${total} keys deleted)`);
    //         } else {
    //             console.log('No flashcard cache keys found to invalidate.');
    //         }
    //     } catch (err) {
    //         console.error('Invalidate flashcard cache error:', err);
    //     }
    // }
}

module.exports = FlashcardService;