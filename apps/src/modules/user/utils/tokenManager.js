class TokenManager {
    constructor() {
        this.verificationCodes = {};
    }

    storeVerificationCode(email, code, expiresAt, dataToRegister = null) {
        this.verificationCodes[email] = {
            code,
            expiresAt,
            dataToRegister
        };
    }

    getVerificationCode(email) {
        return this.verificationCodes[email];
    }

    deleteVerificationCode(email) {
        delete this.verificationCodes[email];
    }

    clearExpiredCodes() {
        const now = Date.now();
        for (const email in this.verificationCodes) {
            if (this.verificationCodes[email].expiresAt < now) {
                delete this.verificationCodes[email];
            }
        }
    }
}

const tokenManager = new TokenManager();

setInterval(() => {
    tokenManager.clearExpiredCodes();
}, 60000);

module.exports = tokenManager;