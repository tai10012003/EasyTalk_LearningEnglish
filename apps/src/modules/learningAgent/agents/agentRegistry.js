class AgentRegistry {
    constructor(agents = {}) {
        this.agents = new Map();
        Object.entries(agents).forEach(([key, agent]) => {
            if (agent) this.register(key, agent);
        });
    }

    register(key, agent) {
        this.agents.set(key, agent);
        return this;
    }

    get(key) {
        return this.agents.get(key) || null;
    }

    require(key) {
        const agent = this.get(key);
        if (!agent) {
            throw new Error(`Learning agent "${key}" is not registered.`);
        }
        return agent;
    }

    listKeys() {
        return Array.from(this.agents.keys());
    }

    has(key) {
        return this.agents.has(key);
    }
}

module.exports = AgentRegistry;
