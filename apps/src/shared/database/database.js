const { MongoClient } = require('mongodb');
const config = require("../config/setting");

class DatabaseConnection {
    static client = null;
    static url = null;

    static buildMongoUrl() {
        if(process.env.MONGODB_URI) {
            return process.env.MONGODB_URI;
        }
        const user = encodeURIComponent(config.mongodb.username || "");
        const pass = encodeURIComponent(config.mongodb.password || "");
        return `mongodb+srv://${user}:${pass}@learningenglish.3eotl.mongodb.net/?retryWrites=true&w=majority`;
    }

    static getMongoClient() {
        if(!this.client) {
            this.url = this.buildMongoUrl();
            this.client = new MongoClient(this.url);
        }
        return this.client;
    }
}

module.exports = DatabaseConnection;