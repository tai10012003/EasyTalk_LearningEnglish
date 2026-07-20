const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');

function getRequestMetadata(req) {
    if(!req) {
        return { ipAddress: "", userAgent: "" };
    }
    const forwardedFor = req.headers?.["x-forwarded-for"];
    const ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : (forwardedFor || req.ip || req.socket?.remoteAddress || "");
    return {
        ipAddress: String(ipAddress).split(",")[0].trim(),
        userAgent: req.headers?.["user-agent"] || ""
    };
}

function toObjectId(value) {
    if(!value || !ObjectId.isValid(value)) return null;
    return new ObjectId(value);
}

class SecurityAuditService {
    constructor() {
        this.client = DatabaseConnection.getMongoClient();
        this.db = this.client.db(config.mongodb.database);
        this.collection = this.db.collection("securitylogs");
        this.ensureIndexes().catch((error) => {
            console.error("Failed to ensure securitylogs indexes:", error);
        });
    }

    async ensureIndexes() {
        await this.collection.createIndex({ userId: 1, createdAt: -1 });
        await this.collection.createIndex({ event: 1, createdAt: -1 });
        await this.collection.createIndex({ createdAt: -1 });
    }

    async log(event, { userId = null, actorId = null, email = "", status = "success", reason = "", metadata = {}, req = null } = {}) {
        const requestMetadata = getRequestMetadata(req);
        const document = {
            event,
            status,
            userId: toObjectId(userId),
            actorId: toObjectId(actorId),
            email,
            reason,
            metadata,
            ipAddress: requestMetadata.ipAddress,
            userAgent: requestMetadata.userAgent,
            createdAt: new Date()
        };
        try {
            await this.collection.insertOne(document);
        } catch (error) {
            console.error(`[SecurityAudit] Failed to log ${event}:`, error.message);
        }
    }
}

module.exports = SecurityAuditService;