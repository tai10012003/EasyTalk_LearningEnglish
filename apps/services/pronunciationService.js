const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class PronunciationsService {
    databaseConnection = require('./../database/database');
    pronunciations = require('./../models/pronunciation');

    client;
    pronunciationsDatabase;
    pronunciationsCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.pronunciationsDatabase = this.client.db(config.mongodb.database);
        this.pronunciationsCollection = this.pronunciationsDatabase.collection("pronunciations"); // Đảm bảo tên giống trong database
    }
    async getPronunciationList(page = 1, limit = 3) {
        const skip = (page - 1) * limit; 

        // Lấy danh sách bài ngữ pháp từ MongoDB
        const cursor = await this.pronunciationsCollection
            .find({}, {})
            .skip(skip)
            .limit(limit);

        const pronunciations = await cursor.toArray(); 
        const totalPronunciations = await this.pronunciationsCollection.countDocuments();

        return {
            pronunciations,     
            totalPronunciations, 
        };
    }

    async getPronunciation(id) {
        return await this.pronunciationsCollection.findOne({ _id: new ObjectId(id) });
    }
    // Thêm mới một grammar
    async insertPronunciation(pronunciation) {
        pronunciation.createdAt = new Date(); // Thêm thuộc tính createdAt với giá trị hiện tại
        return await this.pronunciationsCollection.insertOne(pronunciation);
    }
    // Cập nhật một grammar theo ID
    async updatePronunciation(pronunciation) {
        return await this.pronunciationsCollection.updateOne(
            { _id: new ObjectId(pronunciation._id) },
            { $set: pronunciation }
        );
    }
    // Xóa một grammar theo ID
    async deletePronunciation(id) {
        return await this.pronunciationsCollection.deleteOne({ "_id": new ObjectId(id) });
    }
}

module.exports = PronunciationsService;
