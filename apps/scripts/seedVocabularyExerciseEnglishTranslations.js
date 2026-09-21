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
        contentId: "671b3fc9a110694e6e6e4bda",
        sourceSlug: "chu-de-1-gia-dinh",
        fields: {
            title: "Topic 1: Family",
            questions: [
                {
                    question: "What do you call the sister of your mother?",
                    type: "multiple-choice",
                    correctAnswer: "aunt",
                    explanation: "Your mother's sister is called your aunt.",
                    options: ["aunt", "sister", "niece", "cousin"]
                },
                {
                    question: "My mother's mother is my .......",
                    type: "fill-in-the-blank",
                    correctAnswer: "grandmother",
                    explanation: "Your mother's mother is your grandmother.",
                    options: []
                },
                {
                    question: "My aunt's child is my cousin.",
                    type: "translation",
                    correctAnswer: "My aunt's child is my cousin",
                    explanation: "This sentence uses 'aunt' for your mother's or father's sister and 'cousin' for her child.",
                    options: []
                },
                {
                    question: "What is the relationship between you and your uncle's daughter?",
                    type: "multiple-choice",
                    correctAnswer: "cousin",
                    explanation: "Your uncle's daughter is your cousin.",
                    options: ["cousin", "sister", "aunt", "grandmother"]
                },
                {
                    question: "Which word describes your father's parents?",
                    type: "multiple-choice",
                    correctAnswer: "grandparents",
                    explanation: "Your father's parents are your grandparents.",
                    options: ["grandparents", "nephews", "cousins", "siblings"]
                },
                {
                    question: "I have two siblings: an older brother and a younger sister.",
                    type: "translation",
                    correctAnswer: "I have two siblings: an older brother and a younger sister.",
                    explanation: "'Siblings' means brothers and sisters.",
                    options: []
                }
            ]
        }
    },
    {
        contentId: "671b4056a110694e6e6e4bdb",
        sourceSlug: "chu-de-2-mau-sac",
        fields: {
            title: "Topic 2: Colors",
            questions: [
                {
                    question: "The sky is usually ....... (blue) during the day.",
                    type: "fill-in-the-blank",
                    correctAnswer: "blue",
                    explanation: "The English word for 'xanh dương' is 'blue'.",
                    options: []
                },
                {
                    question: "Roses are often ...... (red) to symbolize love.",
                    type: "fill-in-the-blank",
                    correctAnswer: "red",
                    explanation: "The English word for 'đỏ' is 'red'.",
                    options: []
                },
                {
                    question: "What color is a ripe strawberry?",
                    type: "multiple-choice",
                    correctAnswer: "red",
                    explanation: "A ripe strawberry is usually red.",
                    options: ["green", "red", "yellow", "blue"]
                },
                {
                    question: "Which color is associated with the sea?",
                    type: "multiple-choice",
                    correctAnswer: "blue",
                    explanation: "The sea is often associated with the color blue.",
                    options: ["white", "blue", "purple", "orange"]
                },
                {
                    question: "The color of the sun at sunrise is often orange.",
                    type: "translation",
                    correctAnswer: "The color of the sun at sunrise is often orange.",
                    explanation: "This sentence describes the common color of the sun at sunrise.",
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
                contentType: "vocabularyExercise",
                contentId: new ObjectId(translation.contentId)
            },
            {
                $set: {
                    contentType: "vocabularyExercise",
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

    console.log(`Seeded vocabulary exercise English translations: ${translations.length} total (${upserted} inserted, ${modified} updated).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed vocabulary exercise English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
