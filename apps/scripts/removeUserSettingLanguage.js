const dotenv = require("dotenv");
const path = require("path");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const db = client.db(config.mongodb.database);
    const result = await db.collection("usersettings").updateMany(
        { "general.language": { $exists: true } },
        { $unset: { "general.language": "" } }
    );

    console.log(`Removed usersettings.general.language from ${result.modifiedCount} document(s).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to remove usersettings.general.language:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
