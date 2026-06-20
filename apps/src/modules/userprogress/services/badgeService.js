const UserProgressRepository = require('../repositories/userprogressRepository');
const { calculateStreak } = require('../utils/streakCalculator');
const { invalidateUserProgressCache } = require('../utils/cacheHelper');
const { getVietnamDate } = require('../../../shared/utils/dateFormat');

const BADGES = [
    { name: "Tân binh chăm chỉ", threshold: 1000, xp: 300 },
    { name: "Chiến binh ngôn từ", threshold: 3000, xp: 900 },
    { name: "Bậc thầy từ vựng", threshold: 6000, xp: 2500 },
    { name: "Huyền thoại ôn tập", threshold: 10000, xp: 5000 },
    { name: "Vua từ vựng", threshold: 15000, xp: 9000 },
];

class BadgeService {
    constructor(deps = {}) {
        this.userProgressRepository = deps.repository || new UserProgressRepository();
        this.userPrizeService = deps.userPrizeService || null;
    }

    setUserPrizeService(userPrizeService) {
        this.userPrizeService = userPrizeService;
    }

    async getDailyFlashcardGoal(userId) {
        return await this.userProgressRepository.getDailyGoal(userId);
    }

    async updateDailyFlashcardGoal(userId, goal) {
        if(goal < 0 || goal > 200) throw new Error("Goal must be between 0 and 200");
        const result = await this.userProgressRepository.updateDailyGoal(userId, goal);
        await invalidateUserProgressCache();
        return result;
    }

    async getMonthlyBadgesStatus(userId) {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyTotal = await this.userProgressRepository.getMonthlyReviewTotal(userId, monthYear);
        const unlocked = await this.userProgressRepository.getUnlockedBadgesForMonth(userId, monthYear);
        const status = BADGES.map(b => ({
            ...b,
            unlocked: unlocked.includes(b.name) || monthlyTotal >= b.threshold
        }));
        return { monthYear, monthlyTotal, status };
    }

    async incrementDailyFlashcardReview(userId, count = 1) {
        const todayStr = getVietnamDate();
        const userProgress = await this.userProgressRepository.findByUserId(userId);
        if(!userProgress) throw new Error("User progress not found");
        const goal = userProgress?.dailyFlashcardGoal || 20;
        const prevTodayCount = userProgress?.dailyFlashcardReviews?.[todayStr] || 0;
        const todayCount = prevTodayCount + count;
        const updateOp = { $inc: { [`dailyFlashcardReviews.${todayStr}`]: count } };
        let studyDates = (userProgress.studyDates || []).map(d => {
            if(d instanceof Date) {
                return getVietnamDate(d);
            }
            return typeof d === 'string' ? d : null;
        }).filter(Boolean);
        const hadToday = studyDates.includes(todayStr);
        if(!hadToday) {
            studyDates.push(todayStr);
        }
        const { currentStreak, tempMaxStreak } = calculateStreak(studyDates, todayStr);
        const maxStreak = Math.max(userProgress.maxStreak || 0, tempMaxStreak);
        updateOp.$set = {
            studyDates,
            streak: currentStreak,
            maxStreak
        };
        let expBonus = 0;
        const expFromGoal = this._calculateExpBonus(goal, prevTodayCount, todayCount);
        if(expFromGoal > 0) {
            updateOp.$inc.experiencePoints = (updateOp.$inc.experiencePoints || 0) + expFromGoal;
            expBonus += expFromGoal;
        }
        const badgeResult = await this._handleBadgeUnlock(userId);
        if(badgeResult.totalXp > 0) {
            updateOp.$inc.experiencePoints = (updateOp.$inc.experiencePoints || 0) + badgeResult.totalXp;
            expBonus += badgeResult.totalXp;
        }
        const result = await this.userProgressRepository.update(userId, updateOp, true);
        let nonChampionResult = { newPrizes: [] };
        if(this.userPrizeService) {
            nonChampionResult = await this.userPrizeService.checkAndUnlockNonChampionPrizes(userId);
        }
        await invalidateUserProgressCache();
        return {
            ...result,
            expBonus,
            todayCount,
            goal,
            streak: currentStreak,
            maxStreak,
            studyDates,
            monthlyTotal: badgeResult.monthlyTotal,
            unlockedBadges: badgeResult.unlockedBadges,
            unlockedPrizes: nonChampionResult.newPrizes || []
        };
    }

    _calculateExpBonus(goal, prevCount, newCount) {
        if (newCount >= goal && prevCount < goal) {
            if(goal <= 20) return 10;
            if(goal <= 70) return 20;
            if(goal <= 130) return 30;
            return 50;
        }
        return 0;
    }

    async _handleBadgeUnlock(userId) {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyTotal = await this.userProgressRepository.getMonthlyReviewTotal(userId, monthYear);
        const unlockedBadges = await this.userProgressRepository.getUnlockedBadgesForMonth(userId, monthYear);
        let totalXp = 0;
        const newlyUnlocked = [];
        for(const badge of BADGES) {
            if(monthlyTotal >= badge.threshold && !unlockedBadges.includes(badge.name)) {
                await this.userProgressRepository.unlockBadge(userId, monthYear, badge.name);
                totalXp += badge.xp;
                newlyUnlocked.push(badge.name);
            }
        }
        return { monthlyTotal, totalXp, unlockedBadges: newlyUnlocked };
    }
}

module.exports = BadgeService;