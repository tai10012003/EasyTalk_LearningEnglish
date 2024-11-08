const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class FlashcardsService {
    databaseConnection = require('./../database/database');
    flashcards = require('./../models/flashcard');
    flashcardlists = require('./../models/flashcard_list');
    client;
    flashcardsDatabase;
    flashcardsCollection;
    flashcardListsCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.flashcardsDatabase = this.client.db(config.mongodb.database);
        this.flashcardsCollection = this.flashcardsDatabase.collection("flashcards"); // Tên bảng flashcards
        this.flashcardListsCollection = this.flashcardsDatabase.collection("flashcardlists"); // Tên bảng flashcard lists
    }


async getFlashcardList(page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    // Fetch the flashcard lists with pagination
    const cursor = await this.flashcardListsCollection
        .find({}, {})
        .skip(skip)
        .limit(limit);

    const flashcardLists = await cursor.toArray();
    const totalFlashcardLists = await this.flashcardListsCollection.countDocuments();

    for (let list of flashcardLists) {
        list.wordCount = await this.flashcardsCollection.countDocuments({ flashcardList: list._id.toString() });
    }

    return {
        flashcardLists,
        totalFlashcardLists,
    };
}

    // Lấy một flashcard list theo ID
    async getFlashcardListById(id) {
        const flashcardList = await this.flashcardListsCollection.findOne({ _id: new ObjectId(id) });
        const flashcards = await this.flashcardsCollection.find({ flashcardList: id }).toArray();
        return { flashcardList, flashcards };
    }

    // Thêm một flashcard list mới
    async insertFlashcardList(flashcardList) {
        flashcardList.createdAt = new Date();
        return await this.flashcardListsCollection.insertOne(flashcardList);
    }

    // Cập nhật flashcard list
    async updateFlashcardList(id, flashcardListData) {
        return await this.flashcardListsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: flashcardListData }
        );
    }

    // Xóa một flashcard list
    async deleteFlashcardList(id) {
        return await this.flashcardListsCollection.deleteOne({ _id: new ObjectId(id) });
    }

    // Thêm một flashcard vào danh sách
    async insertFlashcard(flashcard) {
        flashcard.createdAt = new Date();
        return await this.flashcardsCollection.insertOne(flashcard);
    }

    // Xóa một flashcard theo ID
    async deleteFlashcard(id) {
        return await this.flashcardsCollection.deleteOne({ _id: new ObjectId(id) });
    }

    // Cập nhật flashcard theo ID
    async updateFlashcard(id, flashcardData) {
        return await this.flashcardsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: flashcardData }
        );
    }
}

module.exports = FlashcardsService;
