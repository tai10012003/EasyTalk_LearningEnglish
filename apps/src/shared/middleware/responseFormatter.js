function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function omitKeys(object, keys) {
    return Object.keys(object).reduce((result, key) => {
        if (!keys.includes(key)) {
            result[key] = object[key];
        }
        return result;
    }, {});
}

function normalizeSuccessBody(body) {
    if (isPlainObject(body) && hasOwn(body, "success")) {
        const { success, data, message, ...rest } = body;
        const normalized = {
            success: true,
            data: hasOwn(body, "data") ? data : (Object.keys(rest).length ? rest : null)
        };
        if (message) normalized.message = message;
        if (hasOwn(body, "data") && Object.keys(rest).length) normalized.meta = rest;
        return normalized;
    }
    if (isPlainObject(body) && hasOwn(body, "message") && Object.keys(body).length === 1) {
        return { success: true, data: null, message: body.message };
    }
    return { success: true, data: body ?? null };
}

function normalizeErrorBody(body) {
    if (isPlainObject(body)) {
        const message = body.message || body.error || "Request failed";
        const errorDetails = body.error && body.error !== message ? body.error : omitKeys(body, ["success", "message", "error"]);
        const hasErrorDetails = isPlainObject(errorDetails) ? Object.keys(errorDetails).length > 0 : errorDetails !== null && errorDetails !== undefined;
        const normalized = {
            success: false,
            message,
            error: hasErrorDetails ? errorDetails : null
        };
        if (body.code) normalized.code = body.code;
        return normalized;
    }
    return {
        success: false,
        message: body ? String(body) : "Request failed",
        error: null
    };
}

function responseFormatter(req, res, next) {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        const isExplicitError = isPlainObject(body) && body.success === false;
        const isErrorResponse = res.statusCode >= 400 || isExplicitError;
        const normalizedBody = isErrorResponse ? normalizeErrorBody(body) : normalizeSuccessBody(body);
        return originalJson(normalizedBody);
    };
    next();
}

module.exports = responseFormatter;