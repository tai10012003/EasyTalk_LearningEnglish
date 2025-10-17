const { PronunciationexerciseRepository } = require('./../repositories');

class PronunciationexerciseService {
    constructor() {
        this.pronunciationexerciseRepository = new PronunciationexerciseRepository();
    }

    async getPronunciationexerciseList(page = 1, limit = 12) {
        return await this.pronunciationexerciseRepository.findPronunciationExercises(page, limit);
    }

    async getPronunciationexerciseById(id) {
        return await this.pronunciationexerciseRepository.findPronunciationExerciseById(id);
    }

    async insertPronunciationexercise(exerciseData) {
        return await this.pronunciationexerciseRepository.insertPronunciationExercise(exerciseData);
    }

    async updatePronunciationexercise(id, updateData) {
        return await this.pronunciationexerciseRepository.updatePronunciationExercise(id, updateData);
    }

    async deletePronunciationexercise(id) {
        return await this.pronunciationexerciseRepository.deletePronunciationExercise(id);
    }
}

module.exports = PronunciationexerciseService;
