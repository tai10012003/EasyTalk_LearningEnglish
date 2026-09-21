const { ObjectId } = require("mongodb");
const DatabaseConnection = require("../../../shared/database/database");
const config = require("../../../shared/config/setting");

class EnglishTranslationRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("englishtranslations");
        this.indexReady = false;
    }

    async ensureIndexes() {
        if (this.indexReady) return;
        await this.collection.createIndex(
            { contentType: 1, contentId: 1 },
            { unique: true, name: "content_translation_unique" }
        );
        this.indexReady = true;
    }

    toObjectId(id) {
        return id instanceof ObjectId ? id : new ObjectId(id);
    }

    async findByContent(contentType, contentId) {
        return await this.collection.findOne({
            contentType,
            contentId: this.toObjectId(contentId)
        });
    }

    async findByContentIds(contentType, contentIds = []) {
        const ids = contentIds.filter(Boolean).map((id) => this.toObjectId(id));
        if (ids.length === 0) return [];
        return await this.collection.find({
            contentType,
            contentId: { $in: ids }
        }).toArray();
    }

    async upsert(contentType, contentId, fields = {}, metadata = {}) {
        await this.ensureIndexes();
        const now = new Date();
        return await this.collection.updateOne(
            {
                contentType,
                contentId: this.toObjectId(contentId)
            },
            {
                $set: {
                    fields,
                    sourceSlug: metadata.sourceSlug || "",
                    updatedAt: now
                },
                $setOnInsert: {
                    contentType,
                    contentId: this.toObjectId(contentId),
                    createdAt: now
                }
            },
            { upsert: true }
        );
    }

    async deleteByContent(contentType, contentId) {
        return await this.collection.deleteOne({
            contentType,
            contentId: this.toObjectId(contentId)
        });
    }
}

module.exports = EnglishTranslationRepository;
