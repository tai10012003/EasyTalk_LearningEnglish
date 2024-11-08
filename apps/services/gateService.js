// GateService.js

const { ObjectId } = require("mongodb");
const config = require("./../config/setting.json");

class GateService {
    databaseConnection = require('./../database/database');
    gates = require('./../models/gate');
    client;
    gatesDatabase;
    gatesCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.gatesDatabase = this.client.db(config.mongodb.database);
        this.gatesCollection = this.gatesDatabase.collection("gates");
    }

    // Lấy danh sách các Gate với thông tin Journey liên quan, có phân trang
    async getGateList(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
    
        const gates = await this.gatesCollection.aggregate([
            {
                $lookup: {
                    from: "journeys",
                    localField: "journey",
                    foreignField: "_id",
                    as: "journeyInfo"
                }
            },
            { $unwind: { path: "$journeyInfo", preserveNullAndEmptyArrays: true } },
            { $skip: skip },
            { $limit: limit }
        ]).toArray();
    
        const totalGates = await this.gatesCollection.countDocuments();
    
        return { gates, totalGates };
    }

    // Lấy một Gate theo ID
    async getGateById(gateId) {
        return await this.gatesCollection.findOne({ _id: new ObjectId(gateId) });
    }
    async getGatesInJourney(journeyId) {
        return await this.gatesCollection.find({ journey: new ObjectId(journeyId) }).sort({ _id: 1 }).toArray();
    }
    // Thêm Gate mới
    async insertGate(gate) {
        gate.stages = [];
        gate.createdAt = new Date();
        return await this.gatesCollection.insertOne(gate);
    }

    // Cập nhật Gate
    async updateGate(gate) {
        const { _id, ...updateData } = gate;
        return await this.gatesCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );
    }

    // Xóa Gate theo ID
    async deleteGate(id) {
        return await this.gatesCollection.deleteOne({ _id: new ObjectId(id) });
    }

    // Xóa nhiều Gates dựa trên ID Journey
    async deleteGatesByJourney(journeyId) {
        return await this.gatesCollection.deleteMany({ journey: new ObjectId(journeyId) });
    }
    // Thêm stage vào danh sách stages của gate
    async addStageToGate(gateId, stageId) {
        try {
            return await this.gatesCollection.updateOne(
                { _id: new ObjectId(gateId) },
                { $addToSet: { stages: new ObjectId(stageId) } } // Sử dụng $addToSet để tránh thêm trùng lặp
            );
        } catch (error) {
            console.error("Error in addStageToGate:", error);
            throw error;
        }
    }

    // Xóa stage khỏi danh sách stages của gate
    async removeStageFromGate(gateId, stageId) {
        try {
            return await this.gatesCollection.updateOne(
                { _id: new ObjectId(gateId) },
                { $pull: { stages: new ObjectId(stageId) } } // Sử dụng $pull để xóa stageId khỏi mảng stages
            );
        } catch (error) {
            console.error("Error in removeStageFromGate:", error);
            throw error;
        }
    }
}

module.exports = GateService;
