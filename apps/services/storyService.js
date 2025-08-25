const { ObjectId } = require('mongodb');
const config = require("./../config/setting.json");

class StoryService {
    databaseConnection = require('./../database/database');
    stories = require('./../models/story');

    client;
    storyDatabase;
    storyCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.storyDatabase = this.client.db(config.mongodb.database);
        this.storyCollection = this.storyDatabase.collection("stories");
    }

    async getStoryList(page = 1, limit = 6, category = "", level = "", search = "") {
        try {
            const skip = (page - 1) * limit;
            const filter = {};
            if (category) filter.category = category;
            if (level) filter.level = level;
            if (search) {
                filter.title = { $regex: search, $options: "i" };
            }
            const cursor = await this.storyCollection.find(filter).skip(skip).limit(limit);
            const stories = await cursor.toArray();
            const totalStory = await this.storyCollection.countDocuments(filter);
            return { stories, totalStory };
        } catch (error) {
            console.error("Error in getStoryList:", error);
            throw new Error("Error fetching stories");
        }
    }
    
    async getStory(id) {
        try {
            return await this.storyCollection.findOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error("Error in getStory:", error);
            throw new Error("Error fetching story by id");
        }
    }

    async insertStory(storyData) {
        try {
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
            return await this.storyCollection.insertOne(newStory);
        } catch (error) {
            console.error("Error in insertStory:", error);
            throw new Error("Error inserting story");
        }
    }

    async updateStory(storyData) {
        try {
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
            return await this.storyCollection.updateOne(
                { _id: new ObjectId(_id) },
                { $set: updateFields }
            );
        } catch (error) {
            console.error("Error in updateStory:", error);
            throw new Error("Error updating story");
        }
    }

    async deleteStory(id) {
        try {
            return await this.storyCollection.deleteOne({ _id: new ObjectId(id) });
        } catch (error) {
            console.error("Error in deleteStory:", error);
            throw new Error("Error deleting story");
        }
    }
}

module.exports = StoryService;