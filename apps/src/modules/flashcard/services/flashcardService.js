const { ObjectId } = require('mongodb');
const FlashcardRepository = require('../repositories/flashcardRepository');
const FlashcardImageService = require('./flashcardImageService');
const { calculateDifficultyStats } = require('../repositories/queries/flashcardCalculator');
// const { invalidateFlashcardCache } = require('../utils/cacheHelper');

class FlashcardService {
    constructor() {
        this.repository = new FlashcardRepository();
        this.imageService = new FlashcardImageService();
    }

    async getFlashcardList(page = 1, limit = 12, tab = "explore", userId) {
        let filter = {};
        if(tab === "mine") {
            filter.user = new ObjectId(userId);
        } else if(tab === "explore") {
            filter.user = { $ne: new ObjectId(userId) };
        }
        const { flashcardLists, totalFlashcardLists } = await this.repository.findFlashcardLists(filter, page, limit);
        for(let list of flashcardLists) {
            list.wordCount = await this.repository.getWordCountForList(list._id.toString());
        }
        if(tab === "mine") {
            for(let list of flashcardLists) {
                const stats = await calculateDifficultyStats(
                    this.repository.flashcardsCollection, 
                    list._id
                );
                list.toReview = stats.toReview;
                list.remembered = stats.remembered;
            }
        }
        return {
            flashcardLists,
            currentPage: page,
            totalPages: Math.ceil(totalFlashcardLists / limit),
        };
    }

    async getFlashcardListById(id, page = 1, limit = 12, userId) {
        const { flashcardList, flashcards } = await this.repository.findFlashcardListById(id);
        if(!flashcardList) {
            throw new Error("Không tìm thấy danh sách flashcards.");
        }
        const isOwner = flashcardList.user.toString() === userId;
        const totalFlashcards = flashcards.length;
        const skip = (page - 1) * limit;
        const paginatedFlashcards = flashcards.slice(skip, skip + limit);
        return {
            flashcardList,
            flashcards: paginatedFlashcards,
            currentPage: page,
            totalPages: Math.ceil(totalFlashcards / limit),
            totalFlashcards,
            isOwner
        };
    }

    async insertFlashcardList(flashcardListData, userId) {
        const { name, description } = flashcardListData;
        if(!name || !description) throw new Error("Thiếu thông tin cần thiết");
        const result = await this.repository.insertFlashcardList({ 
            name, 
            description, 
            user: new ObjectId(userId) 
        });
        // await invalidateFlashcardCache();
        return result;
    }

    async updateFlashcardList(id, flashcardListData, userId) {
        const existing = await this.repository.findFlashcardListByIdOnly(id);
        if(!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép cập nhật danh sách này");
        }
        const updated = await this.repository.updateFlashcardList(id, flashcardListData);
        if(!updated.modifiedCount) throw new Error("Không tìm thấy danh sách để cập nhật");
        // await invalidateFlashcardCache();
        return updated;
    }

    async deleteFlashcardList(id, userId) {
        const existing = await this.repository.findFlashcardListByIdOnly(id);
        if(!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép xóa danh sách này");
        }
        const flashcards = await this.repository.findFlashcardsByListId(id);
        await this.imageService.deleteMultipleImages(flashcards, userId);
        await this.repository.deleteFlashcardsByListId(id);
        const result = await this.repository.deleteFlashcardList(id);
        // await invalidateFlashcardCache();
        return result;
    }

    async insertFlashcard(flashcardData, userId) {
        const { word, meaning, pos, pronunciation, exampleSentence, flashcardList } = flashcardData;
        if(!word || !meaning) throw new Error("Thiếu dữ liệu bắt buộc (word, meaning)");
        const existingList = await this.repository.findFlashcardListByIdOnly(flashcardList);
        if(!existingList || existingList.user.toString() !== userId) {
            throw new Error("Không được phép thêm flashcard vào danh sách này");
        }
        let imageUrl = null;
        if(flashcardData.imageBuffer) {
            imageUrl = await this.imageService.uploadNewImage(flashcardData.imageBuffer, userId);
        }
        const result = await this.repository.insertFlashcard({
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
        // await invalidateFlashcardCache();
        return result;
    }

    async updateFlashcard(id, data, fileBuffer = null, userId) {
        const existing = await this.repository.findFlashcardById(id);
        if(!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép cập nhật flashcard này");
        }
        let imageUrl = existing.image;
        if(fileBuffer) {
            if(existing.image) {
                imageUrl = await this.imageService.uploadReplacementImage(fileBuffer, existing.image, userId);
            } else {
                imageUrl = await this.imageService.uploadNewImage(fileBuffer, userId);
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
        if(data.difficulty !== undefined) {
            updatedData.difficulty = data.difficulty;
        }
        const updated = await this.repository.updateFlashcard(id, updatedData);
        if(updated.matchedCount == 0) throw new Error("Flashcard không tồn tại");
        // await invalidateFlashcardCache();
        return updated;
    }

    async updateFlashcardDifficulty(bulkOps) {
        return await this.repository.updateFlashcardBulkWrite(bulkOps);
    }

    async deleteFlashcard(id, userId) {
        const existing = await this.repository.findFlashcardById(id);
        if(!existing || existing.user.toString() !== userId) {
            throw new Error("Không được phép xóa flashcard này");
        }
        if(existing.image) {
            await this.imageService.deleteImage(existing.image, userId);
        }
        const result = await this.repository.deleteFlashcard(id);
        // await invalidateFlashcardCache();
        return result;
    }

    async getFlashcardReview(listId, userId) {
        const { flashcardList, flashcards } = await this.repository.findFlashcardListById(listId);
        if(!flashcardList) {
            throw new Error("Không tìm thấy danh sách flashcards.");
        }
        const isOwner = flashcardList.user.toString() === userId;
        if(!flashcards || flashcards.length === 0) {
            throw new Error("Không có flashcard nào trong danh sách này.");
        }
        return { flashcards, flashcardList, isOwner };
    }

    async deleteUserFlashcards(userId) {
        const lists = await this.repository.findFlashcardListsByUserId(userId);
        for(let list of lists) {
            const flashcards = await this.repository.findFlashcardsByListId(list._id.toString());
            await this.imageService.deleteMultipleImages(flashcards, userId);
            await this.repository.deleteFlashcardsByListId(list._id.toString());
        }
        const result = await this.repository.deleteFlashcardListsByUserId(userId);
        // await invalidateFlashcardCache();
        return result;
    }
}

module.exports = FlashcardService;