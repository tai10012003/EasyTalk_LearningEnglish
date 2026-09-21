const dotenv = require("dotenv");
const path = require("path");
const { ObjectId } = require("mongodb");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const translations = [
    {
        contentId: "6700e637a5dd14410baf40cf",
        sourceSlug: "bo-de-phat-am-1",
        fields: {
            title: "Pronunciation Exercise Set 1",
            questions: [
                {
                    question: "desk",
                    type: "multiple-choice",
                    correctAnswer: "desk",
                    explanation: "desk",
                    options: ["desk", "desc", "", ""]
                },
                {
                    question: "good",
                    type: "multiple-choice",
                    correctAnswer: "good",
                    explanation: "good",
                    options: ["good", "would", "", ""]
                },
                {
                    question: "Good morning, how are you doing?",
                    type: "pronunciation",
                    correctAnswer: "good morning, how are you doing",
                    explanation: "good morning, how are you doing",
                    options: []
                },
                {
                    question: "white",
                    type: "multiple-choice",
                    correctAnswer: "white",
                    explanation: "white",
                    options: ["while", "white", "", ""]
                },
                {
                    question: "How old are you ?",
                    type: "pronunciation",
                    correctAnswer: "how old are you",
                    explanation: "how old are you",
                    options: []
                }
            ]
        }
    },
    {
        contentId: "67192673f8a0789c90cc7b44",
        sourceSlug: "bo-de-phat-am-2",
        fields: {
            title: "Pronunciation Exercise Set 2",
            questions: [
                {
                    question: "find",
                    type: "multiple-choice",
                    correctAnswer: "find",
                    explanation: "find",
                    options: ["file", "find", "fire", "fine"]
                },
                {
                    question: "See you later",
                    type: "pronunciation",
                    correctAnswer: "see you later",
                    explanation: "see you later",
                    options: []
                },
                {
                    question: "How can i help you ?",
                    type: "pronunciation",
                    correctAnswer: "How can i help you",
                    explanation: "How can i help you",
                    options: []
                }
            ]
        }
    },
    {
        contentId: "6736079f94cea0afb529a8af",
        sourceSlug: "bo-de-phat-am-3",
        fields: {
            title: "Pronunciation Exercise Set 3",
            questions: [
                {
                    question: "short",
                    type: "multiple-choice",
                    correctAnswer: "short",
                    explanation: "short",
                    options: ["short", "sort", "", ""]
                },
                {
                    question: "Hello world",
                    type: "pronunciation",
                    correctAnswer: "hello world",
                    explanation: "hello world",
                    options: []
                }
            ]
        }
    }
];

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const db = client.db(config.mongodb.database);
    const collection = db.collection("englishtranslations");

    await collection.createIndex(
        { contentType: 1, contentId: 1 },
        { unique: true, name: "content_translation_unique" }
    );

    let upserted = 0;
    let modified = 0;

    for (const translation of translations) {
        const result = await collection.updateOne(
            {
                contentType: "pronunciationExercise",
                contentId: new ObjectId(translation.contentId)
            },
            {
                $set: {
                    contentType: "pronunciationExercise",
                    contentId: new ObjectId(translation.contentId),
                    sourceSlug: translation.sourceSlug,
                    fields: translation.fields,
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

    console.log(`Seeded pronunciation exercise English translations: ${translations.length} total (${upserted} inserted, ${modified} updated).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed pronunciation exercise English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
