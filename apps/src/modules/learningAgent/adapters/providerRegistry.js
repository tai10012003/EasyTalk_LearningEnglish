class ProviderRegistry {
    constructor(adapters = {}) {
        this.adapters = new Map();
        Object.entries(adapters).forEach(([key, adapter]) => {
            if (adapter) this.register(key, adapter);
        });
    }

    register(key, adapter) {
        this.adapters.set(key, adapter);
        return this;
    }

    get(key) {
        return this.adapters.get(key) || null;
    }

    require(key) {
        const adapter = this.get(key);
        if (!adapter) {
            throw new Error(`AI provider "${key}" is not implemented yet.`);
        }
        return adapter;
    }

    listKeys() {
        return Array.from(this.adapters.keys());
    }
}

module.exports = ProviderRegistry;
