const { ObjectId } = require('mongodb');
const DatabaseConnection = require('../../../shared/database/database');
const config = require('../../../shared/config/setting');

class StoryRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("stories");
    }

    async findAll(filter = {}, skip = 0, limit = 12) {
        const cursor = await this.collection.find(filter).sort({ sort: 1 }).skip(skip).limit(limit);
        const stories = await cursor.toArray();
        const total = await this.collection.countDocuments(filter);
        return { stories, total };
    }

    async findRoadmapItems(filter = {}) {
        const pipeline = [
            { $match: filter },
            { $sort: { sort: 1 } },
            {
                $project: {
                    title: 1,
                    description: 1,
                    image: 1,
                    level: 1,
                    category: 1,
                    slug: 1,
                    sort: 1,
                    display: 1,
                    sentenceCount: { $size: { $ifNull: ["$content", []] } },
                    quizCount: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ["$content", []] },
                                as: "sentence",
                                cond: { $ne: ["$$sentence.quiz", null] }
                            }
                        }
                    }
                }
            }
        ];
        const stories = await this.collection.aggregate(pipeline).toArray();
        const total = await this.collection.countDocuments(filter);
        return { stories, total };
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

    async insert(story) {
        return await this.collection.insertOne(story);
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
            { image: { $regex: pattern } },
            { projection: { image: 1 } }
        ).toArray();
    }
}

module.exports = StoryRepository;
