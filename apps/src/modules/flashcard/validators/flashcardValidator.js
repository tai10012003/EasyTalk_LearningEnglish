function validateFlashcardListInput(body) {
    const errors = [];
    if(!body.name || body.name.trim() === '') {
        errors.push('Name is required');
    }
    if(!body.description || body.description.trim() === '') {
        errors.push('Description is required');
    }
    return { valid: errors.length === 0, errors };
}

function validateFlashcardInput(body) {
    const errors = [];
    if(!body.word || body.word.trim() === '') {
        errors.push('Word is required');
    }
    if(!body.meaning || body.meaning.trim() === '') {
        errors.push('Meaning is required');
    }
    if(!body.flashcardList) {
        errors.push('Flashcard list is required');
    }
    if(body.difficulty !== undefined) {
        const diff = parseInt(body.difficulty);
        if(isNaN(diff) || ![1, 2, 3].includes(diff)) {
            errors.push('Difficulty must be 1 (remembered), 2 (learning), or 3 (hard)');
        }
    }
    return { valid: errors.length === 0, errors };
}

function validateDifficultyUpdates(updates) {
    if(!Array.isArray(updates) || updates.length === 0) {
        return {
            valid: false,
            error: 'Invalid updates array'
        };
    }
    for(let update of updates) {
        if(!update.cardId) {
            return {
                valid: false,
                error: 'Each update must have cardId'
            };
        }
        if(update.difficulty === undefined) {
            return {
                valid: false,
                error: 'Each update must have difficulty'
            };
        }
        const validDifficulties = [1, 2, 3];
        if(!validDifficulties.includes(update.difficulty)) {
            return {
                valid: false,
                error: 'Difficulty must be 1, 2, or 3'
            };
        }
    }
    return { valid: true };
}

module.exports = { validateFlashcardListInput, validateFlashcardInput, validateDifficultyUpdates };