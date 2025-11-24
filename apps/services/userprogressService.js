const { ObjectId } = require('mongodb');
const { getRedisClient } = require("../util/redisClient");
const { getVietnamDate, getYesterdayVietnamDate } = require('../util/dateFormat');
const { UserprogressRepository } = require('./../repositories');
const GrammarService = require('./grammarService');
const StoryService = require('./storyService');
const PronunciationService = require('./pronunciationService');
const GrammarexerciseService = require('./grammarexerciseService');
const PronunciationexerciseService = require('./pronunciationexerciseService');
const VocabularyexerciseService = require('./vocabularyexerciseService');
const DictationService = require('./dictationService');
const PrizeService = require('./prizeService');
const NotificationService = require("./notificationService");
const prizeService = new PrizeService();
// const cron = require('node-cron');

const BADGES = [
    { name: "Tân binh chăm chỉ", threshold: 1000, xp: 300 },
    { name: "Chiến binh ngôn từ", threshold: 3000, xp: 900 },
    { name: "Bậc thầy từ vựng", threshold: 6000, xp: 2500 },
    { name: "Huyền thoại ôn tập", threshold: 10000, xp: 5000 },
    { name: "Vua từ vựng", threshold: 15000, xp: 9000 },
];

class UserprogressService {
    constructor() {
        this.userprogressRepository = new UserprogressRepository();
        this.notificationService = new NotificationService();
        // this._initCronJobs();
    }

    // _initCronJobs() {
    //     cron.schedule('1 0 * * 1', async () => {
    //         console.log('[Cron] Trao giải quán quân tuần trước...');
    //         const { userprogresses } = await this.getUserProgressList(1, 1000);
    //         for (const p of userprogresses) {
    //             try {
    //                 await this.checkAndUnlockChampionPrizes(p.user.toString());
    //             } catch (err) {
    //                 console.error(`Lỗi user ${p.user}:`, err);
    //             }
    //         }
    //     });
    //     cron.schedule('1 0 1 * *', async () => {
    //         console.log('[Cron] Trao giải quán quân tháng trước...');
    //         const { userprogresses } = await this.getUserProgressList(1, 1000);
    //         for (const p of userprogresses) {
    //             try {
    //                 await this.checkAndUnlockChampionPrizes(p.user.toString());
    //             } catch (err) {
    //                 console.error(`Lỗi user ${p.user}:`, err);
    //             }
    //         }
    //     });
    //     cron.schedule('1 0 1 1 *', async () => {
    //         console.log('[Cron] Trao giải quán quân năm trước...');
    //         const { userprogresses } = await this.getUserProgressList(1, 1000);
    //         for (const p of userprogresses) {
    //             try {
    //                 await this.checkAndUnlockChampionPrizes(p.user.toString());
    //             } catch (err) {
    //                 console.error(`Lỗi user ${p.user}:`, err);
    //             }
    //         }
    //     });
    // }

    async getUserProgressList(page = 1, limit = 12, search = "", role = "user") {
        const redis = getRedisClient();
        const cacheKey = `userprogress:list:page=${page}:limit=${limit}:search=${search}:role=${role}`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.error("Cache get error:", err);
        }
        const skip = (page - 1) * limit;
        const filter = {};
        if (search) {
            const db = this.userprogressRepository.db;
            const users = await db.collection("users").find({ username: { $regex: search, $options: "i" } }).project({ _id: 1 }).toArray();
            filter.user = { $in: users.map(u => u._id) };
        }
        const { userprogresses, total } = await this.userprogressRepository.findAll(filter, skip, limit);
        const result = { userprogresses, totalUserProgresses: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
        } catch (err) {
            console.error("Cache set error:", err);
        }
        return result;
    }

    async getUserProgress(id) {
        return await this.userprogressRepository.findUserProgressById(id);
    }

    async getLeaderboard(type = 'exp', period = 'all', limit = 50) {
        if (type === 'exp') return await this.userprogressRepository.getLeaderboardByExp(period, limit);
        if (type === 'time') return await this.userprogressRepository.getLeaderboardByStudyTime(period, limit);
        if (type === 'streak') return await this.userprogressRepository.getLeaderboardByStreak(limit);
    }

    async getUserStatistics(userId, type = 'time', period = 'week') {
        return await this.userprogressRepository.getUserStatistics(userId, type, period);
    }

    async getDailyFlashcardGoal(userId) {
        return await this.userprogressRepository.getDailyGoal(userId);
    }

    async updateDailyFlashcardGoal(userId, goal) {
        if (goal < 0 || goal > 200) throw new Error("Goal must be between 0 and 200");
        const result = await this.userprogressRepository.updateDailyGoal(userId, goal);
        await this._invalidateCache();
        return result;
    }

    async getMonthlyBadgesStatus(userId) {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyTotal = await this.userprogressRepository.getMonthlyReviewTotal(userId, monthYear);
        const unlocked = await this.userprogressRepository.getUnlockedBadgesForMonth(userId, monthYear);
        const status = BADGES.map(b => ({
            ...b,
            unlocked: unlocked.includes(b.name) || monthlyTotal >= b.threshold
        }));
        return { monthYear, monthlyTotal, status };
    }

    async incrementDailyFlashcardReview(userId, count = 1) {
        const todayStr = getVietnamDate();
        const userProgress = await this.getUserProgressByUserId(userId);
        if (!userProgress) throw new Error("User progress not found");
        const goal = userProgress?.dailyFlashcardGoal || 20;
        const prevTodayCount = userProgress?.dailyFlashcardReviews?.[todayStr] || 0;
        const todayCount = prevTodayCount + count;
        const updateOp = { $inc: { [`dailyFlashcardReviews.${todayStr}`]: count } };
        let studyDates = (userProgress.studyDates || []).map(d => {
            if (d instanceof Date) {
                return getVietnamDate(d);
            }
            return typeof d === 'string' ? d : null;
        }).filter(Boolean);
        const hadToday = studyDates.includes(todayStr);
        if (!hadToday) {
            studyDates.push(todayStr);
        }
        const { currentStreak, tempMaxStreak } = this._calculateStreak(studyDates, todayStr);
        const maxStreak = Math.max(userProgress.maxStreak || 0, tempMaxStreak);
        updateOp.$set = {
            studyDates,
            streak: currentStreak,
            maxStreak
        };
        let expBonus = 0;
        const expFromGoal = this._calculateExpBonus(goal, prevTodayCount, todayCount);
        if (expFromGoal > 0) {
            updateOp.$inc.experiencePoints = (updateOp.$inc.experiencePoints || 0) + expFromGoal;
            expBonus += expFromGoal;
        }
        const badgeResult = await this._handleBadgeUnlock(userId);
        if (badgeResult.totalXp > 0) {
            updateOp.$inc.experiencePoints = (updateOp.$inc.experiencePoints || 0) + badgeResult.totalXp;
            expBonus += badgeResult.totalXp;
        }
        const result = await this.userprogressRepository.update(userId, updateOp, true);
        const nonChampionResult = await this.checkAndUnlockNonChampionPrizes(userId);
        await this._invalidateCache();
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
            if (goal <= 20) return 10;
            if (goal <= 70) return 20;
            if (goal <= 130) return 30;
            return 50;
        }
        return 0;
    }

    async _handleBadgeUnlock(userId) {
        const now = new Date();
        const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthlyTotal = await this.userprogressRepository.getMonthlyReviewTotal(userId, monthYear);
        const unlockedBadges = await this.userprogressRepository.getUnlockedBadgesForMonth(userId, monthYear);
        let totalXp = 0;
        const newlyUnlocked = [];
        for (const badge of BADGES) {
            if (monthlyTotal >= badge.threshold && !unlockedBadges.includes(badge.name)) {
                await this.userprogressRepository.unlockBadge(userId, monthYear, badge.name);
                totalXp += badge.xp;
                newlyUnlocked.push(badge.name);
            }
        }
        return { monthlyTotal, totalXp, unlockedBadges: newlyUnlocked };
    }

    async createUserProgress(userId, journey = null, initialStory = null, initialGrammar = null, initialPronunciation = null, initialGrammarExercise = null, initialPronunciationExercise = null, initialVocabularyExercise = null, initialDictation = null) {
        const grammarService = new GrammarService();
        const storyService = new StoryService();
        const pronunciationService = new PronunciationService();
        const grammarexerciseService = new GrammarexerciseService();
        const pronunciationexerciseService = new PronunciationexerciseService();
        const vocabularyexerciseService = new VocabularyexerciseService();
        const dictationService = new DictationService();
        const firstGate = journey?.gates?.[0]?._id || null;
        const firstStage = journey?.gates?.[0]?.stages?.[0]?._id || null;
        if (!initialStory || !initialGrammar || !initialPronunciation || !initialGrammarExercise || !initialPronunciationExercise || !initialVocabularyExercise || !initialDictation) {
            const [storyPage, grammarPage, pronPage, grammarExPage, pronunciationExPage, vocabularyExPage, dictationPage] = await Promise.all([
                !initialStory ? storyService.getStoryList(1, 1) : null,
                !initialGrammar ? grammarService.getGrammarList(1, 1) : null,
                !initialPronunciation ? pronunciationService.getPronunciationList(1, 1) : null,
                !initialGrammarExercise ? grammarexerciseService.getGrammarexerciseList(1, 1) : null,
                !initialPronunciationExercise ? pronunciationexerciseService.getPronunciationexerciseList(1, 1) : null,
                !initialVocabularyExercise ? vocabularyexerciseService.getVocabularyExerciseList(1, 1) : null,
                !initialDictation ? dictationService.getDictationList(1, 1) : null
            ]);
            initialStory = initialStory || storyPage?.stories?.[0]?._id || null;
            initialGrammar = initialGrammar || grammarPage?.grammars?.[0]?._id || null;
            initialPronunciation = initialPronunciation || pronPage?.pronunciations?.[0]?._id || null;
            initialGrammarExercise = initialGrammarExercise || grammarExPage?.grammarexercises?.[0]?._id || null;
            initialPronunciationExercise = initialPronunciationExercise || pronunciationExPage?.pronunciationexercises?.[0]?._id || null;
            initialVocabularyExercise = initialVocabularyExercise || vocabularyExPage?.vocabularyExercises?.[0]?._id || null;
            initialDictation = initialDictation || dictationPage?.dictationExercises?.[0]?._id || null;
        }
        const userProgress = {
            user: new ObjectId(userId),
            dailyFlashcardReviews: {},
            dailyFlashcardGoal: 20,
            unlockedFlashcardBadges: {},
            unlockedGates: firstGate ? [new ObjectId(firstGate)] : [],
            unlockedStages: firstStage ? [new ObjectId(firstStage)] : [],
            unlockedStories: initialStory ? [new ObjectId(initialStory)] : [],
            unlockedGrammars: initialGrammar ? [new ObjectId(initialGrammar)] : [],
            unlockedPronunciations: initialPronunciation ? [new ObjectId(initialPronunciation)] : [],
            unlockedGrammarExercises: initialGrammarExercise ? [new ObjectId(initialGrammarExercise)] : [],
            unlockedPronunciationExercises: initialPronunciationExercise ? [new ObjectId(initialPronunciationExercise)] : [],
            unlockedVocabularyExercises: initialVocabularyExercise ? [new ObjectId(initialVocabularyExercise)] : [],
            unlockedDictations: initialDictation ? [new ObjectId(initialDictation)] : [],
            studyTimes: 0,
            dailyStudyTimes: {},
            experiencePoints: 0,
            dailyExperiencePoints: {},
            unlockedPrizes: [],
            streak: 0,
            maxStreak: 0,
            studyDates: [],
        };
        await this.userprogressRepository.insert(userProgress);
        await this._invalidateCache();
        return userProgress;
    }

    async getUserProgressByUserId(userId) {
        return await this.userprogressRepository.findByUserId(userId);
    }

    async updateUserProgress(userProgress) {
        const normalize = (arr) =>
            Array.isArray(arr) ? [...new Set(arr)].map(id => new ObjectId(id)) : [];
        const fields = [
            "unlockedGates",
            "unlockedStages",
            "unlockedStories",
            "unlockedGrammars",
            "unlockedPronunciations",
            "unlockedGrammarExercises",
            "unlockedPronunciationExercises",
            "unlockedVocabularyExercises",
            "unlockedDictations",
        ];
        const normalizedData = Object.fromEntries(
            fields.map(field => [field, normalize(userProgress[field])])
        );
        const todayStr = getVietnamDate();
        let studyDates = (userProgress.studyDates || []).map(d => d instanceof Date ? getVietnamDate(d) : d).filter(Boolean);
        if (!studyDates.includes(todayStr)) studyDates.push(todayStr);
        const updateOp = { $set: {}, $inc: {} };
        const currentXP = await this.userprogressRepository.findByUserId(userProgress.user);
        const { currentStreak, tempMaxStreak } = this._calculateStreak(studyDates, todayStr);
        const maxStreak = Math.max(currentXP?.maxStreak || 0, tempMaxStreak);
        const xpDiff = (userProgress.experiencePoints || 0) - (currentXP?.experiencePoints || 0);
        if (xpDiff > 0) updateOp.$inc.experiencePoints = xpDiff;
        updateOp.$set = { ...normalizedData, streak: currentStreak, maxStreak, studyDates };
        const result = await this.userprogressRepository.update(userProgress.user, updateOp);
        await this.checkAndUnlockNonChampionPrizes(userProgress.user);
        await this._invalidateCache();
        return result;
    }

    _calculateStreak(studyDates, todayStr = getVietnamDate()) {
        if (!Array.isArray(studyDates) || studyDates.length === 0) {
            return { currentStreak: 0, maxStreak: 0 };
        }
        const dates = [...new Set(studyDates)].map(d => d instanceof Date ? getVietnamDate(d) : d).filter(Boolean).sort().reverse();
        let streak = 0;
        let tempMaxStreak = 0;
        for (let i = 0; i < dates.length; i++) {
            if (i === 0) {
                streak = 1;
            } else {
                const currentDate = new Date(dates[i] + 'T00:00:00+07:00');
                const prevDate = new Date(dates[i - 1] + 'T00:00:00+07:00');
                const diffDays = (prevDate - currentDate) / (1000 * 60 * 60 * 24);
                if (diffDays === 1 || diffDays === 2) {
                    streak++;
                } else {
                    break;
                }
            }
            tempMaxStreak = Math.max(tempMaxStreak, streak);
        }
        return { currentStreak: streak, tempMaxStreak };
    }

    _calculatePerfectStreak(studyDates, todayStr = getVietnamDate()) {
        if (!Array.isArray(studyDates) || studyDates.length === 0) {
            return 0;
        }
        const dates = [...new Set(studyDates)].map(d => (d instanceof Date ? getVietnamDate(d) : d)).filter(Boolean).sort().reverse();
        const today = new Date(todayStr + 'T00:00:00+07:00');
        const yesterday = new Date(today.getTime() - 86400000);
        const yesterdayStr = getVietnamDate(yesterday);
        if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
            return 0;
        }
        let perfectStreak = 0;
        let expectedDateObj = new Date(dates[0] + 'T00:00:00+07:00');
        for (let i = 0; i < dates.length; i++) {
            const currentDateStr = dates[i];
            const currentDateObj = new Date(currentDateStr + 'T00:00:00+07:00');
            if (currentDateObj.getTime() === expectedDateObj.getTime()) {
                perfectStreak++;
                expectedDateObj = new Date(expectedDateObj.getTime() - 86400000);
            } else {
                break;
            }
        }
        return perfectStreak;
    }

    async checkAndResetStreakOnLogin(userId) {
        const userProgress = await this.getUserProgressByUserId(userId);
        if (!userProgress) return null;
        const todayStr = getVietnamDate();
        const today = new Date(todayStr + 'T00:00:00+07:00');
        const studyDates = [...new Set(
            (userProgress.studyDates || []).map(d => d instanceof Date ? getVietnamDate(d) : d).filter(Boolean)
        )];
        if (studyDates.includes(todayStr)) {
            return userProgress;
        }
        const pastDates = studyDates.filter(d => d !== todayStr).sort((a, b) => new Date(b) - new Date(a));
        if (pastDates.length === 0) {
            return userProgress;
        }
        const lastStudyDateStr = pastDates[0];
        const lastStudyDate = new Date(lastStudyDateStr + 'T00:00:00+07:00');
        const daysDiff = Math.floor((today - lastStudyDate) / (24 * 60 * 60 * 1000));
        if (daysDiff >= 3) {
            const updateOp = { $set: { streak: 0 } };
            await this.userprogressRepository.update(userId, updateOp, true);
            await this._invalidateCache();
            return { ...userProgress, streak: 0 };
        }
        return userProgress;
    }

    async recordStudyTime(userId, seconds) {
        if (!seconds || seconds <= 0) return false;
        const result = await this.userprogressRepository.addDailyStudyTime(userId, seconds);
        await this._invalidateCache();
        return result.modifiedCount > 0 || result.upsertedCount > 0;
    }

    async _sendPrizeNotification(userId, prize, championType = null) {
        let title = "";
        let message = "";
        let type = "achieve";
        let link = "http://localhost:5173/statistic";
        switch (prize.type) {
            case "perfect_streak":
                const streakDays = prize.requirement.streakDays;
                const level = prize.level;
                if (level === 10) {
                    title = "365 NGÀY HOÀN HẢO – BẠN LÀ HUYỀN THOẠI!";
                    message = `Chúc mừng bạn đã duy trì 365 ngày học liên tục không bỏ sót! Bạn chính thức là VUA CỦA SỰ KỶ LUẬT tại EasyTalk! Cả cộng đồng đang cúi đầu thán phục!`;
                } else if (level >= 7) {
                    title = `TUẦN HOÀN HẢO CẤP ${level} – BẠN LÀ SIÊU NHÂN!`;
                    message = `Đã ${streakDays} ngày không bỏ lỡ một buổi học nào! Bạn đang viết nên một hành trình mà 99% người khác chỉ biết mơ ước!`;
                } else if (level >= 4) {
                    title = `TUẦN HOÀN HẢO CẤP ${level} – ĐẲNG CẤP ĐÃ LÊN TIẾNG!`;
                    message = `${streakDays} ngày liên tục – bạn không chỉ học, bạn đang sống cùng tiếng Anh mỗi ngày!`;
                } else {
                    title = `TUẦN HOÀN HẢO CẤP ${level} – XUẤT SẮC!`;
                    message = `Đã duy trì ${streakDays} ngày học không gián đoạn! Bạn đang tiến rất gần đến ngôi đền của những huyền thoại!`;
                }
                break;
            case "knowledge_god":
                const xpNeeded = prize.requirement.xp.toLocaleString('vi-VN');
                if (prize.level === 10) {
                    title = "VỊ THẦN KIẾN THỨC CẤP 10 – BẠN LÀ THẦN THOẠI!";
                    message = `100.000 XP đã thuộc về bạn! Bạn không còn là học viên nữa – bạn là một hiện tượng của EasyTalk! Cả hệ thống đang rung chuyển vì sự chăm chỉ của bạn!`;
                } else if (prize.level >= 7) {
                    title = `VỊ THẦN KIẾN THỨC CẤP ${prize.level} – ĐỈNH CAO MỚI!`;
                    message = `Đạt ${xpNeeded} XP – bạn đã vượt qua hàng ngàn người để đứng trong top những bộ óc xuất sắc nhất!`;
                } else {
                    title = `VỊ THẦN KIẾN THỨC CẤP ${prize.level} – ĐANG THĂNG HOA!`;
                    message = `Chúc mừng đạt mốc ${xpNeeded} XP! Bạn đang tiến gần hơn đến ngôi vị tối thượng của tri thức!`;
                }
                break;
            case "champion_week":
                if (championType === "exp") {
                    title = "QUÁN QUÂN TUẦN – VUA ĐIỂM SỐ!";
                    message = `TUẦN QUA BẠN LÀ NGƯỜI HỌC HIỆU QUẢ NHẤT! Với số điểm kinh nghiệm cao nhất, bạn chính thức là QUÁN QUÂN TUẦN về KIẾN THỨC! Cúp vàng thuộc về bạn!`;
                } else if (championType === "time") {
                    title = "QUÁN QUÂN TUẦN – VUA THỜI GIAN!";
                    message = `TUẦN QUA BẠN LÀ NGƯỜI CHĂM CHỈ NHẤT! Với thời gian học dài nhất, bạn chính thức là QUÁN QUÂN TUẦN về SỰ KIÊN TRÌ! Cúp vàng thuộc về bạn!`;
                } else if (championType === "both") {
                    title = "QUÁN QUÂN TUẦN TUYỆT ĐỐI – BẠN LÀ HUYỀN THOẠI!";
                    message = `BẠN ĐÃ LÀM NÊN LỊCH SỬ! Top 1 cả điểm số lẫn thời gian học – bạn không chỉ giỏi, bạn còn siêu chăm chỉ! CẢ HAI CÚP VÀNG TUẦN NÀY ĐỀU THUỘC VỀ BẠN!`;
                }
                type = "champion";
                break;
            case "champion_month":
                if (championType === "exp") {
                    title = "QUÁN QUÂN THÁNG – ĐẾ VƯƠNG KIẾN THỨC!";
                    message = `THÁNG NÀY BẠN LÀ NGƯỜI XUẤT SẮC NHẤT về điểm kinh nghiệm! Không ai vượt qua được bạn về hiệu quả học tập! Cúp tháng vàng ròng đã có chủ!`;
                } else if (championType === "time") {
                    title = "QUÁN QUÂN THÁNG – ĐẾ VƯƠNG KIÊN TRÌ!";
                    message = `THÁNG NÀY BẠN LÀ NGƯỜI CHĂM CHỈ NHẤT với thời gian học dài nhất! Sự kiên trì của bạn đã được đền đáp xứng đáng! Cúp tháng thuộc về bạn!`;
                } else if (championType === "both") {
                    title = "QUÁN QUÂN THÁNG TUYỆT ĐỐI – BẠN LÀ THẦN THOẠI!";
                    message = `THÁNG NÀY BẠN LÀ SỐ 1 TUYỆT ĐỐI! Top 1 cả điểm số lẫn thời gian – bạn chính là hình mẫu hoàn hảo mà mọi học viên mơ ước! CẢ HAI CÚP THÁNG ĐỀU LÀ CỦA BẠN!`;
                }
                type = "champion";
                break;
            case "champion_year":
                if (championType === "exp") {
                    title = "QUÁN QUÂN NĂM – THẦN KIẾN THỨC!";
                    message = `CẢ NĂM QUA, BẠN LÀ NGƯỜI HỌC HIỆU QUẢ NHẤT TOÀN HỆ THỐNG! Với tổng điểm kinh nghiệm cao nhất, tên bạn sẽ được khắc vào ngôi đền danh vọng vĩnh viễn!`;
                } else if (championType === "time") {
                    title = "QUÁN QUÂN NĂM – THẦN KIÊN TRÌ!";
                    message = `CẢ NĂM QUA, BẠN LÀ NGƯỜI CHĂM CHỈ NHẤT TOÀN HỆ THỐNG! Với thời gian học dài nhất, bạn xứng đáng là biểu tượng của sự bền bỉ!`;
                } else if (championType === "both") {
                    title = "QUÁN QUÂN NĂM TUYỆT ĐỐI – BẠN LÀ HUYỀN THOẠI SỐNG!";
                    message = `BẠN ĐÃ VIẾT NÊN LỊCH SỬ EASY TALK! Top 1 cả điểm số lẫn thời gian trong cả năm – bạn không chỉ giỏi, bạn là HOÀN HẢO! TÊN BẠN SẼ ĐƯỢC KHẮC VÀNG MÃI MÃI!`;
                }
                type = "champion";
                break;
        }
        try {
            await this.notificationService.createNotification(userId, title, message, type, link);
        } catch (err) {
            console.error("Lỗi gửi thông báo thành tựu:", err);
        }
    }

    _getVnNow() {
        return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    }

    async checkAndUnlockNonChampionPrizes(userId) {
        const userProgress = await this.getUserProgressByUserId(userId);
        if (!userProgress) return { newPrizes: [], totalUnlocked: 0 };
        const allPrizes = await prizeService.getAllPrizes();
        const newlyUnlocked = [];
        for (const prize of allPrizes) {
            if (['champion_week', 'champion_month', 'champion_year'].includes(prize.type)) continue;
            if (await this.userprogressRepository.hasUnlockedPrize(userId, prize.code)) continue;
            let shouldUnlock = false;
            switch (prize.type) {
                case 'perfect_streak':
                    shouldUnlock = await this._checkPerfectStreak(userProgress, prize);
                    break;
                case 'knowledge_god':
                    shouldUnlock = await this._checkKnowledgeGod(userProgress, prize);
                    break;
            }
            if (shouldUnlock) {
                await this.userprogressRepository.unlockPrize(userId, prize._id, prize.code, prize.level);
                newlyUnlocked.push(prize);
                await this._sendPrizeNotification(userId, prize, prize.championType);
            }
        }
        await this._invalidateCache();
        return { newPrizes: newlyUnlocked, totalUnlocked: newlyUnlocked.length };
    }

    async checkAndUnlockChampionPrizes(userId) {
        const userProgress = await this.getUserProgressByUserId(userId);
        if (!userProgress) return { newPrizes: [], totalUnlocked: 0 };
        const allPrizes = await prizeService.getAllPrizes();
        const newlyUnlocked = [];
        const now = this._getVnNow();
        for (const prize of allPrizes) {
            if (!['champion_week', 'champion_month', 'champion_year'].includes(prize.type)) continue;
            if (await this.userprogressRepository.hasUnlockedPrize(userId, prize.code)) continue;
            let shouldUnlock = false;
            let period = null;
            if (prize.type === 'champion_week' && now.getDay() === 1) {
                period = this._getPreviousPeriod('week');
                shouldUnlock = await this._checkChampionWeek(userId, prize, period);
            }
            if (prize.type === 'champion_month' && now.getDate() === 1) {
                period = this._getPreviousPeriod('month');
                shouldUnlock = await this._checkChampionMonth(userId, prize, period);
            }
            if (prize.type === 'champion_year' && now.getMonth() === 0 && now.getDate() === 1) {
                period = this._getPreviousPeriod('year');
                shouldUnlock = await this._checkChampionYear(userId, prize, period);
            }
            if (shouldUnlock) {
                await this.userprogressRepository.unlockPrize(userId, prize._id, prize.code, prize.level, period);
                newlyUnlocked.push(prize);
                await this._sendPrizeNotification(userId, prize, prize.championType);
            }
        }
        await this._invalidateCache();
        return { newPrizes: newlyUnlocked, totalUnlocked: newlyUnlocked.length };
    }

    async _checkPerfectStreak(userProgress, prize) {
        const perfectStreak = this._calculatePerfectStreak(
            userProgress.studyDates,
            getVietnamDate()
        );
        return perfectStreak >= prize.requirement.streakDays;
    }
    
    async _checkKnowledgeGod(userProgress, prize) {
        return (userProgress.experiencePoints || 0) >= prize.requirement.xp;
    }

    async _checkChampionWeek(userId, prize, periodKey) {
        const [expLeaderboard, timeLeaderboard] = await Promise.all([
            this.userprogressRepository.getLeaderboardByExp('week', 50, periodKey),
            this.userprogressRepository.getLeaderboardByStudyTime('week', 50, periodKey)
        ]);
        if (!expLeaderboard.length && !timeLeaderboard.length) return false;
        const topExpScore = expLeaderboard[0]?.value ?? 0;
        const topTimeScore = timeLeaderboard[0]?.value ?? 0;
        const topExpUserIds = expLeaderboard.filter(u => u.value === topExpScore).map(u => u._id.toString());
        const topTimeUserIds = timeLeaderboard.filter(u => u.value === topTimeScore).map(u => u._id.toString());
        const userIdStr = userId.toString();
        const isTopExp = topExpUserIds.includes(userIdStr);
        const isTopTime = topTimeUserIds.includes(userIdStr);
        if (isTopExp && isTopTime) prize.championType = "both";
        else if (isTopExp) prize.championType = "exp";
        else if (isTopTime) prize.championType = "time";
        return isTopExp || isTopTime;
    }

    async _checkChampionMonth(userId, prize, periodKey) {
        const [expLeaderboard, timeLeaderboard] = await Promise.all([
            this.userprogressRepository.getLeaderboardByExp('month', 50, periodKey),
            this.userprogressRepository.getLeaderboardByStudyTime('month', 50, periodKey)
        ]);
        if (!expLeaderboard.length && !timeLeaderboard.length) return false;
        const topExpScore = expLeaderboard[0]?.value ?? 0;
        const topTimeScore = timeLeaderboard[0]?.value ?? 0;
        const topExpUserIds = expLeaderboard.filter(u => u.value === topExpScore).map(u => u._id.toString());
        const topTimeUserIds = timeLeaderboard.filter(u => u.value === topTimeScore).map(u => u._id.toString());
        const userIdStr = userId.toString();
        const isTopExp = topExpUserIds.includes(userIdStr);
        const isTopTime = topTimeUserIds.includes(userIdStr);
        if (isTopExp && isTopTime) prize.championType = "both";
        else if (isTopExp) prize.championType = "exp";
        else if (isTopTime) prize.championType = "time";
        return isTopExp || isTopTime;
    }

    async _checkChampionYear(userId, prize, periodKey) {
        const [expLeaderboard, timeLeaderboard] = await Promise.all([
            this.userprogressRepository.getLeaderboardByExp('year', 50, periodKey),
            this.userprogressRepository.getLeaderboardByStudyTime('year', 50, periodKey)
        ]);
        if (!expLeaderboard.length && !timeLeaderboard.length) return false;
        const topExpScore = expLeaderboard[0]?.value ?? 0;
        const topTimeScore = timeLeaderboard[0]?.value ?? 0;
        const topExpUserIds = expLeaderboard.filter(u => u.value === topExpScore).map(u => u._id.toString());
        const topTimeUserIds = timeLeaderboard.filter(u => u.value === topTimeScore).map(u => u._id.toString());
        const userIdStr = userId.toString();
        const isTopExp = topExpUserIds.includes(userIdStr);
        const isTopTime = topTimeUserIds.includes(userIdStr);
        if (isTopExp && isTopTime) prize.championType = "both";
        else if (isTopExp) prize.championType = "exp";
        else if (isTopTime) prize.championType = "time";
        return isTopExp || isTopTime;
    }

    _getPreviousPeriod(type) {
        const vnNow = this._getVnNow();
        const year = vnNow.getFullYear();
        const month = vnNow.getMonth();
        if (type === 'week') {
            const startOfYear = new Date(year, 0, 1);
            const days = Math.floor((vnNow - startOfYear) / (24 * 60 * 60 * 1000));
            const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
            const prevWeek = weekNumber - 1;
            if (prevWeek > 0) return `${year}-W${String(prevWeek).padStart(2, '0')}`;
            const prevYear = year - 1;
            const lastWeekOfPrevYear = this._getWeekNumber(new Date(prevYear, 11, 31));
            return `${prevYear}-W${String(lastWeekOfPrevYear).padStart(2, '0')}`;
        }
        if (type === 'month') {
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            return `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;
        }
        if (type === 'year') return `${year - 1}`;
        return null;
    }

    _getWeekNumber(date) {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    }

    async getUserPrizesWithDetails(userId) {
        const unlockedPrizes = await this.userprogressRepository.getUserPrizes(userId);
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

    async manuallyCheckChampionPrizesForAll() {
        console.log('[Manual] Kiểm tra giải quán quân cho tất cả người dùng...');
        const { userprogresses } = await this.getUserProgressList(1, 1000);
        const results = [];
        for (const p of userprogresses) {
            try {
                const result = await this.checkAndUnlockChampionPrizes(p.user.toString());
                if (result.newPrizes.length > 0) {
                    results.push({ userId: p.user.toString(), prizes: result.newPrizes });
                }
            } catch (err) {
                console.error(`Lỗi user ${p.user}:`, err);
            }
        }
        return results;
    }

    async manuallyCheckChampionPrizes(userId) {
        return await this.checkAndUnlockChampionPrizes(userId);
    }

    async deleteUserProgressByUser(userId) {
        const result = await this.userprogressRepository.deleteByUser(userId);
        await this._invalidateCache();
        return result;
    }

    async deleteUserProgress(id) {
        const result = await this.userprogressRepository.deleteProgress(id);
        await this._invalidateCache();
        return result;
    }

    async unlockJourneyInitial(userProgress, journey) {
        const firstGate = journey.gates && journey.gates.length > 0 ? journey.gates[0]._id : null;
        const firstStage = journey.gates[0]?.stages && journey.gates[0].stages.length > 0 ? journey.gates[0].stages[0]._id : null;
        let isUpdated = false;
        if (firstGate && !userProgress.unlockedGates.some(g => g.toString() == firstGate.toString())) {
            userProgress.unlockedGates.push(firstGate);
            isUpdated = true;
        }
        if (firstStage && !userProgress.unlockedStages.some(s => s.toString() == firstStage.toString())) {
            userProgress.unlockedStages.push(firstStage);
            isUpdated = true;
        }
        if (isUpdated) {
            await this.updateUserProgress(userProgress);
        }
        return userProgress;
    }

    async unlockNextStory(userProgress, nextStoryId, addExp = 10) {
        if (!nextStoryId) return userProgress;
        if (!userProgress.unlockedStories) userProgress.unlockedStories = [];
        const nextIdStr = nextStoryId.toString();
        if (!userProgress.unlockedStories.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedStories.push(new ObjectId(nextStoryId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isStoryUnlocked(userProgress, storyId) {
        if (!userProgress || !userProgress.unlockedStories) return false;
        return userProgress.unlockedStories.some(s => s.toString() == storyId.toString());
    }

    async unlockNextGrammar(userProgress, nextGrammarId, addExp = 10) {
        if (!nextGrammarId) return userProgress;
        if (!userProgress.unlockedGrammars) userProgress.unlockedGrammars = [];
        const nextIdStr = nextGrammarId.toString();
        if (!userProgress.unlockedGrammars.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedGrammars.push(new ObjectId(nextGrammarId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isGrammarUnlocked(userProgress, GrammarId) {
        if (!userProgress || !userProgress.unlockedGrammars) return false;
        return userProgress.unlockedGrammars.some(s => s.toString() == GrammarId.toString());
    }

    async unlockNextPronunciation(userProgress, nextPronunciationId, addExp = 10) {
        if (!nextPronunciationId) return userProgress;
        if (!userProgress.unlockedPronunciations) userProgress.unlockedPronunciations = [];
        const nextIdStr = nextPronunciationId.toString();
        if (!userProgress.unlockedPronunciations.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedPronunciations.push(new ObjectId(nextPronunciationId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async unlockNextGrammarExercise(userProgress, nextGrammarExerciseId, addExp = 10) {
        if (!nextGrammarExerciseId) return userProgress;
        if (!userProgress.unlockedGrammarExercises) userProgress.unlockedGrammarExercises = [];
        const nextIdStr = nextGrammarExerciseId.toString();
        if (!userProgress.unlockedGrammarExercises.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedGrammarExercises.push(new ObjectId(nextGrammarExerciseId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isGrammarExerciseUnlocked(userProgress, GrammarExerciseId) {
        if (!userProgress || !userProgress.unlockedGrammarExercises) return false;
        return userProgress.unlockedGrammarExercises.some(s => s.toString() == GrammarExerciseId.toString());
    }

    async unlockNextPronunciationExercise(userProgress, nextPronunciationExerciseId, addExp = 10) {
        if (!nextPronunciationExerciseId) return userProgress;
        if (!userProgress.unlockedPronunciationExercises) userProgress.unlockedPronunciationExercises = [];
        const nextIdStr = nextPronunciationExerciseId.toString();
        if (!userProgress.unlockedPronunciationExercises.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedPronunciationExercises.push(new ObjectId(nextPronunciationExerciseId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isPronunciationExerciseUnlocked(userProgress, PronunciationExerciseId) {
        if (!userProgress || !userProgress.unlockedPronunciationExercises) return false;
        return userProgress.unlockedPronunciationExercises.some(s => s.toString() == PronunciationExerciseId.toString());
    }

    async unlockNextVocabularyExercise(userProgress, nextVocabularyExerciseId, addExp = 10) {
        if (!nextVocabularyExerciseId) return userProgress;
        if (!userProgress.unlockedVocabularyExercises) userProgress.unlockedVocabularyExercises = [];
        const nextIdStr = nextVocabularyExerciseId.toString();
        if (!userProgress.unlockedVocabularyExercises.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedVocabularyExercises.push(new ObjectId(nextVocabularyExerciseId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isVocabularyExerciseUnlocked(userProgress, VocabularyExerciseId) {
        if (!userProgress || !userProgress.unlockedVocabularyExercises) return false;
        return userProgress.unlockedVocabularyExercises.some(s => s.toString() == VocabularyExerciseId.toString());
    }

    async unlockNextDictation(userProgress, nextDictationId, addExp = 10) {
        if (!nextDictationId) return userProgress;
        if (!userProgress.unlockedDictations) userProgress.unlockedDictations = [];
        const nextIdStr = nextDictationId.toString();
        if (!userProgress.unlockedDictations.some(s => s.toString() == nextIdStr)) {
            userProgress.unlockedDictations.push(new ObjectId(nextDictationId));
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + addExp;
        await this.updateUserProgress(userProgress);
        return userProgress;
    }

    async isDictationUnlocked(userProgress, DictationId) {
        if (!userProgress || !userProgress.unlockedDictations) return false;
        return userProgress.unlockedDictations.some(s => s.toString() == DictationId.toString());
    }

    async _invalidateCache() {
        const redis = getRedisClient();
        const scanAndDelete = async (pattern) => {
            let cursor = '0';
            let totalDeleted = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                if (keys.length > 0) {
                    const deleted = await redis.del(keys);
                    totalDeleted += deleted;
                }
                cursor = nextCursor;
            } while (cursor !== '0');
            return totalDeleted;
        };
        try {
            const deletedList = await scanAndDelete('userprogress:list:*');
            const deletedApi = await scanAndDelete('cache:/api/userprogress*');
            const total = deletedList + deletedApi;
            if (total > 0) {
                console.log(`UserProgress cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No userprogress cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate userprogress cache error:', err);
        }
    }
}

module.exports = UserprogressService;