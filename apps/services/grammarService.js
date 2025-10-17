const fs = require("fs");
const path = require("path");
const { GrammarRepository } = require("./../repositories");

class GrammarsService {
    constructor() {
        this.grammarRepository = new GrammarRepository();
        this.imageFolder = path.join(__dirname, "../public/images/grammar");
        if (!fs.existsSync(this.imageFolder)) fs.mkdirSync(this.imageFolder, { recursive: true });
    }

    async getGrammarList(page = 1, limit = 12, search = "") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (search) filter.title = { $regex: search, $options: "i" };
        const { grammars, total } = await this.grammarRepository.findAll(filter, skip, limit);
        return { grammars, totalGrammars: total };
    }

    async getGrammar(id) {
        return await this.grammarRepository.findById(id);
    }

    async insertGrammar(grammar) {
        const newGrammar = {
            title: grammar.title,
            description: grammar.description,
            content: grammar.content,
            images: grammar.images,
            quizzes: [],
            createdAt: new Date()
        };
        if (grammar.quizzes && Array.isArray(grammar.quizzes)) {
            grammar.quizzes.forEach(question => {
                newGrammar.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        return await this.grammarRepository.insert(newGrammar);
    }

    async updateGrammar(id, grammar) {
        const formattedQuestions = grammar.quizzes.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        const updateData = {
            title: grammar.title.trim(),
            description: grammar.description.trim(),
            content: grammar.content.trim(),
            images: grammar.images.trim(),
            quizzes: formattedQuestions,
            updatedAt: new Date()
        };
        return await this.grammarRepository.update(id, updateData);
    }

    async deleteGrammar(id) {
        return await this.grammarRepository.delete(id);
    }

    getNextImageFilename(ext) {
        const files = fs.readdirSync(this.imageFolder).filter(f => f.startsWith("grammar-"));
        const numbers = files
            .map(f => parseInt(f.match(/^grammar-(\d+)\./)?.[1]))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        let nextNumber = 1;
        for (let i = 0; i < numbers.length; i++) {
            if (numbers[i] !== i + 1) {
                nextNumber = i + 1;
                break;
            }
            nextNumber = numbers.length + 1;
        }
        return `grammar-${nextNumber}${ext}`;
    }
}

module.exports = GrammarsService;