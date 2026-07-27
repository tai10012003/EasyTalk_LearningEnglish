class MemoryVersioning {
    constructor(options = {}) {
        this.currentVersion = options.currentVersion || "learner-memory-v1";
    }

    applyVersion(update = {}) {
        return {
            ...update,
            memoryVersion: this.currentVersion
        };
    }
}

module.exports = MemoryVersioning;
