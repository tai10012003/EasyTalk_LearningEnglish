const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');

class UserSessionRepository {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("usersessions");
        this.ensureIndexes().catch((error) => {
            console.error("Failed to ensure usersessions indexes:", error);
        });
    }

    async ensureIndexes() {
        await this.collection.createIndex({ sessionId: 1 }, { unique: true });
        await this.collection.createIndex({ refreshTokenHash: 1 }, { unique: true });
        await this.collection.createIndex({ userId: 1 });
        await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }

    async create(session) {
        const now = new Date();
        const document = {
            userId: new ObjectId(session.userId),
            sessionId: session.sessionId,
            refreshTokenHash: session.refreshTokenHash,
            userAgent: session.userAgent || "",
            ipAddress: session.ipAddress || "",
            createdAt: now,
            updatedAt: now,
            expiresAt: session.expiresAt,
            revokedAt: null,
            replacedBySessionId: null,
            revokeReason: null,
            lastUsedAt: null
        };
        await this.collection.insertOne(document);
        return document;
    }

    async findByRefreshTokenHash(refreshTokenHash) {
        return await this.collection.findOne({ refreshTokenHash });
    }

    async findBySessionId(sessionId) {
        return await this.collection.findOne({ sessionId });
    }

    async findActiveByUserId(userId) {
        return await this.collection
            .find({
                userId: new ObjectId(userId),
                revokedAt: null,
                expiresAt: { $gt: new Date() }
            })
            .project({
                refreshTokenHash: 0
            })
            .sort({ lastUsedAt: -1, createdAt: -1 })
            .toArray();
    }

    async revokeBySessionId(sessionId, { replacedBySessionId = null, reason = "revoked" } = {}) {
        return await this.collection.updateOne(
            { sessionId, revokedAt: null },
            {
                $set: {
                    revokedAt: new Date(),
                    replacedBySessionId,
                    revokeReason: reason,
                    updatedAt: new Date()
                }
            }
        );
    }

    async revokeByRefreshTokenHash(refreshTokenHash, reason = "revoked") {
        return await this.collection.updateOne(
            { refreshTokenHash, revokedAt: null },
            {
                $set: {
                    revokedAt: new Date(),
                    revokeReason: reason,
                    updatedAt: new Date()
                }
            }
        );
    }

    async revokeByUserIdAndSessionId(userId, sessionId, reason = "revoked") {
        return await this.collection.updateOne(
            { userId: new ObjectId(userId), sessionId, revokedAt: null },
            {
                $set: {
                    revokedAt: new Date(),
                    revokeReason: reason,
                    updatedAt: new Date()
                }
            }
        );
    }

    async revokeAllByUserId(userId, reason = "revoked_all") {
        return await this.collection.updateMany(
            { userId: new ObjectId(userId), revokedAt: null },
            {
                $set: {
                    revokedAt: new Date(),
                    revokeReason: reason,
                    updatedAt: new Date()
                }
            }
        );
    }

    async markUsed(sessionId) {
        return await this.collection.updateOne(
            { sessionId },
            {
                $set: {
                    lastUsedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
    }
}

module.exports = UserSessionRepository;