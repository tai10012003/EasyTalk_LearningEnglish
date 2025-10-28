const { ObjectId } = require("mongodb");
const { UserSettingRepository } = require("./../repositories");
const UserSetting = require("./../entities/usersetting");

class UserSettingService {
    constructor() {
        this.userSettingRepository = new UserSettingRepository();
    }

    async getUserSettingByUserId(userId) {
        let setting = await this.userSettingRepository.findByUserId(userId);
        if (!setting) {
            const defaultSetting = new UserSetting({
                user: new ObjectId(userId)
            });
            await this.userSettingRepository.insert(defaultSetting);
            return defaultSetting;
        }
        return setting;
    }

    async updateUserSetting(userId, updateData) {
        return await this.userSettingRepository.update(userId, updateData);
    }

    async updateSection(userId, section, data) {
        if (!["interface", "general", "security", "notifications"].includes(section)) {
            throw new Error("Invalid setting section");
        }
        return await this.userSettingRepository.update(
            userId,
            { [section]: data }
        );
    }

    async getUserLanguage(userId) {
        const setting = await this.userSettingRepository.findByUserId(userId);
        if (setting && setting.general && setting.general.language) {
            return setting.general.language;
        }
        return "vi";
    }

    async deleteUserSetting(userId) {
        return await this.userSettingRepository.delete(userId);
    }
}

module.exports = UserSettingService;