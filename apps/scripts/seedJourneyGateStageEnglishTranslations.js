const dotenv = require("dotenv");
const path = require("path");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const journeyTitleMap = new Map([
    ["Cơ bản", "Beginner"],
    ["Trung Cấp", "Intermediate"],
    ["Nâng Cao", "Advanced"]
]);

const stageTitleMap = new Map([
    ["xin chào cô chút nè", "Hello, teacher"]
]);

const textMap = new Map([
    ["Good morning là lời chào buổi sáng.", "Good morning is a morning greeting."],
    ["Nice to meet you là câu chào phổ biến khi gặp lần đầu.", "Nice to meet you is a common greeting when meeting someone for the first time."],
    ["Đây là câu trả lời thông dụng cho câu hỏi: How are you?", "This is a common response to the question: How are you?"],
    ["Goodbye là lời chào tạm biệt.", "Goodbye is a farewell greeting."],
    ["What is your name? nghĩa là: Tên bạn là gì?", "What is your name? means asking for someone's name."],
    ["My name is… nghĩa là: Tên tôi là….", "My name is... means saying your name."],
    ["I’m fine nghĩa là \"Tôi khỏe\".", "I'm fine means that you are doing well."],
    ["Chào buổi chiều! Mọi việc thế nào rồi?", "Good afternoon! How is it going?"],
    ["Good afternoon là lời chào buổi chiều; How’s it going? nghĩa là hỏi tình hình.", "Good afternoon is an afternoon greeting; How's it going? asks how things are going."],
    ["Chào! Tôi tên là Sarah. Tên bạn là gì?", "Hi! My name is Sarah. What is your name?"],
    ["What’s your name? là câu hỏi tên.", "What's your name? is used to ask someone's name."],
    ["Chúc bạn một ngày tuyệt vời! Hẹn gặp lại vào ngày mai.", "Have a great day! See you tomorrow."],
    ["Have a great day là lời chúc; See you tomorrow là hẹn gặp.", "Have a great day is a wish; See you tomorrow means you will meet again tomorrow."],
    ["Outgoing có nghĩa là cởi mở, thích giao tiếp với người khác.", "Outgoing means open and comfortable talking to other people."],
    ["Generous có nghĩa là hào phóng, chia sẻ với người khác.", "Generous means willing to share with other people."],
    ["Kind có nghĩa là tốt bụng, phù hợp với ngữ cảnh mô tả tính cách.", "Kind means caring and helpful, which fits the personality context."],
    ["Thoughtful có nghĩa là cẩn thận, suy nghĩ kỹ càng, phù hợp với câu.", "Thoughtful means careful and considerate, which fits the sentence."],
    ["Outgoing có nghĩa là hòa đồng, thích giao tiếp, phù hợp với câu.", "Outgoing means sociable and comfortable communicating, which fits the sentence."],
    ["Anh ấy rất hào phóng. Anh ấy thường xuyên giúp đỡ những người xung quanh.", "He is very generous. He often helps the people around him."],
    ["Giải thích: Generous = hào phóng, helps the people around him = giúp đỡ những người xung quanh.", "Explanation: Generous means willing to give or help; helps the people around him means supporting people nearby."],
    ["Kitchen là phòng bếp, nơi nấu ăn.", "Kitchen is the room where people cook."],
    ["Sofa là ghế dài, thường có trong phòng khách để cả gia đình ngồi cùng nhau.", "A sofa is a long seat usually found in the living room where the family can sit together."],
    ["Bathroom là phòng tắm, nơi dùng để tắm rửa hoặc vệ sinh cá nhân.", "A bathroom is used for showering and personal hygiene."],
    ["Bedroom (phòng ngủ) là nơi dùng để ngủ.", "A bedroom is the room used for sleeping."],
    ["Oven (lò nướng) là thiết bị thường có trong bếp để nấu ăn.", "An oven is a common kitchen appliance used for cooking."],
    ["Living room (phòng khách) là nơi tiếp khách.", "A living room is used for receiving and entertaining guests."],
    ["Phòng khách của tôi có một chiếc ghế dài và một chiếc bàn nhỏ.", "My living room has a sofa and a small table."],
    ["Living room = phòng khách, sofa = ghế dài, small table = bàn nhỏ.", "Living room is the main guest room; sofa is a long seat; small table is a little table."],
    ["Có một chiếc TV lớn trong phòng khách.", "There is a big TV in the living room."],
    ["Big TV = TV lớn, living room = phòng khách.", "Big TV means a large television; living room is the main guest room."],
    ["Ở nhiều nền văn hóa, người cha theo truyền thống được coi là người đứng đầu gia đình.", "In many cultures, the father is traditionally considered the head of the family."],
    ["Anh trai của cha bạn là chú của bạn.", "Your father's brother is your uncle."],
    ["Trong câu này, Em gái tôi'được dùng để miêu tả thành viên trẻ nhất trong gia đình.", "In this sentence, 'My sister' is used to describe the youngest family member."],
    ["Bố tôi là bác sĩ, còn mẹ tôi là giáo viên", "My father is a doctor, and my mother is a teacher."],
    ["Câu văn miêu tả nghề nghiệp của cha và mẹ.", "The sentence describes the jobs of the father and mother."],
    ["Theo truyền thống, người mẹ thường là người chăm sóc chính cho trẻ em.", "Traditionally, the mother is often the main caregiver for children."],
    ["Từ anh em phù hợp với bối cảnh anh chị em cùng chia sẻ một căn phòng.", "The word brother fits the context of siblings sharing a room."],
    ["Chị tôi là giáo viên, còn em trai tôi là học sinh.", "My sister is a teacher, and my younger brother is a student."],
    ["Câu này miêu tả công việc của chị gái và em trai.", "This sentence describes the jobs of the sister and younger brother."],
    ["Câu trả lời tùy thuộc vào ngữ cảnh, nhưng 'Hai' là câu trả lời đúng được chọn cho tình huống này.", "The answer depends on the context, but 'two' is the selected correct answer for this situation."],
    ["Ông tôi sống cùng chúng tôi trong cùng một ngôi nhà.", "My grandfather lives with us in the same house."],
    ["Câu văn này mô tả sự sắp xếp chung sống của ông nội.", "This sentence describes a living arrangement with the grandfather."],
    ["Số lượng anh chị em chính xác được mô tả là ba, với hai anh trai và một chị gái.", "The correct number of siblings is three, with two brothers and one sister."],
    ["Vợ của bố luôn là mẹ của bạn.", "Your father's wife is your mother."],
    ["Teacher (giáo viên) không phải thành viên gia đình.", "Teacher is not a family member."],
    ["Bạn đang tìm kiếm gì vậy?", "What are you looking for?"],
    ["hahaha", "This is an example explanation."],
    ["Average (cân đối) mô tả một người có cân nặng trung bình, không quá gầy hoặc béo", "Average describes someone with a medium build, not too thin or overweight."],
    ["Thick-haired (tóc dày) phù hợp để mô tả người có nhiều tóc trên đầu.", "Thick-haired describes someone who has a lot of hair on their head."],
    ["Short là trái nghĩa của Tall (cao).", "Short is the opposite of tall."],
    ["Muscular (cơ bắp) mô tả người có ngoại hình mạnh mẽ và thể thao.", "Muscular describes someone with a strong, athletic body."],
    ["Long có nghĩa là tóc dài, phù hợp với câu.", "Long means having long hair, which fits the sentence."],
    ["Brown eyes (mắt nâu) là cụm từ phổ biến dùng để mô tả màu mắt.", "Brown eyes is a common phrase used to describe eye color."],
    ["Anh ấy cao và mảnh mai, có đôi mắt xanh và mái tóc nâu ngắn.", "He is tall and slim, with blue eyes and short brown hair."],
    ["Tall = cao, slim = mảnh mai, blue eyes = đôi mắt xanh.", "Tall describes height, slim describes body shape, and blue eyes describes eye color."],
    ["Ông của tôi bị hói đầu, nhưng ông ấy luôn tự tin về ngoại hình của mình.", "My grandfather is bald, but he is always confident about his appearance."],
    ["Bald = hói đầu, confident about his appearance = tự tin về ngoại hình.", "Bald means having no hair; confident about his appearance means feeling good about how he looks."]
]);

function translateTitle(title, type) {
    if (!title) return title;
    if (type === "journey") return journeyTitleMap.get(title) || title;
    if (type === "stage" && stageTitleMap.has(title)) return stageTitleMap.get(title);
    const gateMatch = title.match(/^Cửa\s+(\d+)$/i);
    if (gateMatch) return `Gate ${gateMatch[1]}`;
    const stageMatch = title.match(/^Chặng\s+(\d+)$/i);
    if (stageMatch) return `Stage ${stageMatch[1]}`;
    return textMap.get(title) || title;
}

function translateText(text) {
    if (typeof text !== "string") return text;
    const direct = textMap.get(text);
    if (direct) return direct;
    return text.replace(/Gợi ý:/g, "Hint:");
}

function translateQuestion(question = {}) {
    return {
        ...question,
        question: translateText(question.question),
        correctAnswer: translateText(question.correctAnswer),
        explanation: translateText(question.explanation),
        options: Array.isArray(question.options) ? question.options.map(translateText) : []
    };
}

async function upsertTranslation(collection, contentType, contentId, fields, sourceSlug) {
    return await collection.updateOne(
        { contentType, contentId },
        {
            $set: {
                contentType,
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

    const stats = {
        journey: { total: 0, inserted: 0, updated: 0 },
        gate: { total: 0, inserted: 0, updated: 0 },
        stage: { total: 0, inserted: 0, updated: 0 }
    };

    const journeys = await db.collection("journeys").find({}).toArray();
    for (const journey of journeys) {
        const result = await upsertTranslation(
            translations,
            "journey",
            journey._id,
            { title: translateTitle(journey.title, "journey") },
            `journey:${journey._id.toString()}`
        );
        stats.journey.total++;
        stats.journey.inserted += result.upsertedCount || 0;
        stats.journey.updated += result.modifiedCount || 0;
    }

    const gates = await db.collection("gates").find({}).toArray();
    for (const gate of gates) {
        const result = await upsertTranslation(
            translations,
            "gate",
            gate._id,
            { title: translateTitle(gate.title, "gate") },
            `gate:${gate._id.toString()}`
        );
        stats.gate.total++;
        stats.gate.inserted += result.upsertedCount || 0;
        stats.gate.updated += result.modifiedCount || 0;
    }

    const stages = await db.collection("stages").find({}).toArray();
    for (const stage of stages) {
        const fields = {
            title: translateTitle(stage.title, "stage"),
            questions: Array.isArray(stage.questions) ? stage.questions.map(translateQuestion) : []
        };
        const result = await upsertTranslation(
            translations,
            "stage",
            stage._id,
            fields,
            `stage:${stage._id.toString()}`
        );
        stats.stage.total++;
        stats.stage.inserted += result.upsertedCount || 0;
        stats.stage.updated += result.modifiedCount || 0;
    }

    console.log(
        `Seeded journey/gate/stage English translations: ` +
        `journeys ${stats.journey.total} (${stats.journey.inserted} inserted, ${stats.journey.updated} updated), ` +
        `gates ${stats.gate.total} (${stats.gate.inserted} inserted, ${stats.gate.updated} updated), ` +
        `stages ${stats.stage.total} (${stats.stage.inserted} inserted, ${stats.stage.updated} updated).`
    );
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed journey/gate/stage English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
