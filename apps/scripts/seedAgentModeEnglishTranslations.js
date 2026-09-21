const dotenv = require("dotenv");
const path = require("path");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const translations = [
    {
        key: "speaking_practice",
        activityType: "chat",
        fields: {
            title: "Speaking Practice",
            description: "Practice short speaking prompts by topic to improve your communication reflexes."
        }
    },
    {
        key: "travel_roleplay",
        activityType: "chat",
        fields: {
            title: "Travel Roleplay",
            description: "Role-play travel situations such as airports, hotels, and restaurants."
        }
    },
    {
        key: "free_chat",
        activityType: "chat",
        fields: {
            title: "Free Chat",
            description: "Have a casual conversation to practice everyday English responses."
        }
    },
    {
        key: "grammar_correction",
        activityType: "chat",
        fields: {
            title: "Grammar Correction",
            description: "Send an English sentence and get grammar corrections with a short explanation."
        }
    },
    {
        key: "interview_practice",
        activityType: "chat",
        fields: {
            title: "Interview Practice",
            description: "Practice answering job interview questions in English."
        }
    },
    {
        key: "daily_checkin",
        activityType: "chat",
        fields: {
            title: "Daily Check-in",
            description: "The coach quickly asks what you studied today and helps you choose the next step."
        }
    },
    {
        key: "quick_correction",
        activityType: "writing",
        fields: {
            title: "Quick Correction",
            description: "Quickly correct a short piece of writing, focusing on the most obvious issues.",
            config: {
                minCharacters: 80,
                maxCharacters: 1200,
                topicSuggestions: [
                    "Write about your day.",
                    "Describe your favorite food.",
                    "Write a short message to a friend."
                ]
            }
        }
    },
    {
        key: "essay_feedback",
        activityType: "writing",
        fields: {
            title: "Essay Feedback",
            description: "Get feedback on your essay ideas, coherence, vocabulary, and grammar.",
            config: {
                minCharacters: 200,
                maxCharacters: 4000,
                topicSuggestions: [
                    "Should students use AI for homework?",
                    "Is online learning better than classroom learning?",
                    "How can people build healthy habits?"
                ]
            }
        }
    },
    {
        key: "ielts_task_1",
        activityType: "writing",
        fields: {
            title: "IELTS Task 1",
            description: "Practice describing charts, processes, and visual information using IELTS Writing Task 1 criteria.",
            config: {
                minCharacters: 250,
                maxCharacters: 3500,
                topicSuggestions: [
                    "The chart shows changes in transport use over 20 years.",
                    "The diagram explains how coffee is produced.",
                    "The table compares student numbers in three countries."
                ]
            }
        }
    },
    {
        key: "ielts_task_2",
        activityType: "writing",
        fields: {
            title: "IELTS Task 2",
            description: "Practice IELTS Task 2 essays with band-style feedback.",
            config: {
                minCharacters: 300,
                maxCharacters: 5000,
                topicSuggestions: [
                    "Some people believe technology makes learning easier. To what extent do you agree?",
                    "Many young people move to cities for work. Discuss advantages and disadvantages.",
                    "Should governments invest more in public transport?"
                ]
            }
        }
    },
    {
        key: "work_email",
        activityType: "writing",
        fields: {
            title: "Work Email",
            description: "Practice writing professional emails that are polite, clear, and natural.",
            config: {
                minCharacters: 100,
                maxCharacters: 2500,
                topicSuggestions: [
                    "Ask your manager for a day off.",
                    "Reply to a customer complaint.",
                    "Schedule a meeting with a teammate."
                ]
            }
        }
    },
    {
        key: "sentence_upgrade",
        activityType: "writing",
        fields: {
            title: "Sentence Upgrade",
            description: "Upgrade simple sentences into more natural and expressive English.",
            config: {
                minCharacters: 40,
                maxCharacters: 900,
                topicSuggestions: [
                    "I like learning English.",
                    "My job is very busy.",
                    "I want to travel abroad."
                ]
            }
        }
    }
];

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const db = client.db(config.mongodb.database);
    const modesCollection = db.collection("agentmodes");
    const translationsCollection = db.collection("englishtranslations");

    await translationsCollection.createIndex(
        { contentType: 1, contentId: 1 },
        { unique: true, name: "content_translation_unique" }
    );

    let upserted = 0;
    let modified = 0;
    let skipped = 0;

    for (const translation of translations) {
        const mode = await modesCollection.findOne({
            key: translation.key,
            activityType: translation.activityType
        });
        if (!mode?._id) {
            skipped++;
            console.warn(`Skipped missing agent mode: ${translation.activityType}/${translation.key}`);
            continue;
        }
        const result = await translationsCollection.updateOne(
            {
                contentType: "agentMode",
                contentId: mode._id
            },
            {
                $set: {
                    contentType: "agentMode",
                    contentId: mode._id,
                    sourceSlug: `${translation.activityType}:${translation.key}`,
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

    console.log(`Seeded agent mode English translations: ${translations.length} total (${upserted} inserted, ${modified} updated, ${skipped} skipped).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed agent mode English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
