const { buildCacheKey, buildTag } = require('./cacheKeyBuilder');

const modules = {
    grammar: {
        list: 'list',
        item: 'item'
    },
    pronunciation: {
        list: 'list',
        item: 'item'
    },
    story: {
        list: 'list',
        item: 'item'
    },
    grammarexercise: {
        list: 'list',
        item: 'item'
    },
    pronunciationexercise: {
        list: 'list',
        item: 'item'
    },
    vocabularyexercise: {
        list: 'list',
        item: 'item'
    },
    dictation: {
        list: 'list',
        item: 'item'
    },
    journey: {
        list: 'list',
        details: 'details'
    },
    gate: {
        list: 'list',
        item: 'item',
        journey: 'journey'
    },
    stage: {
        list: 'list',
        detail: 'detail',
        gate: 'gate'
    },
    userprogress: {
        list: 'list',
        detail: 'detail'
    },
    flashcard: {
        list: 'list',
        item: 'item'
    },
    learningAgent: {
        dailyPlan: 'dailyPlan'
    }
};

function key(module, resource, options = {}) {
    return buildCacheKey({ module, resource, ...options });
}

function tag(module, resource, id) {
    return buildTag(module, resource, id);
}

function listKey(module, query = {}) {
    return key(module, 'list', { query });
}

function itemKey(module, id) {
    return key(module, 'item', { id });
}

function slugKey(module, slug) {
    return key(module, 'slug', { id: slug });
}

function listTags(module) {
    return [tag(module, 'list'), tag(module, 'all')];
}

function itemTags(module, id, slug) {
    return [
        tag(module, 'item'),
        tag(module, 'item', id),
        slug ? tag(module, 'slug') : null,
        slug ? tag(module, 'slug', slug) : null,
        tag(module, 'all')
    ].filter(Boolean);
}

function contentTags(module, id, slug) {
    return [...listTags(module), ...itemTags(module, id, slug)];
}

const dependencies = {
    gate: [tag('journey', 'list'), tag('journey', 'details'), tag('journey', 'all')],
    stage: [
        tag('gate', 'list'),
        tag('gate', 'item'),
        tag('gate', 'journey'),
        tag('gate', 'all'),
        tag('journey', 'list'),
        tag('journey', 'details'),
        tag('journey', 'all')
    ]
};

function dependencyTags(module) {
    return dependencies[module] || [];
}

module.exports = {
    modules,
    key,
    tag,
    listKey,
    itemKey,
    slugKey,
    listTags,
    itemTags,
    contentTags,
    dependencyTags
};
