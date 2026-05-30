const { Story } = require('../model/story');

function parseContent(contentString) {
    try {
        if (!contentString) return [];
        if (typeof contentString !== 'string') return contentString;
        const parsed = JSON.parse(contentString);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (e) {
        console.error("Parse content error:", e);
        return [];
    }
}

function validateStoryInput(body) {
    const content = parseContent(body.content);
    const errors = Story.validate({
        title: body.title,
        description: body.description,
        level: body.level,
        category: body.category,
        sort: body.sort !== undefined ? Number(body.sort) : undefined,
        content
    });
    return { valid: errors.length === 0, errors };
}

function buildStoryDataFromRequest(body) {
    return {
        title: body.title,
        description: body.description,
        level: body.level,
        category: body.category,
        content: parseContent(body.content),
        image: body.image || null,
        slug: body.slug,
        sort: parseInt(body.sort) || 0,
        display: body.display !== undefined ? body.display === 'true' || body.display === true : true
    };
}

module.exports = { validateStoryInput, parseContent, buildStoryDataFromRequest };