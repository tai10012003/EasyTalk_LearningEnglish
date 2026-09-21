const { ObjectId } = require("mongodb");
const UserSettingRepository = require("../repositories/usersettingRepository");
const UserSetting = require("../models/usersetting");
const { getDefaultSettings } = require("../utils/defaultSettings");

class UserSettingService {
    constructor(deps = {}) {
        this.repository = deps.repository || new UserSettingRepository();
    }

    sanitizeSettingsUpdate(updateData = {}) {
        if(!updateData.general || !Object.prototype.hasOwnProperty.call(updateData.general, "language")) {
            return updateData;
        }
        const { language, ...general } = updateData.general;
        return {
            ...updateData,
            general
        };
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
        return await this.repository.update(userId, this.sanitizeSettingsUpdate(updateData));
    }

    async updateSection(userId, section, data) {
        const validSections = UserSetting.getSectionNames();
        if(!validSections.includes(section)) {
            throw new Error("Invalid setting section");
        }
        const sanitizedData = section === "general"
            ? this.sanitizeSettingsUpdate({ general: data }).general
            : data;
        return await this.repository.update(userId,{ [section]: sanitizedData });
    }

    async deleteUserSetting(userId) {
        return await this.repository.delete(userId);
    }
}

module.exports = UserSettingService;