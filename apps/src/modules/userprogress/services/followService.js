const UserProgressRepository = require('../repositories/userprogressRepository');
const { invalidateUserProgressCache } = require('../utils/cacheHelper');

class FollowService {
    constructor() {
        this.userProgressRepository = new UserProgressRepository();
    }

    async followUser(currentUserId, targetUserId) {
        await this.userProgressRepository.followUser(currentUserId, targetUserId);
        await invalidateUserProgressCache();
    }

    async unfollowUser(currentUserId, targetUserId) {
        await this.userProgressRepository.unfollowUser(currentUserId, targetUserId);
        await invalidateUserProgressCache();
    }

    async isFollowing(currentUserId, targetUserId) {
        return await this.userProgressRepository.isFollowing(currentUserId, targetUserId);
    }

    async getFollowersCount(userId) {
        return await this.userProgressRepository.getFollowersCount(userId);
    }

    async getFollowingCount(userId) {
        return await this.userProgressRepository.getFollowingCount(userId);
    }

    async getFollowersList(userId) {
        return await this.userProgressRepository.getFollowersList(userId);
    }

    async getFollowingList(userId) {
        return await this.userProgressRepository.getFollowingList(userId);
    }
}

module.exports = FollowService;