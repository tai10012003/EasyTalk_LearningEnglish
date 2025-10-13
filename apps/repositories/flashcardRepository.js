const { ObjectId } = require('mongodb');
const config = require('./../config/setting.json');
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

    async findFlashcardLists(page = 1, limit = 5) {
        const skip = (page - 1) * limit;
        const cursor = await this.flashcardListsCollection.find({}).skip(skip).limit(limit);
        const flashcardLists = await cursor.toArray();
        const totalFlashcardLists = await this.flashcardListsCollection.countDocuments();

        for (let list of flashcardLists) {
            list.wordCount = await this.flashcardsCollection.countDocuments({ flashcardList: list._id.toString() });
        }

        return { flashcardLists, totalFlashcardLists };
    }

    async findFlashcardListById(id) {
        const flashcardList = await this.flashcardListsCollection.findOne({ _id: new ObjectId(id) });
        const flashcards = await this.flashcardsCollection.find({ flashcardList: id }).toArray();
        return { flashcardList, flashcards };
    }

    async insertFlashcardList(flashcardList) {
        flashcardList.createdAt = new Date();
        return await this.flashcardListsCollection.insertOne(flashcardList);
    }

    async updateFlashcardList(id, flashcardListData) {
        return await this.flashcardListsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: flashcardListData }
        );
    }

    async deleteFlashcardList(id) {
        return await this.flashcardListsCollection.deleteOne({ _id: new ObjectId(id) });
    }

    async insertFlashcard(flashcard) {
        flashcard.createdAt = new Date();
        return await this.flashcardsCollection.insertOne(flashcard);
    }

    async updateFlashcard(id, flashcardData) {
        return await this.flashcardsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: flashcardData }
        );
    }

    async deleteFlashcard(id) {
        return await this.flashcardsCollection.deleteOne({ _id: new ObjectId(id) });
    }
}

module.exports = FlashcardRepository;