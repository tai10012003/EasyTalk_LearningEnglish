const { FlashcardRepository } = require('./../repositories');

class FlashcardService {
    constructor() {
        this.flashcardRepository = new FlashcardRepository();
    }

    async getFlashcardList(page = 1, limit = 5) {
        return await this.flashcardRepository.findFlashcardLists(page, limit);
    }

    async getFlashcardListById(id) {
        return await this.flashcardRepository.findFlashcardListById(id);
    }

    async insertFlashcardList(flashcardList) {
        return await this.flashcardRepository.insertFlashcardList(flashcardList);
    }

    async updateFlashcardList(id, flashcardListData) {
        return await this.flashcardRepository.updateFlashcardList(id, flashcardListData);
    }

    async deleteFlashcardList(id) {
        return await this.flashcardRepository.deleteFlashcardList(id);
    }

    async insertFlashcard(flashcard) {
        return await this.flashcardRepository.insertFlashcard(flashcard);
    }

    async updateFlashcard(id, flashcardData) {
        return await this.flashcardRepository.updateFlashcard(id, flashcardData);
    }

    async deleteFlashcard(id) {
        return await this.flashcardRepository.deleteFlashcard(id);
    }
}

module.exports = FlashcardService;