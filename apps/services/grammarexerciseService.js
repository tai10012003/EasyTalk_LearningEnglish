const { GrammarexerciseRepository } = require('./../repositories');

class GrammarexerciseService {
    constructor() {
        this.grammarexerciseRepository = new GrammarexerciseRepository();
    }

    async getGrammarexerciseList(page = 1, limit = 2) {
        return await this.grammarexerciseRepository.findGrammarExercises(page, limit);
    }

    async getGrammarexerciseById(id) {
        return await this.grammarexerciseRepository.findGrammarExerciseById(id);
    }

    async insertGrammarexercise(exerciseData) {
        return await this.grammarexerciseRepository.insertGrammarExercise(exerciseData);
    }

    async updateGrammarexercise(id, updateData) {
        return await this.grammarexerciseRepository.updateGrammarExercise(id, updateData);
    }

    async deleteGrammarexercise(id) {
        return await this.grammarexerciseRepository.deleteGrammarExercise(id);
    }
}

module.exports = GrammarexerciseService;