function validateStoryInput(body) {
    const errors = [];
    if(!body.title || body.title.trim() === '') {
        errors.push('Title is required');
    }
    if(!body.level || body.level.trim() === '') {
        errors.push('Level is required');
    }
    if(!body.category || body.category.trim() === '') {
        errors.push('Category is required');
    }
    if(body.sort !== undefined) {
        const sort = parseInt(body.sort);
        if (isNaN(sort) || sort < 0) {
            errors.push('Sort must be a non-negative number');
        }
    }
    return { valid: errors.length === 0, errors };
}

function parseContent(contentString) {
    try {
        if (!contentString) return [];
        const parsed = JSON.parse(contentString);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (e) {
        console.error("Parse content error:", e);
        return [];
    }
}

function validateContent(content) {
    if(!content || !Array.isArray(content) || content.length === 0) {
        return { valid: false, error: 'Content must be a non-empty array' };
    }
    for(let i = 0; i < content.length; i++) {
        const sentence = content[i];
        if(!sentence.en || sentence.en.trim() === '') {
            return { valid: false, error: `Sentence ${i + 1}: English text is required` };
        }
        if(!sentence.vi || sentence.vi.trim() === '') {
            return { valid: false, error: `Sentence ${i + 1}: Vietnamese text is required` };
        }
    }
    return { valid: true };
}

module.exports = { validateStoryInput, parseContent, validateContent };