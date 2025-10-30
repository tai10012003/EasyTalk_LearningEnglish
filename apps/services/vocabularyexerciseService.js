const { VocabularyexerciseRepository } = require('./../repositories');

class VocabularyexerciseService {
    constructor() {
        this.vocabularyexerciseRepository = new VocabularyexerciseRepository();
    }

    async getVocabularyExerciseList(page = 1, limit = 12, role = "user") {
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        return await this.vocabularyexerciseRepository.findVocabularyExercises(filter, page, limit);
    }

    async getVocabularyExerciseById(id) {
        return await this.vocabularyexerciseRepository.findVocabularyExerciseById(id);
    }

    async getVocabularyexerciseBySlug(slug) {
        return await this.vocabularyexerciseRepository.findVocabularyExerciseBySlug(slug);
    }

    async insertVocabularyExercise(exerciseData) {
        return await this.vocabularyexerciseRepository.insertVocabularyExercise(exerciseData);
    }

    async updateVocabularyExercise(id, updateData) {
        return await this.vocabularyexerciseRepository.updateVocabularyExercise(id, updateData);
    }

    async deleteVocabularyExercise(id) {
        return await this.vocabularyexerciseRepository.deleteVocabularyExercise(id);
    }
}

module.exports = VocabularyexerciseService;