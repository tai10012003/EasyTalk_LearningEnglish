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

    async getStoryList(page = 1, limit = 6) {
        const skip = (page - 1) * limit;
        const cursor = await this.storyCollection
            .find({})
            .skip(skip)
            .limit(limit);

        const stories = await cursor.toArray();
        const totalStory = await this.storyCollection.countDocuments();
        return {
            stories,
            totalStory,
        };
    }

    async getStory(id) {
        return await this.storyCollection.findOne({ _id: new ObjectId(id) });
    }

    async insertStory(stories) {
        stories.createdAt = new Date();
        return await this.storyCollection.insertOne(stories);
    }

    async updateStory(stories) {
        const { _id, ...updateFields } = stories;
        return await this.storyCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateFields }
        );
    }    

    async deleteStory(id) {
        return await this.storyCollection.deleteOne({ "_id": new ObjectId(id) });
    }
}

module.exports = StoryService;
