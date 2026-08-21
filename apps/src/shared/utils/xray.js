const logger = require("./logger");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const isXRayEnabled = runtimeEnv === "production";

let AWSXRay = null;

if (isXRayEnabled) {
    try {
        AWSXRay = require("aws-xray-sdk");
    } catch (error) {
        logger.warn("AWS X-Ray SDK is enabled but not installed", {
            package: "aws-xray-sdk",
            message: error.message,
        });
    }
}

module.exports = AWSXRay;
