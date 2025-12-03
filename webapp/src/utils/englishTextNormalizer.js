import { SYNONYMS } from './englishSynonyms';

const CONTRACTIONS_MAP = {
    // Negative contractions
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "don't": "do not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "can't": "cannot",
    "cannot": "cannot",
    "couldn't": "could not",
    "shouldn't": "should not",
    "wouldn't": "would not",
    "mightn't": "might not",
    "mustn't": "must not",
    "shan't": "shall not",     // Anh-Anh
    "oughtn't": "ought not",   // hiếm nhưng có thật
    "needn't": "need not",     // Anh-Anh
    "daren't": "dare not",     // Anh-Anh, hiếm
    // Positive contractions - Subject + auxiliary
    "I'm": "I am",
    "you're": "you are",
    "he's": "he is",
    "she's": "she is",
    "it's": "it is",
    "we're": "we are",
    "they're": "they are",
    "there's": "there is",
    "here's": "here is",
    "where's": "where is",
    "when's": "when is",
    "why's": "why is",
    "how's": "how is",
    "what's": "what is",
    // have/has
    "I've": "I have",
    "you've": "you have",
    "we've": "we have",
    "they've": "they have",
    "who've": "who have",
    // had
    "I'd": "I had",
    "you'd": "you had",
    "he'd": "he had",
    "she'd": "she had",
    "it'd": "it had",
    "we'd": "we had",
    "they'd": "they had",
    // will
    "I'll": "I will",
    "you'll": "you will",
    "he'll": "he will",
    "she'll": "she will",
    "it'll": "it will",
    "we'll": "we will",
    "they'll": "they will",
    "that'll": "that will",
    "who'll": "who will",
    "what'll": "what will",
    "there'll": "there will",
    // would
    "I'd": "I would",     // trùng với "I had" → ưu tiên xử lý theo ngữ cảnh (không sao, vì normalize bỏ dấu câu)
    "you'd": "you would",
    "he'd": "he would",
    "she'd": "she would",
    "it'd": "it would",
    "we'd": "we would",
    "they'd": "they would",
    // shall (Anh-Anh)
    "I'll": "I shall",    // hiếm, nhưng có
    "you'll": "you shall",
    "we'll": "we shall",
    // Other common
    "let's": "let us",
    "that’s": "that is",
    "who’s": "who is",
    "that'd": "that would",
    "this'll": "this will",
    "y'all": "you all",           // Mỹ
    "y'all'd": "you all would",   // Mỹ (hiếm)
    "ain't": "am not",            // không chuẩn nhưng rất phổ biến ở Mỹ → xử lý đặc biệt
    "ain't": "is not",
    "ain't": "are not",
    "ain't": "has not",
    "ain't": "have not",
    // Rare but real
    "twon't": "it will not",      // cực hiếm, cổ
    " 'tis": "it is",             // thơ ca
    " 'twas": "it was",           // thơ ca
    "e'er": "ever",
    "ne'er": "never",
    "o'er": "over",
};

const expandContractions = (text) => {
    if (!text) return text;
    return text.replace(/\b[\w']+\b/g, (word) => {
        const original = word;
        const lower = word.toLowerCase();
        if (lower === "ain't") return "am not";
        const expanded = CONTRACTIONS_MAP[lower];
        if (!expanded) return original;
        return original[0] === original[0]?.toUpperCase() ? expanded.charAt(0).toUpperCase() + expanded.slice(1) : expanded;
    });
};

const replaceSynonyms = (text) => {
    return text.split(/\s+/).map(word => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!clean) return word;
        for (const [key, values] of Object.entries(SYNONYMS)) {
            if (key === clean || values.includes(clean)) {
                return word.replace(new RegExp(clean, 'gi'), key);
            }
        }
        return word;
    }).join(' ');
};

export const normalizeAnswer = (text = "") => {
    if (typeof text !== "string") return "";
    return replaceSynonyms(expandContractions(text)).toLowerCase().replace(/[.,?!;:'"()–—-]/g, "").replace(/\s+/g, " ").trim();
};

export const isAnswerCorrect = (userAnswer, correctAnswer) => {
    return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
};