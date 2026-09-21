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
        contentId: "67371d8a5a13fd8d6261cbb0",
        sourceSlug: "o-nha",
        fields: {
            title: "At Home",
            description: "This is a very useful lesson.",
            content: "Where is Jane? She is in the living room. What is she doing? She is playing the piano. Where is the car? It is in the garage. Where is the dog? The dog is in front of the door. What is the dog doing? The dog is eating."
        }
    },
    {
        contentId: "673724775321f2115a618946",
        sourceSlug: "vi-tri",
        fields: {
            title: "Locations",
            description: "A very useful lesson.",
            content: "Where is the school? It's between the library and the park. Where is the post office? It's across from the movie theater. Where is the royal bank? It's next to the supermarket. Where is the gas station? It's around the corner from the church. Where is the barbershop? It's near the bus station."
        }
    },
    {
        contentId: "6737276e5321f2115a618949",
        sourceSlug: "tra-loi-ngan-gon",
        fields: {
            title: "Short Answers",
            description: "A wonderful dictation lesson.",
            content: "Is Alice young or old? She is young. Is Bill tall or short? He is short. Is Albert's apartment big or little? It's small. Were the last examinations easy or difficult? They were difficult. Is Julie married or single? She is single."
        }
    },
    {
        contentId: "67372a6be95ba9f7f26d4513",
        sourceSlug: "goi-dien-thoai",
        fields: {
            title: "Making a Phone Call",
            description: "A very interesting lesson.",
            content: "Hello, Jack. This is Dave. I want to return the book I borrowed from you last night. Will you be home at about six o'clock? Yes, I will. I'll be cooking dinner. Oh! Well. Then I won't come over at six. Why not? I don't want to disturb you. Don't worry! You won't disturb me. OK. I'll see you at six."
        }
    },
    {
        contentId: "67372abce95ba9f7f26d4514",
        sourceSlug: "chuc-phuc-cho-ban",
        fields: {
            title: "Bless You",
            description: "This lesson is easy to study.",
            content: "Ah-choo! God bless you! Thank you. You have a cold? Yes, that's why I'm sneezing so much. I hope you feel better soon. I get a bad cold every winter. Are you taking anything for your cold? I'm taking Contac. Does it help? Yes, but it makes me sleepy. You'd better not drive then!"
        }
    },
    {
        contentId: "67372afee95ba9f7f26d4515",
        sourceSlug: "toi-khong-cam-thay-khoe",
        fields: {
            title: "I Don't Feel Well",
            description: "A lesson about health.",
            content: "What are you looking for? My jacket. I'm going to the doctor. Why? What's the problem? I'm not sure, but I don't feel well. Do you have a fever? No, but I have a pain in my chest. What time is your appointment? 11:30 I'm going now. Bye. Goodbye. I hope it's nothing serious. Thanks. See you."
        }
    },
    {
        contentId: "67372b27e95ba9f7f26d4516",
        sourceSlug: "xin-visa",
        fields: {
            title: "Applying for a Visa",
            description: "A lesson about applying for a visa.",
            content: "Does it take long to get a visa? It depends on the season. Anywhere from one month to two months. What do I need to do? Fill out an application form and wait. Will there be a long waiting period? Not if you don't run into any government delays."
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
                contentType: "dictationExercise",
                contentId: new ObjectId(translation.contentId)
            },
            {
                $set: {
                    contentType: "dictationExercise",
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

    console.log(`Seeded dictation exercise English translations: ${translations.length} total (${upserted} inserted, ${modified} updated).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed dictation exercise English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
