const jwt = require("jsonwebtoken");
const config = require('../../../shared/config/setting');
const tokenManager = require('../utils/tokenManager');

class AuthenticationService {
    generateAccessToken(user) {
        return jwt.sign(
            { 
                id: user._id, 
                role: user.role, 
                username: user.username, 
                email: user.email 
            }, 
            config.jwt.secret, 
            { expiresIn: "15m" }
        );
    }

    generateRefreshToken(user) {
        const token = jwt.sign(
            {  
                id: user._id, 
                type: "refresh" 
            }, 
            config.jwt.secret, 
            { expiresIn: "7d" }
        );
        tokenManager.storeRefreshToken(token, user._id);
        return token;
    }

    verifyRefreshToken(refreshToken) {
        if(!refreshToken) {
            throw new Error("Refresh token không tồn tại");
        }
        if(!tokenManager.hasRefreshToken(refreshToken)) {
            throw new Error("Refresh token không hợp lệ");
        }
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.secret);
            if(decoded.type !== "refresh") {
                throw new Error("Token không phải refresh token");
            }
            return decoded;
        } catch (error) {
            tokenManager.deleteRefreshToken(refreshToken);
            throw new Error("Refresh token hết hạn hoặc không hợp lệ");
        }
    }

    revokeRefreshToken(refreshToken) {
        if(refreshToken) {
            tokenManager.deleteRefreshToken(refreshToken);
        }
    }

    generateTokenPair(user) {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return { accessToken, refreshToken };
    }
}

module.exports = AuthenticationService;