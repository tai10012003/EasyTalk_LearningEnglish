const DEFAULT_SETTINGS = {
    interface: {
        theme: "light",
        fontSize: 14,
        fontFamily: "Roboto"
    },
    general: {
        timezone: "Asia/Ho_Chi_Minh",
        dateFormat: "DD/MM/YYYY"
    },
    security: {
        twoFA: false,
        googleLogin: true
    },
    notifications: {
        email: true,
        push: true,
        promo: false,
        reminder: true,
        info: true,
        success: true,
        warning: true,
        system: true,
        update: true
    }
};

function getDefaultSettings(userId) {
    return {
        user: userId,
        ...DEFAULT_SETTINGS
    };
}

module.exports = { DEFAULT_SETTINGS, getDefaultSettings };