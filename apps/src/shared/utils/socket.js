let io = null;
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const jsonwebtoken = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const config = require("../config/setting");
const DatabaseConnection = require("../database/database");
const logger = require("./logger");
const { getRedisClient, isRedisConnected, isRedisEnabled } = require("./redisClient");

const JWT_ALGORITHM = "HS256";
const SOCKET_AUTH_REVALIDATE_MS = Number(process.env.SOCKET_AUTH_REVALIDATE_MS || 60000);
const SOCKET_AUTH_DISCONNECT_GRACE_MS = Number(process.env.SOCKET_AUTH_DISCONNECT_GRACE_MS || 250);

function normalizeTokenVersion(tokenVersion) {
    return Number(tokenVersion || 0);
}

async function findSocketUser(decoded) {
    const userId = decoded.id || decoded.userId || decoded.sub;
    if (!userId || !ObjectId.isValid(userId)) {
        return null;
    }

    const client = DatabaseConnection.getMongoClient();
    const db = client.db(config.mongodb.database);
    return await db.collection("users").findOne(
        { _id: new ObjectId(userId) },
        {
            projection: {
                username: 1,
                email: 1,
                role: 1,
                active: 1,
                tokenVersion: 1
            }
        }
    );
}

async function validateSocketToken(token) {
    if (!token) {
        throw new Error("SOCKET_AUTH_REQUIRED");
    }

    try {
        const decoded = jsonwebtoken.verify(token, config.jwt.secret, { algorithms: [JWT_ALGORITHM] });
        if (decoded.type == "refresh") {
            throw new Error("SOCKET_INVALID_TOKEN_TYPE");
        }

        const user = await findSocketUser(decoded);
        if (!user) {
            throw new Error("SOCKET_USER_NOT_FOUND");
        }
        if (user.active === "locked") {
            throw new Error("SOCKET_ACCOUNT_LOCKED");
        }
        if (normalizeTokenVersion(decoded.tokenVersion) !== normalizeTokenVersion(user.tokenVersion)) {
            throw new Error("SOCKET_TOKEN_REVOKED");
        }

        return { decoded, user };
    } catch (err) {
        if (err.name == "TokenExpiredError") {
            throw new Error("SOCKET_TOKEN_EXPIRED");
        }
        if (err.name == "JsonWebTokenError") {
            throw new Error("SOCKET_INVALID_TOKEN");
        }
        throw err;
    }
}

async function authenticateSocket(socket, next) {
    try {
        const token = socket.handshake.auth?.token;
        const { decoded, user } = await validateSocketToken(token);
        socket.authToken = token;
        socket.authDecoded = decoded;
        socket.user = {
            id: user._id.toString(),
            role: user.role,
            username: user.username,
            email: user.email,
            tokenVersion: user.tokenVersion || 0
        };
        return next();
    } catch (err) {
        return next(err);
    }
}

async function initRedisAdapter(ioInstance) {
    if (!isRedisEnabled() || process.env.SOCKET_REDIS_ADAPTER_ENABLED === "false") {
        logger.info("Socket.IO Redis adapter disabled");
        return;
    }

    const isRedisAdapterRequired = process.env.SOCKET_REDIS_ADAPTER_REQUIRED === "true"
        || (process.env.NODE_ENV === "production" && process.env.SOCKET_REDIS_ADAPTER_REQUIRED !== "false");

    try {
        if (isRedisAdapterRequired && !isRedisConnected()) {
            throw new Error("Redis must be connected before initializing the required Socket.IO adapter");
        }

        const pubClient = getRedisClient();
        if (!pubClient) {
            if (isRedisAdapterRequired) {
                throw new Error("Redis client is unavailable");
            }
            logger.warn("Socket.IO Redis adapter skipped because Redis client is unavailable");
            return;
        }

        const subClient = pubClient.duplicate();
        subClient.on("error", (err) => {
            logger.warn("Socket.IO Redis subscriber error", { message: err.message });
        });
        await new Promise((resolve, reject) => {
            if (subClient.status === "ready") {
                return resolve();
            }
            subClient.once("ready", () => {
                logger.info("Socket.IO Redis subscriber ready");
                resolve();
            });
            subClient.once("error", (err) => {
                reject(err);
            });
        });

        ioInstance.adapter(createAdapter(pubClient, subClient));
        logger.info("Socket.IO Redis adapter initialized");
    } catch (err) {
        if (isRedisAdapterRequired) {
            throw err;
        }
        logger.warn("Socket.IO Redis adapter initialization failed", { message: err.message });
    }
}

function startSocketAuthRevalidation(socket) {
    if (!SOCKET_AUTH_REVALIDATE_MS || SOCKET_AUTH_REVALIDATE_MS < 10000) return null;

    return setInterval(async () => {
        try {
            await validateSocketToken(socket.authToken);
        } catch (err) {
            logger.info("Disconnecting socket after auth revalidation failed", {
                socketId: socket.id,
                userId: socket.user?.id,
                reason: err.message
            });
            socket.emit("auth-expired", { code: err.message });
            setTimeout(() => socket.disconnect(true), SOCKET_AUTH_DISCONNECT_GRACE_MS);
        }
    }, SOCKET_AUTH_REVALIDATE_MS);
}

function clearSocketAuthRevalidation(timer) {
    if (timer) {
        clearInterval(timer);
    }
}

function getSocketTransports() {
    const configuredTransports = process.env.SOCKET_TRANSPORTS;
    if (configuredTransports) {
        return configuredTransports
            .split(",")
            .map(transport => transport.trim())
            .filter(Boolean);
    }
    return process.env.NODE_ENV === "production" ? ["websocket"] : ["websocket", "polling"];
}

async function initSocket(server, allowedOrigins = ["http://localhost:5173"]) {
    io = new Server(server, {
        transports: getSocketTransports(),
        cors: {
            origin: allowedOrigins,
            credentials: true
        }
    });

    await initRedisAdapter(io);
    io.use(authenticateSocket);

    io.on("connection", (socket) => {
        const userRoom = `user:${socket.user.id}`;
        socket.join(userRoom);
        const authRevalidationTimer = startSocketAuthRevalidation(socket);
        logger.info("New authenticated socket connected", { socketId: socket.id, userId: socket.user.id });

        socket.on("disconnect", () => {
            clearSocketAuthRevalidation(authRevalidationTimer);
            logger.info("Socket disconnected", { socketId: socket.id, userId: socket.user.id });
        });
    });
    return io;
}

function getIo() {
    if (!io) throw new Error("Socket.io chưa được khởi tạo!");
    return io;
}

module.exports = { initSocket, getIo };