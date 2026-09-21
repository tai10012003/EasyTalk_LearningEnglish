const PRODUCTION_REFRESH_TOKEN_COOKIE = "__Host-refreshToken";
const LEGACY_REFRESH_TOKEN_COOKIE = "refreshToken";
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function getRefreshTokenCookieName() {
    return process.env.NODE_ENV === "production"
        ? PRODUCTION_REFRESH_TOKEN_COOKIE
        : LEGACY_REFRESH_TOKEN_COOKIE;
}

function getRefreshTokenCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: "/"
    };
}

function getClearRefreshTokenCookieOptions(path = "/") {
    const { maxAge, ...options } = getRefreshTokenCookieOptions();
    return {
        ...options,
        path
    };
}

function parseCookies(cookieHeader = "") {
    return cookieHeader.split(";").reduce((cookies, cookie) => {
        const [rawName, ...rawValueParts] = cookie.trim().split("=");
        if (!rawName) return cookies;
        cookies[rawName] = decodeURIComponent(rawValueParts.join("=") || "");
        return cookies;
    }, {});
}

function getRefreshTokenFromRequest(req) {
    const cookies = parseCookies(req.headers.cookie);
    return cookies[getRefreshTokenCookieName()]
        || cookies[PRODUCTION_REFRESH_TOKEN_COOKIE]
        || cookies[LEGACY_REFRESH_TOKEN_COOKIE]
        || null;
}

function setRefreshTokenCookie(res, refreshToken) {
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, getClearRefreshTokenCookieOptions());
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, getClearRefreshTokenCookieOptions("/user"));
    res.cookie(getRefreshTokenCookieName(), refreshToken, getRefreshTokenCookieOptions());
}

function clearRefreshTokenCookie(res) {
    const clearOptions = getClearRefreshTokenCookieOptions();
    res.clearCookie(PRODUCTION_REFRESH_TOKEN_COOKIE, clearOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, clearOptions);
    res.clearCookie(LEGACY_REFRESH_TOKEN_COOKIE, getClearRefreshTokenCookieOptions("/user"));
}

module.exports = {
    getRefreshTokenFromRequest,
    setRefreshTokenCookie,
    clearRefreshTokenCookie
};