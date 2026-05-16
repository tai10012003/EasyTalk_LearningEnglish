const { ObjectId } = require("mongodb");
const UserSettingRepository = require("../repositories/usersettingRepository");
const UserSetting = require("../models/usersetting");
const { getDefaultSettings } = require("../utils/defaultSettings");

class UserSettingService {
    constructor() {
        this.repository = new UserSettingRepository();
    }

    async getUserSettingByUserId(userId) {
        let setting = await this.repository.findByUserId(userId);
        if(!setting) {
            const defaultSetting = getDefaultSettings(new ObjectId(userId));
            await this.repository.insert(defaultSetting);
            return defaultSetting;
        }
        return setting;
    }

    async updateUserSetting(userId, updateData) {
        return await this.repository.update(userId, updateData);
    }

    async updateSection(userId, section, data) {
        const validSections = UserSetting.getSectionNames();
        if(!validSections.includes(section)) {
            throw new Error("Invalid setting section");
        }
        return await this.repository.update(userId,{ [section]: data });
    }

    async getUserLanguage(userId) {
        const setting = await this.repository.findByUserId(userId);
        if(setting && setting.general && setting.general.language) {
            return setting.general.language;
        }
        return "vi";
    }

    async deleteUserSetting(userId) {
        return await this.repository.delete(userId);
    }
}

module.exports = UserSettingService;