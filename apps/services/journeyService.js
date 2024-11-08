const { ObjectId } = require('mongodb');
const config = require("./../config/setting.json");

class JourneyService {
    databaseConnection = require('./../database/database');
    journeys = require('./../models/journey');

    client;
    journeysDatabase;
    journeysCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.journeysDatabase = this.client.db(config.mongodb.database);
        this.journeysCollection = this.journeysDatabase.collection("journeys"); // Đảm bảo tên giống trong database
    }

    // Lấy danh sách các hành trình
    async getJourneyList(page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const cursor = await this.journeysCollection
            .find({})
            .skip(skip)
            .limit(limit);

        const journeys = await cursor.toArray();
        const totalJourneys = await this.journeysCollection.countDocuments();

        return {
            journeys,       // Danh sách hành trình cho trang hiện tại
            totalJourneys,  // Tổng số hành trình
        };
    }
    async getAllJourneysWithDetails() {
        return await this.journeysCollection.aggregate([
            {
                $lookup: {
                    from: 'gates',               // Tên collection chứa các cổng
                    localField: '_id',           // Liên kết bằng _id của hành trình
                    foreignField: 'journey',     // `journey` là trường trong collection gates tham chiếu đến _id của hành trình
                    as: 'gates'
                }
            },
            {
                $unwind: {
                    path: "$gates",
                    preserveNullAndEmptyArrays: true // Để giữ lại các hành trình không có cổng
                }
            },
            {
                $lookup: {
                    from: 'stages',              // Tên collection chứa các chặng
                    localField: 'gates._id',     // Liên kết bằng _id của gate
                    foreignField: 'gate',        // `gate` là trường trong collection stages tham chiếu đến _id của cổng
                    as: 'gates.stages'
                }
            },
            {
                $group: {
                    _id: "$_id",
                    title: { $first: "$title" },
                    createdAt: { $first: "$createdAt" },
                    gates: { $push: "$gates" }   // Gom tất cả các cổng và chặng lại thành một mảng
                }
            }
        ]).toArray();
    }    

    async getJourneyWithDetails(journeyId) {
        try {
            return await this.journeysCollection.aggregate([
                { $match: { _id: new ObjectId(journeyId) } },
                {
                    $lookup: {
                        from: 'gates',
                        localField: 'gates',
                        foreignField: '_id',
                        as: 'gates'
                    }
                },
                {
                    $unwind: { path: "$gates", preserveNullAndEmptyArrays: true }
                },
                {
                    $lookup: {
                        from: 'stages',
                        localField: 'gates.stages',
                        foreignField: '_id',
                        as: 'gates.stages'
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        title: { $first: "$title" },
                        gates: { $push: "$gates" }
                    }
                }
            ]).toArray().then(result => result[0]);
        } catch (error) {
            console.error("Error fetching journey details:", error);
            throw error;
        }
    }        
    // Lấy một Journey theo ID
    async getJourney(id) {
        return await this.journeysCollection.findOne({ _id: new ObjectId(id) });
    }

    // Thêm mới một Journey
    async insertJourney(journey) {
        journey.createdAt = new Date();
        journey.gates = [];  // Thêm mảng `gates` trống khi khởi tạo
        return await this.journeysCollection.insertOne(journey);
    }

    // Thêm Gate ID vào Journey
    async addGateToJourney(journeyId, gateId) {
        return await this.journeysCollection.updateOne(
            { _id: new ObjectId(journeyId) },
            { $addToSet: { gates: new ObjectId(gateId) } }
        );
    }

    // Xóa Gate ID khỏi Journey
    async removeGateFromJourney(journeyId, gateId) {
        return await this.journeysCollection.updateOne(
            { _id: new ObjectId(journeyId) },
            { $pull: { gates: new ObjectId(gateId) } }
        );
    }

    // Cập nhật Journey
    async updateJourney(journey) {
        const { _id, ...updateData } = journey;
        return await this.journeysCollection.updateOne(
            { _id: new ObjectId(_id) },
            { $set: updateData }
        );
    }

    // Xóa một Journey theo ID
    async deleteJourney(id) {
        return await this.journeysCollection.deleteOne({ _id: new ObjectId(id) });
    }



}

module.exports = JourneyService;
