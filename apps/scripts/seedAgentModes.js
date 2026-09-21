const dotenv = require("dotenv");
const path = require("path");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const AgentModeService = require("../src/modules/learningAgent/services/agentModeService");

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const service = new AgentModeService();
    const results = await service.seedDefaultModes();
    const inserted = results.reduce((total, item) => total + item.upserted, 0);
    const modified = results.reduce((total, item) => total + item.modified, 0);
    console.log(`Seeded agentmodes: ${results.length} modes (${inserted} inserted, ${modified} updated).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed agentmodes:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
