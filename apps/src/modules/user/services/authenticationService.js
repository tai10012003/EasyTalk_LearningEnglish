const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require('../../../shared/config/setting');
const UserSessionRepository = require('../repositories/userSessionRepository');
const SecurityAuditService = require('./securityAuditService');

const REFRESH_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;
const JWT_ALGORITHM = "HS256";

function createAuthError(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function createSessionId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return crypto.randomBytes(32).toString("hex");
}

function getRequestMetadata(req) {
    if (!req) {
        return { userAgent: "", ipAddress: "" };
    }
    const forwardedFor = req.headers?.["x-forwarded-for"];
    const ipAddress = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : (forwardedFor || req.ip || req.socket?.remoteAddress || "");
    return {
        userAgent: req.headers?.["user-agent"] || "",
        ipAddress: String(ipAddress).split(",")[0].trim()
    };
}

class AuthenticationService {
    constructor(deps = {}) {
        this.sessionRepository = deps.sessionRepository || new UserSessionRepository();
        this.securityAuditService = deps.securityAuditService || new SecurityAuditService();
    }

    generateAccessToken(user) {
        return jwt.sign(
            { 
                id: user._id, 
                role: user.role, 
                username: user.username, 
                email: user.email,
                tokenVersion: user.tokenVersion || 0
            }, 
            config.jwt.secret, 
            { expiresIn: "15m", algorithm: JWT_ALGORITHM }
        );
    }

    hashRefreshToken(refreshToken) {
        return crypto.createHash("sha256").update(refreshToken).digest("hex");
    }

    async generateRefreshToken(user, req = null) {
        const sessionId = createSessionId();
        const token = jwt.sign(
            {  
                id: user._id, 
                type: "refresh",
                sessionId
            }, 
            config.jwt.secret, 
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN, algorithm: JWT_ALGORITHM }
        );
        const metadata = getRequestMetadata(req);
        await this.sessionRepository.create({
            userId: user._id,
            sessionId,
            refreshTokenHash: this.hashRefreshToken(token),
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS),
            ...metadata
        });
        return token;
    }

    decodeRefreshToken(refreshToken) {
        if(!refreshToken) {
            throw new Error("Refresh token không tồn tại");
        }
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.secret, { algorithms: [JWT_ALGORITHM] });
            if(decoded.type !== "refresh") {
                throw new Error("Token không phải refresh token");
            }
            return decoded;
        } catch (error) {
            throw new Error("Refresh token hết hạn hoặc không hợp lệ");
        }
    }

    async verifyRefreshToken(refreshToken) {
        const decoded = this.decodeRefreshToken(refreshToken);
        const refreshTokenHash = this.hashRefreshToken(refreshToken);
        const session = await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);
        if(!session) {
            throw new Error("Refresh token không hợp lệ");
        }
        if(session.revokedAt) {
            if(session.revokeReason === "rotated") {
                throw createAuthError("Refresh token đã được thay thế", "REFRESH_TOKEN_REUSED");
            }
            await this.sessionRepository.revokeAllByUserId(session.userId, "refresh_token_reuse");
            await this.securityAuditService.log("refresh_token_reuse_detected", {
                userId: session.userId,
                status: "warning",
                reason: "revoked_refresh_token_used",
                metadata: { sessionId: session.sessionId }
            });
            throw createAuthError("Refresh token đã bị thu hồi", "REFRESH_TOKEN_REUSED");
        }
        if(session.expiresAt && session.expiresAt.getTime() <= Date.now()) {
            await this.sessionRepository.revokeBySessionId(session.sessionId, { reason: "expired" });
            throw new Error("Refresh token đã hết hạn");
        }
        if(decoded.sessionId !== session.sessionId) {
            await this.sessionRepository.revokeByRefreshTokenHash(refreshTokenHash, "session_mismatch");
            throw new Error("Refresh token không hợp lệ");
        }
        await this.sessionRepository.markUsed(session.sessionId);
        return { decoded, session };
    }

    async rotateRefreshToken(user, refreshToken, req = null, verifiedSession = null) {
        const session = verifiedSession || (await this.verifyRefreshToken(refreshToken)).session;
        const newRefreshToken = await this.generateRefreshToken(user, req);
        const newDecoded = this.decodeRefreshToken(newRefreshToken);
        const revokeResult = await this.sessionRepository.revokeBySessionId(session.sessionId, {
            replacedBySessionId: newDecoded.sessionId,
            reason: "rotated"
        });
        if(revokeResult.modifiedCount !== 1) {
            await this.sessionRepository.revokeByRefreshTokenHash(
                this.hashRefreshToken(newRefreshToken),
                "rotation_failed"
            );
            throw new Error("Refresh token đã được sử dụng");
        }
        return newRefreshToken;
    }

    async revokeRefreshToken(refreshToken) {
        if(refreshToken) {
            await this.sessionRepository.revokeByRefreshTokenHash(
                this.hashRefreshToken(refreshToken),
                "logout"
            );
        }
    }

    async getSessionFromRefreshToken(refreshToken) {
        if(!refreshToken) return null;
        try {
            const decoded = this.decodeRefreshToken(refreshToken);
            const session = await this.sessionRepository.findByRefreshTokenHash(this.hashRefreshToken(refreshToken));
            if(!session || session.revokedAt || decoded.sessionId !== session.sessionId) {
                return null;
            }
            return session;
        } catch {
            return null;
        }
    }

    async listUserSessions(userId, currentRefreshToken = null) {
        const currentSession = await this.getSessionFromRefreshToken(currentRefreshToken);
        const sessions = await this.sessionRepository.findActiveByUserId(userId);
        return sessions.map(session => ({
            ...session,
            current: currentSession?.sessionId === session.sessionId
        }));
    }

    async revokeUserSession(userId, sessionId, reason = "session_revoked") {
        return await this.sessionRepository.revokeByUserIdAndSessionId(userId, sessionId, reason);
    }

    async revokeAllUserSessions(userId, reason = "revoked_all") {
        return await this.sessionRepository.revokeAllByUserId(userId, reason);
    }

    async generateTokenPair(user, req = null) {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = await this.generateRefreshToken(user, req);
        return { accessToken, refreshToken };
    }
}

module.exports = AuthenticationService;