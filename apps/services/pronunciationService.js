const fs = require("fs");
const path = require("path");
const { PronunciationRepository } = require("./../repositories");

class PronunciationsService {
    constructor() {
        this.pronunciationRepository = new PronunciationRepository();
        this.imageFolder = path.join(__dirname, "../public/images/pronunciation");
        if (!fs.existsSync(this.imageFolder)) fs.mkdirSync(this.imageFolder, { recursive: true });
    }
    async getPronunciationList(page = 1, limit = 12, role = "user") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        const { items, total } = await this.pronunciationRepository.findAll(filter, skip, limit);
        return {
            pronunciations: items,
            totalPronunciations: total
        };
    }

    async getPronunciation(id) {
        return await this.pronunciationRepository.findById(id);
    }

    async getPronunciationBySlug(slug) {
        return await this.pronunciationRepository.findBySlug(slug);
    }

    async insertPronunciation(pronunciation) {
        const newPronunciation = {
            title: pronunciation.title,
            description: pronunciation.description,
            content: pronunciation.content,
            images: pronunciation.images,
            quizzes: [],
            slug: pronunciation.slug,
            sort: pronunciation.sort,
            display: pronunciation.display,
            createdAt: new Date()
        };
        if (pronunciation.quizzes && Array.isArray(pronunciation.quizzes)) {
            pronunciation.quizzes.forEach(question => {
                newPronunciation.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        return await this.pronunciationRepository.insert(newPronunciation);
    }

    async updatePronunciation(id, pronunciation) {
        const formattedQuestions = pronunciation.quizzes.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        const updateData = {
            title: pronunciation.title.trim(),
            description: pronunciation.description.trim(),
            content: pronunciation.content.trim(),
            images: pronunciation.images.trim(),
            quizzes: formattedQuestions,
            slug: pronunciation.slug,
            sort: pronunciation.sort,
            display: pronunciation.display,
            updatedAt: new Date()
        };
        return await this.pronunciationRepository.update(id, updateData);
    }

    async deletePronunciation(id) {
        return await this.pronunciationRepository.delete(id);
    }

    getNextImageFilename(ext) {
        const files = fs.readdirSync(this.imageFolder).filter(f => f.startsWith("pronunciation-"));
        const numbers = files
            .map(f => parseInt(f.match(/^pronunciation-(\d+)\./)?.[1]))
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
        return `pronunciation-${nextNumber}${ext}`;
    }
}

module.exports = PronunciationsService;