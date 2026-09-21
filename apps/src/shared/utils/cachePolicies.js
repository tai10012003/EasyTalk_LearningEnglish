const DEFAULT_PUBLIC_LIST = {
    admin: { ttl: 60, staleTtl: 0 },
    user: { ttl: 900, staleTtl: 300 }
};

const domainPolicies = {
    grammar: {
        list: { ...DEFAULT_PUBLIC_LIST, user: { ttl: 1200, staleTtl: 300 } },
        detail: { ttl: 3600, staleTtl: 600 }
    },
    pronunciation: {
        list: DEFAULT_PUBLIC_LIST,
        detail: { ttl: 3600, staleTtl: 600 }
    },
    story: {
        list: DEFAULT_PUBLIC_LIST,
        detail: { ttl: 3600, staleTtl: 600 }
    },
    grammarexercise: {
        list: DEFAULT_PUBLIC_LIST,
        detail: { ttl: 1800, staleTtl: 600 }
    },
    pronunciationexercise: {
        list: DEFAULT_PUBLIC_LIST,
        detail: { ttl: 1800, staleTtl: 600 }
    },
    vocabularyexercise: {
        list: DEFAULT_PUBLIC_LIST,
        detail: { ttl: 1800, staleTtl: 600 }
    },
    dictation: {
        list: DEFAULT_PUBLIC_LIST,
        detail: { ttl: 1800, staleTtl: 600 }
    },
    journey: {
        list: { ttl: 900, staleTtl: 300 },
        detail: { ttl: 1800, staleTtl: 600 }
    },
    gate: {
        list: { ttl: 900, staleTtl: 300 },
        detail: { ttl: 1800, staleTtl: 600 }
    },
    stage: {
        list: { ttl: 900, staleTtl: 300 },
        detail: { ttl: 1800, staleTtl: 600 }
    },
    userprogress: {
        list: { ttl: 30, staleTtl: 15 },
        detail: { ttl: 15, staleTtl: 0 }
    },
    leaderboard: {
        list: { ttl: 60, staleTtl: 30 }
    }
};

function forRole(policy, role = 'user') {
    if (!policy?.admin && !policy?.user) return policy;
    return role === 'admin' ? policy.admin : policy.user;
}

function domain(moduleName, resource, role = 'user', fallback = { ttl: 300, staleTtl: 0 }) {
    return forRole(domainPolicies[moduleName]?.[resource], role) || fallback;
}

const policies = {
    domain,
    contentList(moduleName, role = 'user') {
        return domain(moduleName, 'list', role, forRole(DEFAULT_PUBLIC_LIST, role));
    },
    contentDetail(moduleName) {
        return domain(moduleName, 'detail', 'user', { ttl: 1800, staleTtl: 600 });
    },
    relationList(moduleName = 'journey') {
        return domain(moduleName, 'list', 'user', { ttl: 900, staleTtl: 300 });
    },
    relationDetail(moduleName = 'journey') {
        return domain(moduleName, 'detail', 'user', { ttl: 1800, staleTtl: 600 });
    },
    userList() {
        return domain('userprogress', 'list');
    },
    userDetail() {
        return domain('userprogress', 'detail');
    },
    publicList(role = 'user') {
        return forRole(DEFAULT_PUBLIC_LIST, role);
    },
    publicDetail() {
        return { ttl: 1800, staleTtl: 600 };
    },
    noCache() {
        return { ttl: 0, staleTtl: 0, enabled: false };
    }
};

function withTags(policy, tags = []) {
    return { ...policy, tags };
}

module.exports = {
    domainPolicies,
    policies,
    withTags
};
