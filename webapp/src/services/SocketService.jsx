import { io } from "socket.io-client";
import { AuthService } from "./AuthService.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const AUTH_REFRESHABLE_ERRORS = new Set(["SOCKET_TOKEN_EXPIRED"]);
const AUTH_TERMINAL_ERRORS = new Set([
    "SOCKET_INVALID_TOKEN",
    "SOCKET_INVALID_TOKEN_TYPE",
    "SOCKET_TOKEN_REVOKED",
    "SOCKET_USER_NOT_FOUND",
    "SOCKET_ACCOUNT_LOCKED",
    "SOCKET_INVALID_USER",
]);

let socket = null;
let reconnectingAfterAuthError = false;
let manualDisconnect = false;
let lastAuthFailureCode = null;
const notificationSubscribers = new Set();

function notifySubscribers(notification) {
    notificationSubscribers.forEach((callback) => callback(notification));
}

async function handleAuthFailure(code) {
    lastAuthFailureCode = code;
    if (AUTH_REFRESHABLE_ERRORS.has(code)) {
        await reconnectWithFreshToken();
        return;
    }

    if (AUTH_TERMINAL_ERRORS.has(code)) {
        await AuthService.logout();
    }
}

async function reconnectWithFreshToken() {
    if (reconnectingAfterAuthError) return;
    reconnectingAfterAuthError = true;

    try {
        const newToken = await AuthService.refreshToken({ logoutOnFailure: false });
        SocketService.connect(newToken);
    } catch {
        await AuthService.logout();
    } finally {
        reconnectingAfterAuthError = false;
    }
}

function createSocket() {
    const nextSocket = io(getSocketUrl(), {
        autoConnect: false,
        transports: getSocketTransports(),
    });

    nextSocket.on("connect_error", (err) => {
        handleAuthFailure(err.message);
    });

    nextSocket.on("auth-expired", (payload) => {
        handleAuthFailure(payload?.code);
    });

    nextSocket.on("disconnect", (reason) => {
        if (manualDisconnect) return;
        if (reason == "io server disconnect" && !AUTH_TERMINAL_ERRORS.has(lastAuthFailureCode)) {
            reconnectWithFreshToken();
        }
    });

    nextSocket.on("new-notification", notifySubscribers);

    return nextSocket;
}

function getSocketUrl() {
    if (!API_URL || API_URL.startsWith("/")) {
        return window.location.origin;
    }
    return API_URL;
}

function getSocketTransports() {
    const configuredTransports = import.meta.env.VITE_SOCKET_TRANSPORTS;
    if (configuredTransports) {
        return configuredTransports
            .split(",")
            .map(transport => transport.trim())
            .filter(Boolean);
    }
    return import.meta.env.PROD ? ["websocket"] : ["websocket", "polling"];
}

export const SocketService = {
    connect(token = AuthService.getAccessToken()) {
        if (!token) return null;
        if (!socket) {
            socket = createSocket();
        }

        socket.auth = { token };
        if (socket.connected) {
            manualDisconnect = true;
            socket.disconnect();
            setTimeout(() => {
                manualDisconnect = false;
            }, 0);
        }
        lastAuthFailureCode = null;
        socket.connect();
        return socket;
    },

    disconnect() {
        if (socket) {
            manualDisconnect = true;
            socket.disconnect();
            setTimeout(() => {
                manualDisconnect = false;
            }, 0);
        }
    },

    subscribeToNotifications(callback) {
        notificationSubscribers.add(callback);
        return () => {
            notificationSubscribers.delete(callback);
        };
    },
};
