const { MongoClient, ObjectId } = require('mongodb');

class MongoDBTestHelper {
    constructor(url, dbName) {
        this.url = url || 'mongodb+srv://adminTai:Tai12345@learningenglish.3eotl.mongodb.net/?retryWrites=true&w=majority';
        this.dbName = dbName || 'studyenglish_db';
        this.client = null;
        this.db = null;
    }

    // Kết nối tới MongoDB
    async connect() {
        this.client = new MongoClient(this.url);
        await this.client.connect();
        this.db = this.client.db(this.dbName);
    }

    // Đóng kết nối MongoDB
    async close() {
        await this.client.close();
    }

    // Insert một tài liệu vào collection
    async insertOne(collectionName, doc) {
        const collection = this.db.collection(collectionName);
        const result = await collection.insertOne(doc);
        return result;
    }

    async deleteNearByUseIdDefault(collectionName) {
        // Tìm tài liệu gần nhất trong collection
        const lastInsertedDoc = await this.db.collection(collectionName)
            .find()
            .sort({ _id: -1 })  // Sort by _id to get the most recent document
            .limit(1)
            .toArray();
    
        if (lastInsertedDoc.length > 0) {
            // Lấy _id của tài liệu gần nhất
            const lastDocId = lastInsertedDoc[0]._id;
    
            // Xoá tài liệu đó
            await this.deleteOne(collectionName, { _id: lastDocId });
            console.log(`Deleted document with _id: ${lastDocId}`);
        } else {
            console.log('No document found to delete.');
        }
    }
    
    // Cập nhật một tài liệu trong collection
    async updateOne(collectionName, query, update) {
        const collection = this.db.collection(collectionName);
        const result = await collection.updateOne(query, update);
        return result;
    }

    // Tìm tài liệu theo title trong collection
    async findDocumentsByTitle(collectionName, title) {
        const collection = this.db.collection(collectionName);
        const result = await collection.find({ title }).toArray();
        return result;
    }

    // Xóa một tài liệu trong collection
    async deleteOne(collectionName, query) {
        const collection = this.db.collection(collectionName);
        const result = await collection.deleteOne(query);
        return result;
    }
}

module.exports = MongoDBTestHelper;
