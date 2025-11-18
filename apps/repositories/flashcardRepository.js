const { ObjectId } = require('mongodb');
const config = require('../config/setting');
const DatabaseConnection = require('./../database/database');

class FlashcardRepository {
    client;
    db;
    flashcardsCollection;
    flashcardListsCollection;

    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.flashcardsCollection = this.db.collection("flashcards");
        this.flashcardListsCollection = this.db.collection("flashcardlists");
    }

    async findFlashcardLists(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userObj"
                }
            },
            {
                $addFields: {
                    username: { $arrayElemAt: ["$userObj.username", 0] }
                }
            },
            { $project: { userObj: 0 } },
            { $skip: skip },
            { $limit: limit }
        ];
        const flashcardLists = await this.flashcardListsCollection.aggregate(pipeline).toArray();
        const totalFlashcardLists = await this.flashcardListsCollection.countDocuments(filter);
        for (let list of flashcardLists) {
            list.wordCount = await this.getWordCountForList(list._id.toString());
        }

        return { flashcardLists, totalFlashcardLists };
    }

    async getWordCountForList(listId) {
        return await this.flashcardsCollection.countDocuments({ flashcardList: new ObjectId(listId) });
    }

    async findFlashcardListById(id) {
        const listPipeline = [
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userObj"
                }
            },
            {
                $addFields: {
                    username: { $arrayElemAt: ["$userObj.username", 0] }
                }
            },
            { $project: { userObj: 0 } }
        ];
        const flashcardList = await this.flashcardListsCollection.aggregate(listPipeline).next();

        if (!flashcardList) {
            return { flashcardList: null, flashcards: [] };
        }

        const cardsPipeline = [
            { $match: { flashcardList: new ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userObj"
                }
            },
            {
                $addFields: {
                    username: { $arrayElemAt: ["$userObj.username", 0] }
                }
            },
            { $project: { userObj: 0 } }
        ];
        const flashcards = await this.flashcardsCollection.aggregate(cardsPipeline).toArray();

        return { flashcardList, flashcards };
    }

    async findFlashcardListByIdOnly(id) {
        const pipeline = [
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userObj"
                }
            },
            {
                $addFields: {
                    username: { $arrayElemAt: ["$userObj.username", 0] }
                }
            },
            { $project: { userObj: 0 } }
        ];
        return await this.flashcardListsCollection.aggregate(pipeline).next();
    }

    async findFlashcardById(id) {
        const pipeline = [
            { $match: { _id: new ObjectId(id) } },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userObj"
                }
            },
            {
                $addFields: {
                    username: { $arrayElemAt: ["$userObj.username", 0] }
                }
            },
            { $project: { userObj: 0 } }
        ];
        return await this.flashcardsCollection.aggregate(pipeline).next();
    }

    async insertFlashcardList(flashcardListData) {
        const flashcardList = { ...flashcardListData, createdAt: new Date() };
        return await this.flashcardListsCollection.insertOne(flashcardList);
    }

    async updateFlashcardList(id, updateData) {
        return await this.flashcardListsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
    }

    async deleteFlashcardList(id) {
        return await this.flashcardListsCollection.deleteOne({ _id: new ObjectId(id) });
    }

    async insertFlashcard(flashcardData) {
        const flashcard = { ...flashcardData, createdAt: new Date() };
        return await this.flashcardsCollection.insertOne(flashcard);
    }

    async updateFlashcard(id, updateData) {
        return await this.flashcardsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
    }

    async updateFlashcardbulkWrite(operations) {
        return await this.flashcardsCollection.bulkWrite(operations);
    }

    async deleteFlashcard(id) {
        return await this.flashcardsCollection.deleteOne({ _id: new ObjectId(id) });
    }

    async deleteFlashcardsByListId(listId) {
        return await this.flashcardsCollection.deleteMany({ flashcardList: new ObjectId(listId) });
    }
}

module.exports = FlashcardRepository;