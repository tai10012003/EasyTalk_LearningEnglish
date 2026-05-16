const UserProgressRepository = require('../repositories/userprogressRepository');
const NotificationService = require('../../notification/services/notificationService');
const PrizeService = require('../../prize/services/prizeService');
const { calculatePerfectStreak } = require('../utils/streakCalculator');
const { invalidateUserProgressCache } = require('../utils/cacheHelper');
const { getVietnamDate } = require('../../../shared/utils/dateFormat');

const prizeService = new PrizeService();

class UserPrizeService {
    constructor() {
        this.userProgressRepository = new UserProgressRepository();
        this.notificationService = new NotificationService();
        this.userProgressService = null;
    }

    setUserProgressService(userProgressService) {
        this.userProgressService = userProgressService;
    }

    async checkAndUnlockNonChampionPrizes(userId) {
        const userProgress = await this.userProgressRepository.findByUserId(userId);
        if(!userProgress) return { newPrizes: [], totalUnlocked: 0 };
        const allPrizes = await prizeService.getAllPrizes();
        const newlyUnlocked = [];
        for(const prize of allPrizes) {
            if(['champion_week', 'champion_month', 'champion_year'].includes(prize.type)) continue;
            if(await this.userProgressRepository.hasUnlockedPrize(userId, prize.code)) continue;
            let shouldUnlock = false;
            switch(prize.type) {
                case 'perfect_streak':
                    shouldUnlock = await this._checkPerfectStreak(userProgress, prize);
                    break;
                case 'knowledge_god':
                    shouldUnlock = await this._checkKnowledgeGod(userProgress, prize);
                    break;
            }
            if(shouldUnlock) {
                await this.userProgressRepository.unlockPrize(userId, prize._id, prize.code, prize.level);
                newlyUnlocked.push(prize);
                await this._sendPrizeNotification(userId, prize, prize.championType);
                const diamondsReward = prize.diamondAwards || 0;
                if(diamondsReward > 0) {
                    await this._addDiamonds(userId, diamondsReward);
                    await this.notificationService.createNotification(userId, "NHẬN KIM CƯƠNG THÀNH TỰU!", `Chúc mừng bạn nhận ${diamondsReward} kim cương từ thành tựu "${prize.name}"!`, "achieve", "/shop");
                }
            }
        }
        await invalidateUserProgressCache();
        return { newPrizes: newlyUnlocked, totalUnlocked: newlyUnlocked.length };
    }

    async checkAndUnlockChampionPrizes(userId) {
        const userProgress = await this.userProgressRepository.findByUserId(userId);
        if(!userProgress) return { newPrizes: [], totalUnlocked: 0 };
        const allPrizes = await prizeService.getAllPrizes();
        const championPrizes = allPrizes.filter(p =>['champion_week', 'champion_month', 'champion_year'].includes(p.type));
        const newlyUnlocked = [];
        const now = this._getVnNow();
        for(const prize of championPrizes) {
            let periodToCheck = null;
            if(prize.type === 'champion_week') {
                periodToCheck = this._getLastCompletedWeekPeriod(now);
            } else if(prize.type === 'champion_month') {
                periodToCheck = this._getLastCompletedMonthPeriod(now);
            } else if(prize.type === 'champion_year') {
                periodToCheck = this._getLastCompletedYearPeriod(now);
            }
            if(!periodToCheck) continue;
            const alreadyUnlocked = userProgress.unlockedPrizes?.some(up => up.code === prize.code && up.period === periodToCheck);
            if(alreadyUnlocked) continue;
            let isChampion = false;
            if(prize.type === 'champion_week') {
                isChampion = await this._checkChampionWeek(userId, prize, periodToCheck);
            } else if(prize.type === 'champion_month') {
                isChampion = await this._checkChampionMonth(userId, prize, periodToCheck);
            } else if(prize.type === 'champion_year') {
                isChampion = await this._checkChampionYear(userId, prize, periodToCheck);
            }
            if(isChampion) {
                await this.userProgressRepository.unlockPrize(userId, prize._id, prize.code, prize.level, periodToCheck);
                newlyUnlocked.push({ ...prize, period: periodToCheck });
                await this._sendPrizeNotification(userId, prize, prize.championType);
                const diamondsReward = prize.diamondAwards || 0;
                if (diamondsReward > 0) {
                    await this._addDiamonds(userId, diamondsReward);
                    await this.notificationService.createNotification(userId, "NHẬN KIM CƯƠNG QUÁN QUÂN!", `Chúc mừng bạn nhận ${diamondsReward} kim cương từ danh hiệu ${prize.name || 'Quán quân'}!`, "achieve", "/shop");
                }
            }
        }
        await invalidateUserProgressCache();
        return { newPrizes: newlyUnlocked, totalUnlocked: newlyUnlocked.length };
    }

    async getUserPrizesWithDetails(userId) {
        const unlockedPrizes = await this.userProgressRepository.getUserPrizes(userId);
        const allPrizes = await prizeService.getAllPrizes();
        return unlockedPrizes.map(up => {
            const prizeDetail = allPrizes.find(p => p.code === up.code);
            return {
                ...up,
                name: prizeDetail?.name,
                type: prizeDetail?.type,
                iconClass: prizeDetail?.iconClass,
                requirement: prizeDetail?.requirement
            };
        });
    }

    async getChampionStats(userId) {
        const userProgress = await this.userProgressRepository.findByUserId(userId);
        if(!userProgress?.unlockedPrizes || userProgress.unlockedPrizes.length === 0) {
            return { week: 0, month: 0, year: 0, total: 0 };
        }
        let week = 0, month = 0, year = 0;
        userProgress.unlockedPrizes.forEach(p => {
            if(p.code.includes('CHAMPION_WEEK')) week++;
            else if(p.code.includes('CHAMPION_MONTH')) month++;
            else if(p.code.includes('CHAMPION_YEAR')) year++;
        });
        return { week, month, year, total: week + month + year };
    }

    async manuallyCheckChampionPrizes(userId) {
        return await this.checkAndUnlockChampionPrizes(userId);
    }

    async manuallyCheckChampionPrizesForAll() {
        if(!this.userProgressService) {
            console.error('UserProgressService not injected into UserPrizeService');
            return [];
        }
        const { userprogresses } = await this.userProgressService.getUserProgressList(1, 1000);
        const results = [];
        for(const p of userprogresses) {
            try {
                const result = await this.checkAndUnlockChampionPrizes(p.user.toString());
                if(result.newPrizes.length > 0) {
                    results.push({ userId: p.user.toString(), prizes: result.newPrizes });
                }
            } catch(err) {
                console.error(`Lỗi user ${p.user}:`, err);
            }
        }
        return results;
    }

    async _checkPerfectStreak(userProgress, prize) {
        const perfectStreak = calculatePerfectStreak(userProgress.studyDates, getVietnamDate());
        return perfectStreak >= prize.requirement.streakDays;
    }

    async _checkKnowledgeGod(userProgress, prize) {
        return (userProgress.experiencePoints || 0) >= prize.requirement.xp;
    }

    async _checkChampionWeek(userId, prize, periodKey) {
        const [expLeaderboard, timeLeaderboard] = await Promise.all([
            this.userProgressRepository.getLeaderboardByExp('week', 50, periodKey),
            this.userProgressRepository.getLeaderboardByStudyTime('week', 50, periodKey)
        ]);
        if(!expLeaderboard.length && !timeLeaderboard.length) return false;
        const topExpScore = expLeaderboard[0]?.value ?? 0;
        const topTimeScore = timeLeaderboard[0]?.value ?? 0;
        const topExpUserIds = expLeaderboard.filter(u => u.value === topExpScore).map(u => u._id.toString());
        const topTimeUserIds = timeLeaderboard.filter(u => u.value === topTimeScore).map(u => u._id.toString());
        const userIdStr = userId.toString();
        const isTopExp = topExpUserIds.includes(userIdStr);
        const isTopTime = topTimeUserIds.includes(userIdStr);
        const meetsMinExp = topExpScore >= 100;
        const meetsMinTime = topTimeScore >= 0.333;
        const validExp = isTopExp && meetsMinExp;
        const validTime = isTopTime && meetsMinTime;
        if(validExp && validTime) prize.championType = "both";
        else if(validExp) prize.championType = "exp";
        else if(validTime) prize.championType = "time";
        return validExp || validTime;
    }

    async _checkChampionMonth(userId, prize, periodKey) {
        const [expLeaderboard, timeLeaderboard] = await Promise.all([
            this.userProgressRepository.getLeaderboardByExp('month', 50, periodKey),
            this.userProgressRepository.getLeaderboardByStudyTime('month', 50, periodKey)
        ]);
        if(!expLeaderboard.length && !timeLeaderboard.length) return false;
        const topExpScore = expLeaderboard[0]?.value ?? 0;
        const topTimeScore = timeLeaderboard[0]?.value ?? 0;
        const topExpUserIds = expLeaderboard.filter(u => u.value === topExpScore).map(u => u._id.toString());
        const topTimeUserIds = timeLeaderboard.filter(u => u.value === topTimeScore).map(u => u._id.toString());
        const userIdStr = userId.toString();
        const isTopExp = topExpUserIds.includes(userIdStr);
        const isTopTime = topTimeUserIds.includes(userIdStr);
        const meetsMinExp = topExpScore >= 400;
        const meetsMinTime = topTimeScore >= 1;
        const validExp = isTopExp && meetsMinExp;
        const validTime = isTopTime && meetsMinTime;
        if(validExp && validTime) prize.championType = "both";
        else if(validExp) prize.championType = "exp";
        else if(validTime) prize.championType = "time";
        return validExp || validTime;
    }

    async _checkChampionYear(userId, prize, periodKey) {
        const [expLeaderboard, timeLeaderboard] = await Promise.all([
            this.userProgressRepository.getLeaderboardByExp('year', 50, periodKey),
            this.userProgressRepository.getLeaderboardByStudyTime('year', 50, periodKey)
        ]);
        if(!expLeaderboard.length && !timeLeaderboard.length) return false;
        const topExpScore = expLeaderboard[0]?.value ?? 0;
        const topTimeScore = timeLeaderboard[0]?.value ?? 0;
        const topExpUserIds = expLeaderboard.filter(u => u.value === topExpScore).map(u => u._id.toString());
        const topTimeUserIds = timeLeaderboard.filter(u => u.value === topTimeScore).map(u => u._id.toString());
        const userIdStr = userId.toString();
        const isTopExp = topExpUserIds.includes(userIdStr);
        const isTopTime = topTimeUserIds.includes(userIdStr);
        const meetsMinExp = topExpScore >= 2000;
        const meetsMinTime = topTimeScore >= 8;
        const validExp = isTopExp && meetsMinExp;
        const validTime = isTopTime && meetsMinTime;
        if(validExp && validTime) prize.championType = "both";
        else if(validExp) prize.championType = "exp";
        else if(validTime) prize.championType = "time";
        return validExp || validTime;
    }

    async _sendPrizeNotification(userId, prize, championType = null) {
        let title = "";
        let message = "";
        let type = "achieve";
        let link = "http://localhost:5173/statistic";
        switch(prize.type) {
            case "perfect_streak":
                const streakDays = prize.requirement.streakDays;
                const level = prize.level;
                if(level === 10) {
                    title = "365 NGÀY HOÀN HẢO – BẠN LÀ HUYỀN THOẠI!";
                    message = `Chúc mừng bạn đã duy trì 365 ngày học liên tục không bỏ sót! Bạn chính thức là VUA CỦA SỰ KỶ LUẬT tại EasyTalk! Cả cộng đồng đang cúi đầu thán phục!`;
                } else if(level >= 7) {
                    title = `TUẦN HOÀN HẢO CẤP ${level} – BẠN LÀ SIÊU NHÂN!`;
                    message = `Đã ${streakDays} ngày không bỏ lỡ một buổi học nào! Bạn đang viết nên một hành trình mà 99% người khác chỉ biết mơ ước!`;
                } else if(level >= 4) {
                    title = `TUẦN HOÀN HẢO CẤP ${level} – ĐẲNG CẤP ĐÃ LÊN TIẾNG!`;
                    message = `${streakDays} ngày liên tục – bạn không chỉ học, bạn đang sống cùng tiếng Anh mỗi ngày!`;
                } else {
                    title = `TUẦN HOÀN HẢO CẤP ${level} – XUẤT SẮC!`;
                    message = `Đã duy trì ${streakDays} ngày học không gián đoạn! Bạn đang tiến rất gần đến ngôi đền của những huyền thoại!`;
                }
                break;
            case "knowledge_god":
                const xpNeeded = prize.requirement.xp.toLocaleString('vi-VN');
                if(prize.level === 10) {
                    title = "VỊ THẦN KIẾN THỨC CẤP 10 – BẠN LÀ THẦN THOẠI!";
                    message = `100.000 XP đã thuộc về bạn! Bạn không còn là học viên nữa – bạn là một hiện tượng của EasyTalk! Cả hệ thống đang rung chuyển vì sự chăm chỉ của bạn!`;
                } else if(prize.level >= 7) {
                    title = `VỊ THẦN KIẾN THỨC CẤP ${prize.level} – ĐỈNH CAO MỚI!`;
                    message = `Đạt ${xpNeeded} XP – bạn đã vượt qua hàng ngàn người để đứng trong top những bộ óc xuất sắc nhất!`;
                } else {
                    title = `VỊ THẦN KIẾN THỨC CẤP ${prize.level} – ĐANG THĂNG HOA!`;
                    message = `Chúc mừng đạt mốc ${xpNeeded} XP! Bạn đang tiến gần hơn đến ngôi vị tối thượng của tri thức!`;
                }
                break;
            case "champion_week":
                if(championType === "exp") {
                    title = "QUÁN QUÂN TUẦN – VUA ĐIỂM SỐ!";
                    message = `TUẦN QUA BẠN LÀ NGƯỜI HỌC HIỆU QUẢ NHẤT! Với số điểm kinh nghiệm cao nhất, bạn chính thức là QUÁN QUÂN TUẦN về KIẾN THỨC! Cúp vàng thuộc về bạn!`;
                } else if(championType === "time") {
                    title = "QUÁN QUÂN TUẦN – VUA THỜI GIAN!";
                    message = `TUẦN QUA BẠN LÀ NGƯỜI CHĂM CHỈ NHẤT! Với thời gian học dài nhất, bạn chính thức là QUÁN QUÂN TUẦN về SỰ KIÊN TRÌ! Cúp vàng thuộc về bạn!`;
                } else if(championType === "both") {
                    title = "QUÁN QUÂN TUẦN TUYỆT ĐỐI – BẠN LÀ HUYỀN THOẠI!";
                    message = `BẠN ĐÃ LÀM NÊN LỊCH SỬ! Top 1 cả điểm số lẫn thời gian học – bạn không chỉ giỏi, bạn còn siêu chăm chỉ! CẢ HAI CÚP VÀNG TUẦN NÀY ĐỀU THUỘC VỀ BẠN!`;
                }
                type = "champion";
                break;
            case "champion_month":
                if(championType === "exp") {
                    title = "QUÁN QUÂN THÁNG – ĐẾ VƯƠNG KIẾN THỨC!";
                    message = `THÁNG NÀY BẠN LÀ NGƯỜI XUẤT SẮC NHẤT về điểm kinh nghiệm! Không ai vượt qua được bạn về hiệu quả học tập! Cúp tháng vàng ròng đã có chủ!`;
                } else if(championType === "time") {
                    title = "QUÁN QUÂN THÁNG – ĐẾ VƯƠNG KIÊN TRÌ!";
                    message = `THÁNG NÀY BẠN LÀ NGƯỜI CHĂM CHỈ NHẤT với thời gian học dài nhất! Sự kiên trì của bạn đã được đền đáp xứng đáng! Cúp tháng thuộc về bạn!`;
                } else if(championType === "both") {
                    title = "QUÁN QUÂN THÁNG TUYỆT ĐỐI – BẠN LÀ THẦN THOẠI!";
                    message = `THÁNG NÀY BẠN LÀ SỐ 1 TUYỆT ĐỐI! Top 1 cả điểm số lẫn thời gian – bạn chính là hình mẫu hoàn hảo mà mọi học viên mơ ước! CẢ HAI CÚP THÁNG ĐỀU LÀ CỦA BẠN!`;
                }
                type = "champion";
                break;
            case "champion_year":
                if(championType === "exp") {
                    title = "QUÁN QUÂN NĂM – THẦN KIẾN THỨC!";
                    message = `CẢ NĂM QUA, BẠN LÀ NGƯỜI HỌC HIỆU QUẢ NHẤT TOÀN HỆ THỐNG! Với tổng điểm kinh nghiệm cao nhất, tên bạn sẽ được khắc vào ngôi đền danh vọng vĩnh viễn!`;
                } else if(championType === "time") {
                    title = "QUÁN QUÂN NĂM – THẦN KIÊN TRÌ!";
                    message = `CẢ NĂM QUA, BẠN LÀ NGƯỜI CHĂM CHỈ NHẤT TOÀN HỆ THỐNG! Với thời gian học dài nhất, bạn xứng đáng là biểu tượng của sự bền bỉ!`;
                } else if(championType === "both") {
                    title = "QUÁN QUÂN NĂM TUYỆT ĐỐI – BẠN LÀ HUYỀN THOẠI SỐNG!";
                    message = `BẠN ĐÃ VIẾT NÊN LỊCH SỬ EASY TALK! Top 1 cả điểm số lẫn thời gian trong cả năm – bạn không chỉ giỏi, bạn là HOÀN HẢO! TÊN BẠN SẼ ĐƯỢC KHẮC VÀNG MÃI MÃI!`;
                }
                type = "champion";
                break;
        }
        try {
            await this.notificationService.createNotification(userId, title, message, type, link);
        } catch(err) {
            console.error("Lỗi gửi thông báo thành tựu:", err);
        }
    }

    async _addDiamonds(userId, amount) {
        if(amount <= 0) return false;
        const result = await this.userProgressRepository.update(userId, {
            $inc: { diamonds: amount }
        });
        return result.modifiedCount > 0 || result.upsertedCount > 0;
    }

    _getVnNow() {
        return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    }

    _getLastCompletedWeekPeriod(now) {
        const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const year = vnDate.getFullYear();
        const month = vnDate.getMonth();
        const date = vnDate.getDate();
        const dayOfWeek = vnDate.getDay();
        let representativeDate = new Date(year, month, date);
        if(dayOfWeek === 0) {
            representativeDate.setDate(date - 7 - 3);
        } else {
            representativeDate.setDate(date - dayOfWeek - 3);
        }
        const startOfYear = new Date(representativeDate.getFullYear(), 0, 1);
        const daysSinceStartOfYear = Math.floor((representativeDate - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.floor(daysSinceStartOfYear / 7) + 1;
        return `${representativeDate.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
    }

    _getLastCompletedMonthPeriod(now) {
        const year = now.getFullYear();
        const month = now.getMonth();
        if(month == 0) {
            return `${year - 1}-12`;
        }
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    _getLastCompletedYearPeriod(now) {
        const year = now.getFullYear();
        const month = now.getMonth();
        if(month === 0) {
            return `${year - 1}`;
        }
        return null;
    }
}

module.exports = UserPrizeService;