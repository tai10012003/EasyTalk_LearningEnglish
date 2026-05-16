const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');
const { buildFlashcardListQuery, buildFlashcardListByIdQuery, buildFlashcardByListQuery, buildFlashcardByIdQuery } = require('./queries/flashcardQueries');

class FlashcardRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.flashcardsCollection = this.db.collection("flashcards");
        this.flashcardListsCollection = this.db.collection("flashcardlists");
    }

    async findFlashcardLists(filter = {}, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        const pipeline = buildFlashcardListQuery();
        pipeline.unshift({ $match: filter });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });
        const flashcardLists = await this.flashcardListsCollection.aggregate(pipeline).toArray();
        const totalFlashcardLists = await this.flashcardListsCollection.countDocuments(filter);
        return { flashcardLists, totalFlashcardLists };
    }

    async getWordCountForList(listId) {
        return await this.flashcardsCollection.countDocuments({ 
            flashcardList: new ObjectId(listId) 
        });
    }

    async findFlashcardListById(id) {
        const listPipeline = buildFlashcardListByIdQuery(id);
        const flashcardList = await this.flashcardListsCollection.aggregate(listPipeline).next();
        if(!flashcardList) {
            return { flashcardList: null, flashcards: [] };
        }
        const cardsPipeline = buildFlashcardByListQuery(id);
        const flashcards = await this.flashcardsCollection.aggregate(cardsPipeline).toArray();
        return { flashcardList, flashcards };
    }

    async findFlashcardListByIdOnly(id) {
        const pipeline = buildFlashcardListByIdQuery(id);
        return await this.flashcardListsCollection.aggregate(pipeline).next();
    }

    async findFlashcardById(id) {
        const pipeline = buildFlashcardByIdQuery(id);
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

    async updateFlashcardBulkWrite(operations) {
        return await this.flashcardsCollection.bulkWrite(operations);
    }

    async deleteFlashcard(id) {
        return await this.flashcardsCollection.deleteOne({ _id: new ObjectId(id) });
    }

    async deleteFlashcardsByListId(listId) {
        return await this.flashcardsCollection.deleteMany({ 
            flashcardList: new ObjectId(listId) 
        });
    }

    async findFlashcardsByListId(listId) {
        return await this.flashcardsCollection.find({ 
            flashcardList: new ObjectId(listId) 
        }).toArray();
    }

    async findFlashcardListsByUserId(userId) {
        return await this.flashcardListsCollection.find({ 
            user: new ObjectId(userId) 
        }).toArray();
    }

    async deleteFlashcardListsByUserId(userId) {
        return await this.flashcardListsCollection.deleteMany({ 
            user: new ObjectId(userId) 
        });
    }
}

module.exports = FlashcardRepository;