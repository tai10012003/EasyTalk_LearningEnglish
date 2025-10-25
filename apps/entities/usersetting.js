class UserSetting {
    _id;
    user;

    interface = {
        theme: "light",
        fontSize: 14,
        fontFamily: "Roboto"
    };

    general = {
        language: "vi",
        timezone: "Asia/Ho_Chi_Minh",
        dateFormat: "DD/MM/YYYY"
    };

    security = {
        twoFA: false,
        googleLogin: true
    };

    notifications = {
        email: true,
        push: true,
        promo: false,
        reminder: true,
        info: true,
        success: true,
        warning: true,
        system: true,
        update: true
    };

    constructor(init = {}) {
        Object.assign(this, init);
    }
}

module.exports = UserSetting;