const { ObjectId } = require('mongodb');
var config = require("./../config/setting.json");

class UsersService {
    databaseConnection = require('./../database/database');
    users = require('./../models/user');

    client;
    usersDatabase;
    usersCollection;

    constructor() {
        this.client = this.databaseConnection.getMongoClient();
        this.usersDatabase = this.client.db(config.mongodb.database);
        this.usersCollection = this.usersDatabase.collection("users");
    }

    async getUserList(page = 1, limit = 3, role = "") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (role) filter.role = role;
        const cursor = await this.usersCollection
            .find(filter)
            .skip(skip)
            .limit(limit);

        const users = await cursor.toArray(); 
        const totalUsers = await this.usersCollection.countDocuments(); 

        return {
            users,      
            totalUsers, 
        };
    }

    async getUser(id) {
        return await this.usersCollection.findOne({ _id: new ObjectId(id) });
    }

    async getUserByEmail(email) {
        return await this.usersCollection.findOne({ email });
    }

    async updatePassword(userId, hashedNewPassword) {
        try {
          await this.usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { password: hashedNewPassword } }
          );
        } catch (error) {
          console.error("Error updating password:", error);
          throw new Error("Failed to update password.");
        }
    } 
         
    async insertUser(user) {
        user.createdAt = new Date(); 
        return await this.usersCollection.insertOne(user);
    }

    async updateUser(user) {
            const { _id, ...updateFields } = user;

            const result = await this.usersCollection.updateOne(
                { _id: new ObjectId(_id) },
                { $set: updateFields }
            );
            return result;
    }    

    async deleteUser(id) {
        return await this.usersCollection.deleteOne({ "_id": new ObjectId(id) });
    }
}

module.exports = UsersService;
