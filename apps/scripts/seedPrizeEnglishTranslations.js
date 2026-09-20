const dotenv = require("dotenv");
const path = require("path");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const championNameByType = {
    champion_week: "Weekly Champion",
    champion_month: "Monthly Champion",
    champion_year: "Yearly Champion"
};

const directNameMap = new Map([
    ["Quán Quân Tuần", "Weekly Champion"],
    ["Quán Quân Tháng", "Monthly Champion"],
    ["Quán Quân Năm", "Yearly Champion"]
]);

function toTitleCase(value = "") {
    return value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(" ");
}

function translatePrizeName(prize = {}) {
    if (directNameMap.has(prize.name)) return directNameMap.get(prize.name);
    if (championNameByType[prize.type]) return championNameByType[prize.type];

    const level = Number(prize.level);
    if (prize.type === "knowledge_god" || /^KN_GOD_/i.test(prize.code || "")) {
        return Number.isFinite(level) ? `Knowledge God Level ${level}` : "Knowledge God";
    }
    if (prize.type === "perfect_streak" || /PERFECT|STREAK/i.test(prize.code || "")) {
        return Number.isFinite(level) ? `Perfect Streak Level ${level}` : "Perfect Streak";
    }

    const levelSuffix = Number.isFinite(level) ? ` Level ${level}` : "";
    return `${toTitleCase(prize.type || prize.code || prize.name || "Prize")}${levelSuffix}`;
}

async function upsertTranslation(collection, contentId, fields, sourceSlug) {
    return await collection.updateOne(
        { contentType: "prize", contentId },
        {
            $set: {
                contentType: "prize",
                contentId,
                sourceSlug,
                fields,
                updatedAt: new Date()
            },
            $setOnInsert: {
                createdAt: new Date()
            }
        },
        { upsert: true }
    );
}

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const db = client.db(config.mongodb.database);
    const translations = db.collection("englishtranslations");

    await translations.createIndex(
        { contentType: 1, contentId: 1 },
        { unique: true, name: "content_translation_unique" }
    );

    const prizes = await db.collection("prizes").find({}).toArray();
    const stats = { total: 0, inserted: 0, updated: 0 };

    for (const prize of prizes) {
        const fields = {
            name: translatePrizeName(prize)
        };
        const result = await upsertTranslation(
            translations,
            prize._id,
            fields,
            `prize:${prize._id.toString()}`
        );
        stats.total++;
        stats.inserted += result.upsertedCount || 0;
        stats.updated += result.modifiedCount || 0;
    }

    console.log(
        `Seeded prize English translations: ` +
        `${stats.total} prizes (${stats.inserted} inserted, ${stats.updated} updated).`
    );
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed prize English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
