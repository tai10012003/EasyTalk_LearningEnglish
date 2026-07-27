class ProgressTool {
    constructor(deps = {}) {
        this.userProgressService = deps.userProgressService || null;
    }

    setUserProgressService(service) {
        this.userProgressService = service;
    }

    async getUserProgress(userId) {
        if (!this.userProgressService) {
            throw new Error("UserProgressService chưa được inject!");
        }
        return await this.userProgressService.getUserProgressByUserId(userId);
    }
}

module.exports = ProgressTool;
