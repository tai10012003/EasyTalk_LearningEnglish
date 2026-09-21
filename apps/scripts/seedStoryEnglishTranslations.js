const dotenv = require("dotenv");
const path = require("path");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const descriptionTranslations = {
    "the-kind-baker": "A kind baker helps a poor boy and receives an unexpected surprise.",
    "grandmas-garden": "A little girl learns a valuable lesson about patience by planting seeds with her grandma.",
    "the-slow-turtle": "A slow turtle learns that speed is less important than never giving up.",
    "the-brave-little-bird": "A little bird must overcome her fear to save her family from a storm."
};

function buildEnglishContent(content = []) {
    return content.map((sentence) => ({
        ...sentence,
        vi: sentence.en || sentence.vi
    }));
}

function buildTranslationFields(story) {
    return {
        title: story.title,
        description: descriptionTranslations[story.slug] || story.description,
        category: story.category,
        content: buildEnglishContent(story.content || [])
    };
}

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const db = client.db(config.mongodb.database);
    const storiesCollection = db.collection("stories");
    const translationsCollection = db.collection("englishtranslations");

    await translationsCollection.createIndex(
        { contentType: 1, contentId: 1 },
        { unique: true, name: "content_translation_unique" }
    );

    const stories = await storiesCollection.find({}).sort({ sort: 1 }).toArray();
    let upserted = 0;
    let modified = 0;

    for (const story of stories) {
        const result = await translationsCollection.updateOne(
            {
                contentType: "story",
                contentId: story._id
            },
            {
                $set: {
                    contentType: "story",
                    contentId: story._id,
                    sourceSlug: story.slug || "",
                    fields: buildTranslationFields(story),
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        upserted += result.upsertedCount || 0;
        modified += result.modifiedCount || 0;
    }

    console.log(`Seeded story English translations: ${stories.length} total (${upserted} inserted, ${modified} updated).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed story English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
