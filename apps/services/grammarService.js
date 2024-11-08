const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class GrammarsService {
    databaseConnection = require('./../database/database');
    grammars = require('./../models/grammar');

    client;
    grammarsDatabase;
    grammarsCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.grammarsDatabase = this.client.db(config.mongodb.database);
        this.grammarsCollection = this.grammarsDatabase.collection("grammars"); // Đảm bảo tên giống trong database
    }
    // Hàm lấy danh sách bài ngữ pháp có phân trang
    async getGrammarList(page = 1, limit = 2) {
        const skip = (page - 1) * limit; // Tính số lượng cần bỏ qua cho phân trang

        // Lấy danh sách bài ngữ pháp từ MongoDB
        const cursor = await this.grammarsCollection
            .find({}, {})
            .skip(skip)
            .limit(limit);

        const grammars = await cursor.toArray(); // Chuyển cursor thành mảng
        const totalGrammars = await this.grammarsCollection.countDocuments(); // Đếm tổng số bài ngữ pháp

        return {
            grammars,       // Danh sách bài ngữ pháp cho trang hiện tại
            totalGrammars,  // Tổng số bài ngữ pháp
        };
    }
    // Lấy một grammar theo ID
    async getGrammar(id) {
        return await this.grammarsCollection.findOne({ _id: new ObjectId(id) });
    }
    // Thêm mới một grammar
    async insertGrammar(grammar) {
        grammar.createdAt = new Date(); // Thêm thuộc tính createdAt với giá trị hiện tại
        return await this.grammarsCollection.insertOne(grammar);
    }
    // Cập nhật một grammar theo ID
    async updateGrammar(grammar) {
        return await this.grammarsCollection.updateOne(
            { _id: new ObjectId(grammar._id) },
            { $set: grammar }
        );
    }
    // Xóa một grammar theo ID
    async deleteGrammar(id) {
        return await this.grammarsCollection.deleteOne({ "_id": new ObjectId(id) });
    }
}

module.exports = GrammarsService;
