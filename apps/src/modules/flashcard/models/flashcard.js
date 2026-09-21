const { ObjectId } = require('mongodb');

class Flashcard {
    constructor({ _id = null, word, meaning, pos, pronunciation, exampleSentence, image = null, flashcardList, user, difficulty = 2, createdAt = new Date() }) {
        this._id = _id;
        this.word = word;
        this.meaning = meaning;
        this.pos = pos;
        this.pronunciation = pronunciation;
        this.exampleSentence = exampleSentence;
        this.image = image;
        this.flashcardList = flashcardList;
        this.user = user;
        this.difficulty = difficulty;
        this.createdAt = createdAt;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.word || doc.word.trim() === '') {
            errors.push('Word is required');
        }
        if(!doc.meaning || doc.meaning.trim() === '') {
            errors.push('Meaning is required');
        }
        if(!doc.flashcardList) {
            errors.push('Flashcard list is required');
        }
        if(!doc.user) {
            errors.push('User is required');
        }
        if(doc.difficulty !== undefined) {
            const validDifficulties = [1, 2, 3];
            if (!validDifficulties.includes(doc.difficulty)) {
                errors.push('Difficulty must be 1 (remembered), 2 (learning), or 3 (hard)');
            }
        }
        return errors;
    }

    static buildDocument(data, userId, imageUrl = null) {
        return {
            word: data.word,
            meaning: data.meaning,
            pos: data.pos || '',
            pronunciation: data.pronunciation || '',
            exampleSentence: data.exampleSentence || '',
            image: imageUrl,
            flashcardList: new ObjectId(data.flashcardList),
            user: new ObjectId(userId),
            difficulty: data.difficulty || 2,
            createdAt: new Date()
        };
    }

    isRemembered() {
        return this.difficulty === 1;
    }

    needsReview() {
        return this.difficulty === 2 || this.difficulty === 3;
    }
}

module.exports = Flashcard;