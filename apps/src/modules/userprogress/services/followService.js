const UserProgressRepository = require('../repositories/userprogressRepository');
const { invalidateUserProgressCaches } = require('../utils/cacheHelper');

class FollowService {
    constructor(deps = {}) {
        this.userProgressRepository = deps.repository || new UserProgressRepository();
    }

    async followUser(currentUserId, targetUserId) {
        await this.userProgressRepository.followUser(currentUserId, targetUserId);
        await invalidateUserProgressCaches([currentUserId, targetUserId]);
    }

    async unfollowUser(currentUserId, targetUserId) {
        await this.userProgressRepository.unfollowUser(currentUserId, targetUserId);
        await invalidateUserProgressCaches([currentUserId, targetUserId]);
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
