const fs = require("fs");
const path = require("path");

function parseEnvFile(filePath) {
    if(!fs.existsSync(filePath)) return {};
    return fs.readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .reduce((env, line) => {
            const trimmed = line.trim();
            if(!trimmed || trimmed.startsWith("#")) return env;
            const equalIndex = trimmed.indexOf("=");
            if(equalIndex === -1) return env;
            const key = trimmed.slice(0, equalIndex).trim();
            const value = trimmed.slice(equalIndex + 1).trim().replace(/^["']|["']$/g, "");
            env[key] = value;
            return env;
        }, {});
}

function validateJwtSecret() {
    const jwtSecret = process.env.JWT_SECRET || "";
    const isProduction = process.env.NODE_ENV === "production";
    if(!jwtSecret) {
        throw new Error("JWT_SECRET is required.");
    }
    if(jwtSecret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters.");
    }
    if(isProduction) {
        if(jwtSecret.length < 64) {
            throw new Error("Production JWT_SECRET must be at least 64 characters.");
        }
        const developmentEnv = parseEnvFile(path.resolve(__dirname, "../../../.env.development"));
        if(developmentEnv.JWT_SECRET && developmentEnv.JWT_SECRET === jwtSecret) {
            throw new Error("Production JWT_SECRET must be different from development JWT_SECRET.");
        }
    }
}

function validateEnv() {
    validateJwtSecret();
}

module.exports = {
    validateEnv
};
