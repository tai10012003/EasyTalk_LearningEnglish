const dotenv = require("dotenv");
const path = require("path");
const { ObjectId } = require("mongodb");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const commonSetQuestions = [
    {
        question: "He usually ...... at 7 a.m.",
        type: "multiple-choice",
        correctAnswer: "wakes up",
        explanation: "The subject 'he' is third-person singular, so the verb needs an -s.",
        options: ["wake up", "wakes up", "waking up", "woke up"]
    },
    {
        question: "She ...... (go) to school every day.",
        type: "fill-in-the-blank",
        correctAnswer: "goes",
        explanation: "The subject 'she' is third-person singular, so the verb must add -s.",
        options: []
    },
    {
        question: "They ...... (not/watch) TV in the morning",
        type: "fill-in-the-blank",
        correctAnswer: "do not watch",
        explanation: "The negative form of the present simple uses do not + base verb.",
        options: []
    },
    {
        question: "Họ đang chơi bóng đá trong công viên.",
        type: "translation",
        correctAnswer: "They are playing football in the park",
        explanation: "Correct.",
        options: []
    },
    {
        question: "She ...... (already/finish) her homework.",
        type: "fill-in-the-blank",
        correctAnswer: "has already finished",
        explanation: "The present perfect uses has/have + past participle.",
        options: []
    },
    {
        question: "Which sentence is correct?",
        type: "multiple-choice",
        correctAnswer: "she has finished her project",
        explanation: "Use 'has' with a third-person singular subject, and 'finished' is the past participle.",
        options: [
            "she has finish her project",
            "she have finished her project",
            "she has finished her project",
            "she finished her project"
        ]
    }
];

const translations = [
    {
        contentId: "66fa8f9059480ea559555d5a",
        sourceSlug: "bo-de-ngu-phap-1",
        fields: {
            title: "Grammar Exercise Set 1",
            questions: commonSetQuestions
        }
    },
    {
        contentId: "67f1484fe9e2f9511563a935",
        sourceSlug: "bo-de-ngu-phap-2",
        fields: {
            title: "Grammar Exercise Set 2",
            questions: [
                {
                    question: "What time do you usually wake up?",
                    type: "multiple-choice",
                    correctAnswer: "At 6 o'clock",
                    explanation: "For a specific time, use 'at' + time.",
                    options: ["At 6 o'clock", "In 6 o'clock", "On 6 o'clock", "To 6 o'clock"]
                },
                {
                    question: "They usually ...... (play) football after school.",
                    type: "fill-in-the-blank",
                    correctAnswer: "play",
                    explanation: "In the present simple with 'They', use the base verb: play.",
                    options: []
                },
                {
                    question: "She ...... (like) listening to music in the evening.",
                    type: "fill-in-the-blank",
                    correctAnswer: "likes",
                    explanation: "With the subject 'She', add -s/-es to the verb: likes.",
                    options: []
                },
                {
                    question: "I go to school every morning.",
                    type: "arrange-words",
                    correctAnswer: "Tôi đi học mỗi buổi sáng",
                    explanation: "Correct sentence: I go to school every morning (Tôi đi học mỗi buổi sáng).",
                    options: ["đi", "mỗi", "Tôi", "sáng", "học", "buổi", "làm", "tối", "về", "chơi"]
                },
                {
                    question: "Anh ấy đã lỡ chuyến xe buýt vì anh ấy đến muộn.",
                    type: "arrange-words",
                    correctAnswer: "He missed the bus because he was late",
                    explanation: "The sentence uses a because-clause to show the reason.",
                    options: ["because", "He", "late", "was", "missed", "the", "bus", "he", "train", "early", "is", "catched"]
                },
                {
                    question: "My brother ...... (go) to Japan next month.",
                    type: "multiple-choice",
                    correctAnswer: "is going",
                    explanation: "A near-future plan with a specific time uses 'be going to'.",
                    options: ["goes", "is going", "going", "go"]
                }
            ]
        }
    },
    {
        contentId: "67f00ca25459a06fe5984f0f",
        sourceSlug: "bo-de-ngu-phap-3",
        fields: {
            title: "Grammar Exercise Set 3",
            questions: commonSetQuestions
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
                contentType: "grammarExercise",
                contentId: new ObjectId(translation.contentId)
            },
            {
                $set: {
                    contentType: "grammarExercise",
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

    console.log(`Seeded grammar exercise English translations: ${translations.length} total (${upserted} inserted, ${modified} updated).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed grammar exercise English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
