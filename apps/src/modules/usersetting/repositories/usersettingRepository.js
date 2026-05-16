const { ObjectId } = require("mongodb");
const DatabaseConnection = require("../../../shared/database/database");
const config = require("../../../shared/config/setting");

class UserSettingRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("usersettings");
    }

    async findByUserId(userId) {
        return await this.collection.findOne({ user: new ObjectId(userId) });
    }

    async insert(userSetting) {
        return await this.collection.insertOne(userSetting);
    }

    async update(userId, updateFields, upsert = true) {
        return await this.collection.updateOne(
            { user: new ObjectId(userId) },
            { $set: updateFields },
            { upsert }
        );
    }

    async delete(userId) {
        const result = await this.collection.deleteOne({ 
            user: new ObjectId(userId) 
        });
        return result.deletedCount > 0;
    }
}

module.exports = UserSettingRepository;