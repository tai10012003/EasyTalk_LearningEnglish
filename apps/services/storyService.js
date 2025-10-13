const fs = require("fs");
const path = require("path");
const { StoryRepository } = require("./../repositories");

class StoryService {
    constructor() {
        this.storyRepository = new StoryRepository();
        this.imageFolder = path.join(__dirname, "../public/images/story");
        if (!fs.existsSync(this.imageFolder)) fs.mkdirSync(this.imageFolder, { recursive: true });
    }

    async getStoryList(page = 1, limit = 6, category = "", level = "", search = "") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (search) filter.title = { $regex: search, $options: "i" };

        const { stories, total } = await this.storyRepository.findAll(filter, skip, limit);
        return { stories, totalStory: total };
    }

    async getStory(id) {
        return await this.storyRepository.findById(id);
    }

    async insertStory(storyData) {
        const newStory = {
            title: storyData.title,
            description: storyData.description,
            level: storyData.level,
            category: storyData.category,
            image: storyData.image || '',
            content: [],
            createdAt: new Date()
        };
        if (storyData.content && Array.isArray(storyData.content)) {
            storyData.content.forEach(sentence => {
                const sentenceObj = {
                    en: sentence.en,
                    vi: sentence.vi,
                    vocabulary: sentence.vocabulary || [],
                    quiz: sentence.quiz
                        ? {
                              question: sentence.quiz.question,
                              type: sentence.quiz.type,
                              answer: sentence.quiz.answer,
                              explanation: sentence.quiz.explanation || '',
                              options: sentence.quiz.options || []
                          }
                        : null
                };
                newStory.content.push(sentenceObj);
            });
        }
        return await this.storyRepository.insert(newStory);
    }

    async updateStory(storyData) {
        const { _id, ...updateFields } = storyData;

        if (updateFields.content && Array.isArray(updateFields.content)) {
            updateFields.content = updateFields.content.map(sentence => ({
                en: sentence.en,
                vi: sentence.vi,
                vocabulary: sentence.vocabulary || [],
                quiz: sentence.quiz
                    ? {
                          question: sentence.quiz.question,
                          type: sentence.quiz.type,
                          answer: sentence.quiz.answer,
                          explanation: sentence.quiz.explanation || '',
                          options: sentence.quiz.options || []
                      }
                    : null
            }));
        }
        updateFields.updatedAt = new Date();
        return await this.storyRepository.update(_id, updateFields);
    }

    async deleteStory(id) {
        return await this.storyRepository.delete(id);
    }

    getNextImageFilename(ext) {
        const files = fs.readdirSync(this.imageFolder).filter(f => f.startsWith("story-"));
        const numbers = files
            .map(f => parseInt(f.match(/^story-(\d+)\./)?.[1]))
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
        return `story-${nextNumber}${ext}`;
    }
}

module.exports = StoryService;