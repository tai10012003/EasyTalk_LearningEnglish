const dotenv = require("dotenv");
const path = require("path");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const translationsBySlug = {
    "gioi-thieu-phat-am-and-bang-ipa": {
        title: "Lesson 1: Introduction to Pronunciation & the IPA Chart",
        description: "This opening lesson explains why pronunciation matters, introduces the International Phonetic Alphabet (IPA), and shows how to use IPA to learn English pronunciation effectively.",
        category: "Module 1: Alphabet and Basic Sounds",
        content: `<div><strong>Pronunciation in English communication</strong><p>Pronunciation is a key part of communication. Even if you know many words and grammar rules, incorrect pronunciation can make listeners misunderstand you. For example, 'ship' /ʃɪp/ and 'sheep' /ʃiːp/ differ mainly in vowel length. If you pronounce them incorrectly, the meaning changes completely.</p></div><div><strong>Why accurate pronunciation matters</strong><p>Clear pronunciation helps other people understand you, and it also improves your listening. When you become familiar with standard sounds, your ears become better at distinguishing words, even when native speakers talk quickly. This helps you build listening skill and natural speaking reflexes.</p></div><div><strong>What is the International Phonetic Alphabet?</strong><p>IPA stands for International Phonetic Alphabet. It is an international symbol system used to describe speech sounds. For English learners, IPA is an important tool because it shows the exact pronunciation of a word instead of forcing you to guess from spelling. For example, 'enough' is written /ɪˈnʌf/, which is very different from its spelling.</p></div><div><strong>Overview of English IPA sounds</strong><p>English has 44 basic sounds: 20 vowels and 24 consonants. The 20 vowels include 7 short vowels, 5 long vowels, and 8 diphthongs. The 24 consonants include voiced and voiceless consonants. Understanding this system gives you a strong foundation for accurate pronunciation.</p></div><div><strong>Short vowels</strong><p>Short vowels are pronounced briefly, without being held for a long time. Examples include /ɪ/ in 'sit', /ʊ/ in 'book', and /æ/ in 'cat'. These sounds are basic and very common in English.</p></div><div><strong>Long vowels</strong><p>Long vowels are held longer than short vowels and often help distinguish meaning. Examples include /iː/ in 'sheep', /uː/ in 'food', and /ɑː/ in 'car'. Vietnamese learners often do not hold these sounds long enough, which can cause confusion.</p></div><div><strong>Diphthongs</strong><p>Diphthongs combine two vowel movements. When you pronounce them, your mouth moves from one position to another. Examples include /aɪ/ in 'time', /eɪ/ in 'say', and /əʊ/ in 'go'. These sounds help your English sound more natural and fluent.</p></div><div><strong>Voiced and voiceless consonants</strong><p>Voiceless consonants are produced without vibrating the vocal cords, such as /p/, /t/, and /k/. Voiced consonants use vocal cord vibration, such as /b/, /d/, and /g/. Compare 'pat' /pæt/ and 'bat' /bæt/: the main difference is vocal cord vibration.</p></div><div><strong>Reading pronunciation in dictionaries</strong><p>When learning a new word, you should check its IPA transcription in a dictionary such as Oxford or Cambridge. For example, 'knowledge' is /ˈnɒlɪdʒ/, so you can see each sound clearly and identify the stress. Guessing from spelling alone is often unreliable.</p></div><div><strong>Listening and imitating with IPA</strong><p>Use IPA together with dictionary audio. Listen carefully to each sound, then read aloud following the transcription. This method trains both accurate pronunciation and precise listening.</p></div><div><strong>Using IPA when learning vocabulary</strong><p>When learning a new word, do not write only its Vietnamese meaning. Add the IPA transcription and practice saying it. For example: 'develop' – /dɪˈveləp/. This builds the habit of connecting words with their correct pronunciation.</p></div><div><strong>Conclusion and next steps</strong><p>The IPA chart is a pronunciation map for English. Understanding and practicing the 44 basic sounds is the first step toward clearer pronunciation, better listening, and more confident communication. In the next lessons, we will study each sound group in detail, starting with short vowels.</p></div>`,
        quizzes: [
            { question: "IPA stands for ......?", type: "fill-in-the-blank", correctAnswer: "International Phonetic Alphabet", explanation: "The International Phonetic Alphabet (IPA) is an international symbol system that describes speech sounds.", options: [] },
            { question: "How many basic sounds are there in English IPA?", type: "multiple-choice", correctAnswer: "44 sounds", explanation: "English IPA has 44 basic sounds: 20 vowels and 24 consonants.", options: ["26 sounds", "36 sounds", "44 sounds", "52 sounds"] },
            { question: "Which word has the long vowel /iː/?", type: "multiple-choice", correctAnswer: "sheep", explanation: "sheep /ʃiːp/ has the long vowel /iː/, unlike ship /ʃɪp/.", options: ["ship", "sheep", "sit", "bit"] },
            { question: "The sound /ɪ/ in 'ship' is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short", explanation: "/ɪ/ is a short vowel, pronounced quickly and without lengthening.", options: [] },
            { question: "Which pair shows the difference between voiced and voiceless consonants?", type: "multiple-choice", correctAnswer: "pat – bat", explanation: "In 'pat', /p/ is voiceless; in 'bat', /b/ is voiced.", options: ["cat – cut", "pen – pan", "pat – bat", "sit – seat"] }
        ]
    },
    "nguyen-am-ngan-ɪ-va-nguyen-am-dai-iː": {
        title: "Lesson 2: Short Vowel /ɪ/ and Long Vowel /iː/",
        description: "This lesson focuses on the commonly confused vowel pair /ɪ/ and /iː/. You will learn how to distinguish mouth position, length, and common minimal pairs such as ship – sheep and bit – beat.",
        category: "Module 1: Alphabet and Basic Sounds",
        content: `<div><strong>Introduction to /ɪ/ and /iː/</strong><p>/ɪ/ and /iː/ are among the most confusing vowel pairs for English learners, especially Vietnamese learners. The main difference is length: /ɪ/ is short and relaxed, while /iː/ is long and tenser. For example, 'ship' /ʃɪp/ means a vessel, while 'sheep' /ʃiːp/ means an animal.</p></div><div><strong>Features of short vowel /ɪ/</strong><p>/ɪ/ is a short vowel. The tongue is high and near the front, but relaxed. The mouth is slightly open and the sound is not held. It appears in common words such as 'sit' /sɪt/, 'fish' /fɪʃ/, and 'milk' /mɪlk/.</p></div><div><strong>Features of long vowel /iː/</strong><p>/iː/ is a long vowel. The tongue is also high and front, but tenser than /ɪ/. This sound is held longer and pronounced more clearly. Examples include 'see' /siː/, 'tree' /triː/, and 'meat' /miːt/.</p></div><div><strong>Main differences between /ɪ/ and /iː/</strong><p>The biggest differences are length and tension. /ɪ/ is short and relaxed, while /iː/ is long and tense. Compare 'hit' /hɪt/ and 'heat' /hiːt/. If the difference is unclear, listeners may misunderstand the word.</p></div><div><strong>Common words with /ɪ/</strong><p>/ɪ/ often appears in words with a short letter 'i', such as 'sit', 'bit', and 'ship', and in some words with 'y', such as 'gym' /dʒɪm/. It is very common in everyday English.</p></div><div><strong>Common words with /iː/</strong><p>/iː/ often appears with 'ee' as in 'see', 'tree', and 'green', or 'ea' as in 'tea' and 'meat'. It can also appear with 'ie' as in 'field' /fiːld/ or final 'e' as in 'me' /miː/.</p></div><div><strong>Common traps for Vietnamese learners</strong><p>Vietnamese learners often pronounce /ɪ/ like the Vietnamese /i/ and fail to distinguish it from /iː/. This can cause confusion, such as 'live' /lɪv/ and 'leave' /liːv/. Practice the difference in length and tension carefully.</p></div><div><strong>Minimal pair practice</strong><p>Practice pairs such as 'sit' /sɪt/ – 'seat' /siːt/, 'ship' /ʃɪp/ – 'sheep' /ʃiːp/, and 'bit' /bɪt/ – 'beat' /biːt/. Make /iː/ about twice as long as /ɪ/.</p></div><div><strong>Tips for /ɪ/</strong><p>Keep the tongue relaxed, the lips natural, and the sound short. Try saying 'sit' quickly and clearly to feel the shortness of /ɪ/.</p></div><div><strong>Tips for /iː/</strong><p>For /iː/, hold the sound for about one second. Keep the tongue tenser and pull the lips slightly to the sides. Practice with 'see' and hold the vowel longer.</p></div><div><strong>Listening practice</strong><p>Listen to minimal pairs such as 'bit' – 'beat' and 'sit' – 'seat'. Repeat many times, record yourself, and compare your pronunciation with a standard dictionary recording.</p></div><div><strong>Conclusion and next steps</strong><p>Distinguishing /ɪ/ and /iː/ helps you avoid misunderstandings and improve both speaking and listening. In the next lessons, we will continue with other short vowels and compare them with long vowels.</p></div>`,
        quizzes: [
            { question: "The sound /iː/ is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "long", explanation: "/iː/ is a long vowel and is held longer than /ɪ/.", options: [] },
            { question: "How is /ɪ/ usually pronounced?", type: "multiple-choice", correctAnswer: "Short, quick, and relaxed", explanation: "/ɪ/ is a short vowel with a relaxed mouth position.", options: ["Long and tense", "Short, quick, and relaxed", "With the lips pulled far to the sides", "As a nasal sound"] },
            { question: "Which word contains the long vowel /iː/?", type: "multiple-choice", correctAnswer: "green", explanation: "green /ɡriːn/ contains the long vowel /iː/.", options: ["sit", "bit", "ship", "green"] },
            { question: "ship has a ...... vowel, while sheep has a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short - long", explanation: "ship has /ɪ/, a short vowel; sheep has /iː/, a long vowel.", options: [] },
            { question: "Which pair best shows the difference between /ɪ/ and /iː/?", type: "multiple-choice", correctAnswer: "seat – sit", explanation: "seat /iː/ and sit /ɪ/ are a typical minimal pair.", options: ["pen – pan", "seat – sit", "dog – dig", "cap – cup"] },
            { question: "What mouth shape is needed for /iː/?", type: "multiple-choice", correctAnswer: "Pull the mouth corners to the sides and hold the sound longer", explanation: "/iː/ is pronounced with a slight smile shape and a longer vowel.", options: ["Round the lips forward", "Open the mouth wide and round", "Pull the mouth corners to the sides and hold the sound longer", "Keep the lips completely relaxed"] },
            { question: "The /ɪ/ in 'fish' is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short", explanation: "/ɪ/ in fish is short and pronounced quickly.", options: [] }
        ]
    },
    "nguyen-am-don-e-va-ae": {
        title: "Lesson 3: Monophthongs /e/ and /æ/",
        description: "This lesson focuses on /e/ and /æ/, two vowels that are often confused by English learners. You will learn mouth opening, tongue position, and common pairs such as pen – pan and bed – bad.",
        category: "Module 1: Alphabet and Basic Sounds",
        content: `<div><strong>Introduction to /e/ and /æ/</strong><p>/e/ and /æ/ mainly differ in mouth opening. /e/ is short with a medium mouth opening, while /æ/ requires a wider mouth and a lower tongue. This difference changes meaning, for example 'pen' /pen/ and 'pan' /pæn/.</p></div><div><strong>Features of /e/</strong><p>/e/ is a short vowel. The tongue is front and mid, the mouth opens moderately, and the lips stay natural. Examples include 'bed' /bed/, 'red' /red/, and 'men' /men/.</p></div><div><strong>Features of /æ/</strong><p>/æ/ is also a short vowel, but the mouth opens wider than /e/ and the tongue is lower. Learners need to open the mouth clearly. Examples include 'cat' /kæt/, 'man' /mæn/, and 'apple' /ˈæpl/.</p></div><div><strong>Main difference between /e/ and /æ/</strong><p>The key difference is mouth opening. /e/ is moderately open, while /æ/ is wider. Compare 'met' /met/ and 'mat' /mæt/. If the sound is unclear, the listener may misunderstand.</p></div><div><strong>Common words with /e/</strong><p>/e/ appears in many words with short 'e', such as 'get', 'pen', and 'net'. It is very common in daily conversation.</p></div><div><strong>Common words with /æ/</strong><p>/æ/ often appears in words with the letter 'a', such as 'cat', 'bag', and 'black'. Vietnamese learners often pronounce it too close to /e/.</p></div><div><strong>Common traps for Vietnamese learners</strong><p>Many Vietnamese learners pronounce /æ/ as /e/, so 'bad' /bæd/ can sound like 'bed' /bed/. This is a common mistake to watch for.</p></div><div><strong>Minimal pair practice</strong><p>Practice pairs such as 'pen' /pen/ – 'pan' /pæn/, 'bed' /bed/ – 'bad' /bæd/, and 'men' /men/ – 'man' /mæn/. Open your mouth wider for /æ/.</p></div><div><strong>Tips for /e/</strong><p>Open the mouth moderately and keep the tongue slightly raised toward the front. Pronounce it shortly and clearly.</p></div><div><strong>Tips for /æ/</strong><p>Open the mouth wide, lower the tongue, and make the sound slightly fuller than /e/. Try saying 'cat' and feel the mouth opening.</p></div><div><strong>Listening practice</strong><p>Listen to minimal pairs such as 'pen' – 'pan' and 'bed' – 'bad'. Repeat many times and record yourself to compare with a standard pronunciation.</p></div><div><strong>Conclusion and next steps</strong><p>Clearly distinguishing /e/ and /æ/ helps you avoid confusion in communication. In the next lesson, we will continue with other short vowels and practice comparing them.</p></div>`,
        quizzes: [
            { question: "What mouth shape is needed for /æ/?", type: "multiple-choice", correctAnswer: "Wide opening, tongue lowered", explanation: "/æ/ requires a wide mouth opening and a lower tongue position.", options: ["Lips pushed forward", "Wide opening, tongue lowered", "Moderate opening, tongue raised", "Rounded and closed lips"] },
            { question: "Which word has the vowel /e/?", type: "multiple-choice", correctAnswer: "red", explanation: "red /red/ contains the vowel /e/.", options: ["cat", "red", "bag", "man"] },
            { question: "pen has ......, while pan has ......", type: "fill-in-the-blank", correctAnswer: "e - æ", explanation: "pen /pen/ has /e/, while pan /pæn/ has /æ/.", options: [] },
            { question: "Vietnamese learners often confuse /æ/ with ......", type: "fill-in-the-blank", correctAnswer: "e", explanation: "Vietnamese learners often pronounce /æ/ too close to /e/.", options: [] },
            { question: "Which word contains /æ/?", type: "multiple-choice", correctAnswer: "cat", explanation: "cat /kæt/ contains /æ/.", options: ["red", "pen", "bed", "cat"] },
            { question: "Which pair clearly shows the difference between /e/ and /æ/?", type: "multiple-choice", correctAnswer: "bed – bad", explanation: "bed /bed/ and bad /bæd/ differ by /e/ and /æ/.", options: ["dog – dig", "pen – pan", "bed – bad", "cup – cap"] },
            { question: "The /e/ in 'men' is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short", explanation: "/e/ is a short vowel, pronounced quickly and clearly.", options: [] }
        ]
    },
    "nguyen-am-don-ʌ-va-ɑː": {
        title: "Lesson 4: Monophthongs /ʌ/ and /ɑː/",
        description: "This lesson focuses on /ʌ/ and /ɑː/, a short-long vowel pair that Vietnamese learners often confuse. You will learn mouth opening, vowel length, and pairs such as cup – car and luck – lark.",
        category: "Module 1: Alphabet and Basic Sounds",
        content: `<div><strong>Introduction to /ʌ/ and /ɑː/</strong><p>/ʌ/ and /ɑː/ contrast in length and tongue position. /ʌ/ is short, with a moderately open mouth and a low central tongue. /ɑː/ is long, with a wider mouth opening and a lower tongue. Examples include 'cup' /kʌp/ and 'car' /kɑː/.</p></div><div><strong>Features of short vowel /ʌ/</strong><p>/ʌ/ is pronounced quickly and briefly. The tongue is low and central, and the lips remain natural. Examples include 'luck' /lʌk/, 'bus' /bʌs/, and 'cut' /kʌt/.</p></div><div><strong>Features of long vowel /ɑː/</strong><p>/ɑː/ is a long vowel. The mouth opens wider, the tongue lowers, and the sound is held clearly. Examples include 'father' /ˈfɑːðə/, 'park' /pɑːk/, and 'heart' /hɑːt/.</p></div><div><strong>Main difference between /ʌ/ and /ɑː/</strong><p>/ʌ/ is short and central, while /ɑː/ is long, open, and held. Compare 'luck' /lʌk/ and 'lark' /lɑːk/. Unclear pronunciation can lead to misunderstanding.</p></div><div><strong>Common words with /ʌ/</strong><p>/ʌ/ appears in many everyday words, such as 'sun' /sʌn/, 'money' /ˈmʌni/, and 'fun' /fʌn/.</p></div><div><strong>Common words with /ɑː/</strong><p>/ɑː/ often appears in words such as 'car' /kɑː/, 'start' /stɑːt/, and 'dark' /dɑːk/. Because it is long, it is important for natural English pronunciation.</p></div><div><strong>Common traps for Vietnamese learners</strong><p>Vietnamese learners may pronounce /ʌ/ like Vietnamese /a/ or fail to hold /ɑː/ long enough. This can make 'cup' sound like 'car' or 'luck' sound like 'lark'.</p></div><div><strong>Minimal pair practice</strong><p>Practice pairs such as 'cup' /kʌp/ – 'car' /kɑː/, 'luck' /lʌk/ – 'lark' /lɑːk/, and 'hut' /hʌt/ – 'heart' /hɑːt/. Hold /ɑː/ clearly.</p></div><div><strong>Tips for /ʌ/</strong><p>Make the sound short and quick, with a moderately open mouth. Try saying 'cup' and keep the vowel brief.</p></div><div><strong>Tips for /ɑː/</strong><p>Open the mouth wider, lower the tongue, and hold the sound. Practice with 'car' and lengthen the /ɑː/ more than usual.</p></div><div><strong>Listening practice</strong><p>Listen and repeat pairs such as 'cup' – 'car' and 'luck' – 'lark'. Record yourself and compare with dictionary pronunciation.</p></div><div><strong>Conclusion and next steps</strong><p>Distinguishing /ʌ/ and /ɑː/ helps you avoid common pronunciation mistakes. In the next lesson, we will continue with another vowel pair.</p></div>`,
        quizzes: [
            { question: "The sound /ʌ/ is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short", explanation: "/ʌ/ is a short vowel, pronounced quickly and clearly.", options: [] },
            { question: "Which word has the long vowel /ɑː/?", type: "multiple-choice", correctAnswer: "car", explanation: "car /kɑː/ contains the long vowel /ɑː/.", options: ["cup", "luck", "cut", "car"] },
            { question: "luck has ......, while lark has ......", type: "fill-in-the-blank", correctAnswer: "ʌ - ɑː", explanation: "luck /lʌk/ has /ʌ/, while lark /lɑːk/ has /ɑː/.", options: [] },
            { question: "What common mistake do Vietnamese learners make with /ɑː/?", type: "multiple-choice", correctAnswer: "They do not hold the sound long enough", explanation: "/ɑː/ is a long vowel; if it is not held, it can be confused with /ʌ/ or /a/.", options: ["They do not hold the sound long enough", "They pronounce it as /e/", "They pronounce it as /iː/", "They pronounce it as /o/"] },
            { question: "Which word often contains /ʌ/?", type: "multiple-choice", correctAnswer: "bus", explanation: "bus /bʌs/ contains the short vowel /ʌ/.", options: ["car", "park", "bus", "dark"] },
            { question: "What mouth shape is needed for /ɑː/?", type: "multiple-choice", correctAnswer: "Wide mouth opening, low tongue, long sound", explanation: "/ɑː/ is open and clearly lengthened.", options: ["Narrow and short mouth opening", "Lips pushed forward", "Wide mouth opening, low tongue, long sound", "Closed lips"] },
            { question: "The /ʌ/ in 'cut' is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short", explanation: "/ʌ/ in cut is a short vowel.", options: [] }
        ]
    },
    "nguyen-am-djon-ɒ-va-ɔː": {
        title: "Lesson 5: Monophthongs /ɒ/ and /ɔː/",
        description: "This lesson focuses on /ɒ/ and /ɔː/, an important vowel pair in English. You will learn the difference in length and mouth shape through pairs such as cot – caught and not – nought.",
        category: "Module 5: Final Sounds",
        content: `<div><strong>Introduction to /ɒ/ and /ɔː/</strong><p>/ɒ/ and /ɔː/ differ in vowel length and mouth shape. /ɒ/ is short, with a moderately open mouth and a low tongue. /ɔː/ is long, with a wider opening and slightly rounded lips. Examples include 'cot' /kɒt/ and 'caught' /kɔːt/.</p></div><div><strong>Features of short vowel /ɒ/</strong><p>/ɒ/ is a short vowel. The mouth opens moderately, the lips are slightly rounded, and the sound is quick. Examples include 'not' /nɒt/, 'hot' /hɒt/, and 'dog' /dɒg/.</p></div><div><strong>Features of long vowel /ɔː/</strong><p>/ɔː/ is a long vowel. The lips are more rounded and the sound is held longer. Examples include 'call' /kɔːl/, 'law' /lɔː/, and 'short' /ʃɔːt/.</p></div><div><strong>Main difference between /ɒ/ and /ɔː/</strong><p>/ɒ/ is short and lightly rounded, while /ɔː/ is long, more rounded, and held. Compare 'cot' /kɒt/ and 'caught' /kɔːt/.</p></div><div><strong>Common words with /ɒ/</strong><p>/ɒ/ often appears in words such as 'pot' /pɒt/, 'shop' /ʃɒp/, and 'lot' /lɒt/.</p></div><div><strong>Common words with /ɔː/</strong><p>/ɔː/ often appears in words such as 'ball' /bɔːl/, 'more' /mɔː/, and 'talk' /tɔːk/.</p></div><div><strong>Common traps for Vietnamese learners</strong><p>Vietnamese learners often pronounce /ɒ/ like Vietnamese /o/ and do not hold /ɔː/ long enough. This can make 'cot' and 'caught' sound too similar.</p></div><div><strong>Minimal pair practice</strong><p>Practice pairs such as 'cot' /kɒt/ – 'caught' /kɔːt/, 'not' /nɒt/ – 'nought' /nɔːt/, and 'shop' /ʃɒp/ – 'shore' /ʃɔː/.</p></div><div><strong>Tips for /ɒ/</strong><p>Keep /ɒ/ short. Open the mouth lightly and avoid holding the sound. Practice with 'pot' and keep the vowel brief.</p></div><div><strong>Tips for /ɔː/</strong><p>Round the lips more and hold the sound. Practice with 'law' and keep /ɔː/ longer.</p></div><div><strong>Listening practice</strong><p>Listen to pairs such as 'cot' – 'caught' and 'not' – 'nought'. Record yourself and compare with standard dictionary pronunciation.</p></div><div><strong>Conclusion and next steps</strong><p>Distinguishing /ɒ/ and /ɔː/ helps you speak more accurately and avoid confusing meanings. In the next lesson, we will continue with other monophthongs.</p></div>`,
        quizzes: [
            { question: "The sound /ɒ/ is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short", explanation: "/ɒ/ is a short vowel, pronounced quickly and clearly.", options: [] },
            { question: "Which word contains the long vowel /ɔː/?", type: "multiple-choice", correctAnswer: "ball", explanation: "ball /bɔːl/ contains the long vowel /ɔː/.", options: ["pot", "dog", "ball", "shop"] },
            { question: "cot has ......, while caught has ......", type: "fill-in-the-blank", correctAnswer: "ɒ - ɔː", explanation: "cot /kɒt/ has /ɒ/, while caught /kɔːt/ has /ɔː/.", options: [] },
            { question: "What common mistake do Vietnamese learners make with /ɔː/?", type: "multiple-choice", correctAnswer: "They do not hold the sound long enough", explanation: "/ɔː/ is a long vowel; without enough length, it may be confused with /ɒ/.", options: ["They pronounce it as /a/", "They do not hold the sound long enough", "They pronounce it as /e/", "They pronounce it as /iː/"] },
            { question: "Which word often contains /ɒ/?", type: "multiple-choice", correctAnswer: "shop", explanation: "shop /ʃɒp/ contains the short vowel /ɒ/.", options: ["law", "shore", "shop", "ball"] },
            { question: "What mouth shape is needed for /ɔː/?", type: "multiple-choice", correctAnswer: "Rounded lips and a clearly lengthened sound", explanation: "/ɔː/ is characterized by rounded lips and a longer sound.", options: ["Narrow and short mouth opening", "Rounded lips and a clearly lengthened sound", "Closed lips", "Very small mouth opening"] },
            { question: "The /ɒ/ in 'dog' is a ...... vowel.", type: "fill-in-the-blank", correctAnswer: "short", explanation: "/ɒ/ in dog is a short vowel.", options: [] }
        ]
    }
};

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const db = client.db(config.mongodb.database);
    const pronunciationCollection = db.collection("pronunciations");
    const translationCollection = db.collection("englishtranslations");

    await translationCollection.createIndex(
        { contentType: 1, contentId: 1 },
        { unique: true, name: "content_translation_unique" }
    );

    const pronunciations = await pronunciationCollection.find({}).sort({ sort: 1 }).toArray();
    let upserted = 0;
    let modified = 0;
    let skipped = 0;

    for (const pronunciation of pronunciations) {
        const fields = translationsBySlug[pronunciation.slug];
        if (!fields) {
            skipped += 1;
            continue;
        }
        const result = await translationCollection.updateOne(
            {
                contentType: "pronunciation",
                contentId: pronunciation._id
            },
            {
                $set: {
                    contentType: "pronunciation",
                    contentId: pronunciation._id,
                    sourceSlug: pronunciation.slug || "",
                    fields,
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

    console.log(`Seeded pronunciation English translations: ${pronunciations.length - skipped} total (${upserted} inserted, ${modified} updated, ${skipped} skipped).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed pronunciation English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
