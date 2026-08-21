const { ObjectId } = require('mongodb');
const DatabaseConnection = require('../../../shared/database/database');
const config = require('../../../shared/config/setting');

class GrammarRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("grammars");
    }

    async findAll(filter = {}, skip = 0, limit = 12) {
        const cursor = await this.collection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const grammars = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { grammars, total };
    }

    async findRoadmapItems(filter = {}) {
        const pipeline = [
            { $match: filter },
            { $sort: { sort: 1 } },
            {
                $project: {
                    title: 1,
                    description: 1,
                    category: 1,
                    level: 1,
                    images: 1,
                    slug: 1,
                    sort: 1,
                    display: 1,
                    quizCount: { $size: { $ifNull: ["$quizzes", []] } }
                }
            }
        ];
        const grammars = await this.collection.aggregate(pipeline).toArray();
        const total = await this.collection.countDocuments(filter);
        return { grammars, total };
    }

    async findById(id) {
        return await this.collection.findOne({ _id: new ObjectId(id) });
    }

    async findBySlug(slug) {
        return await this.collection.findOne({ slug });
    }

    async findNextBySortOrder(currentSort) {
        return await this.collection.findOne(
            { display: true, sort: { $gt: currentSort } },
            { sort: { sort: 1 } }
        );
    }

    async insert(grammar) {
        return await this.collection.insertOne(grammar);
    }

    async update(id, updateData) {
        const objectId = new ObjectId(id);
        const result = await this.collection.updateOne({ _id: objectId }, { $set: updateData });
        return result.modifiedCount > 0;
    }

    async delete(id) {
        return await this.collection.deleteOne({ _id: new ObjectId(id) });
    }

    async findImagesWithPattern(pattern) {
        return await this.collection.find(
            { images: { $regex: pattern } },
            { projection: { images: 1 } }
        ).toArray();
    }
}

module.exports = GrammarRepository;
