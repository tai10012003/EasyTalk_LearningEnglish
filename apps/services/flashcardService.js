const { FlashcardRepository } = require('./../repositories');

class FlashcardService {
    constructor() {
        this.flashcardRepository = new FlashcardRepository();
    }

    async getFlashcardList(page = 1, limit = 12) {
        const { flashcardLists, totalFlashcardLists } = await this.flashcardRepository.findFlashcardLists(page, limit);
        return {
            flashcardLists,
            currentPage: page,
            totalPages: Math.ceil(totalFlashcardLists / limit),
        };
    }

    async getFlashcardListById(id, page = 1, limit = 12) {
        const { flashcardList, flashcards } = await this.flashcardRepository.findFlashcardListById(id);
        if (!flashcardList) {
            throw new Error("Không tìm thấy danh sách flashcards.");
        }
        const totalFlashcards = flashcards.length;
        const skip = (page - 1) * limit;
        const paginatedFlashcards = flashcards.slice(skip, skip + limit);
        return {
            flashcardList,
            flashcards: paginatedFlashcards,
            currentPage: page,
            totalPages: Math.ceil(totalFlashcards / limit),
            totalFlashcards,
        };
    }

    async insertFlashcardList({ name, description }) {
        if (!name || !description) throw new Error("Thiếu thông tin cần thiết");
        return await this.flashcardRepository.insertFlashcardList({ name, description });
    }

    async updateFlashcardList(id, flashcardListData) {
        const updated = await this.flashcardRepository.updateFlashcardList(id, flashcardListData);
        if (!updated) throw new Error("Không tìm thấy danh sách để cập nhật");
        return updated;
    }

    async deleteFlashcardList(id) {
        return await this.flashcardRepository.deleteFlashcardList(id);
    }

    async insertFlashcard({ word, meaning, pos, pronunciation, exampleSentence, image, flashcardList }) {
        if (!word || !meaning) throw new Error("Thiếu dữ liệu bắt buộc (word, meaning)");
        return await this.flashcardRepository.insertFlashcard({
            word,
            meaning,
            pos,
            pronunciation,
            exampleSentence,
            image,
            flashcardList,
        });
    }

    async updateFlashcard(id, data, fileBuffer = null) {
        const updatedData = {
            word: data.word,
            meaning: data.meaning,
            pos: data.pos,
            pronunciation: data.pronunciation,
            exampleSentence: data.exampleSentence,
        };
        if (fileBuffer) {
            updatedData.image = fileBuffer.toString("base64");
        }
        const updated = await this.flashcardRepository.updateFlashcard(id, updatedData);
        if (!updated) throw new Error("Flashcard không tồn tại");
        return updated;
    }

    async deleteFlashcard(id) {
        return await this.flashcardRepository.deleteFlashcard(id);
    }

    async getFlashcardReview(listId) {
        const { flashcards, flashcardList } = await this.flashcardRepository.findFlashcardListById(listId);
        if (!flashcards || flashcards.length == 0) {
            throw new Error("Không có flashcard nào trong danh sách này.");
        }
        return { flashcards, flashcardList };
    }
}

module.exports = FlashcardService;