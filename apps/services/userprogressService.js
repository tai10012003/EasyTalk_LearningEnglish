const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const config = require('../config/setting');
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
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: config.email.user,
                pass: config.email.pass,
            },
        });
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

    async getDetailUserProgressByUserId(userId) {
        return await this.userprogressRepository.findDetailUserProgressByUserId(userId);
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
            diamonds: 0,
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
        if (daysDiff === 2) {
            const currentStreak = userProgress.streak || 0;
            if (currentStreak > 0) {
                try {
                    const existingNotif = await this.notificationService.getNotificationsByUserId(userId);
                    const todayStart = new Date(todayStr + 'T00:00:00+07:00');
                    const todayEnd = new Date(todayStr + 'T23:59:59+07:00');
                    const hasWarningToday = existingNotif.some(n => 
                        n.type === "warning" && 
                        n.title.includes("STREAK CỦA BẠN ĐANG NGUY HIỂM") &&
                        n.createdAt >= todayStart && 
                        n.createdAt <= todayEnd
                    );
                    if (!hasWarningToday) {
                        await this.notificationService.createNotification(
                            userId,
                            "STREAK CỦA BẠN ĐANG NGUY HIỂM!",
                            `Bạn đã nghỉ học 1 ngày! Chuỗi ${currentStreak} ngày của bạn sẽ bị mất nếu hôm nay không học. Đây là CƠ HỘI CUỐI CÙNG để giữ lại thành quả của mình. Hãy học ngay để tiếp tục chuỗi chiến thắng! 💪`,
                            "warning",
                            "http://localhost:5173/journey"
                        );
                        const user = await this.userprogressRepository.db.collection("users").findOne({ _id: new ObjectId(userId) });
                        if (user && user.email) {
                            await this.sendStreakEmail(user.email, "warning", { currentStreak });
                            console.log(`📧 Email cảnh báo streak đã gửi đến ${user.email}`);
                        }
                    }
                } catch (err) {
                    console.error("Lỗi gửi thông báo/email cảnh báo streak:", err);
                }
            }
        }
        if (daysDiff >= 3) {
            const lostStreak = userProgress.streak || 0;
            const maxStreak = userProgress.maxStreak || 0;
            if (lostStreak > 0) {
                try {
                    const existingNotif = await this.notificationService.getNotificationsByUserId(userId);
                    const todayStart = new Date(todayStr + 'T00:00:00+07:00');
                    const todayEnd = new Date(todayStr + 'T23:59:59+07:00');
                    const hasStreakLostToday = existingNotif.some(n => 
                        n.type === "streak_lost" && 
                        n.title.includes("STREAK ĐÃ BỊ RESET VỀ 0") &&
                        n.message.includes(`${lostStreak} ngày`) &&
                        n.createdAt >= todayStart && 
                        n.createdAt <= todayEnd
                    );
                    if (!hasStreakLostToday) {
                        let title = "STREAK ĐÃ BỊ RESET VỀ 0!";
                        let message = "";
                        if (lostStreak >= 30) {
                            message = `Thật đáng tiếc! Bạn đã mất chuỗi ${lostStreak} ngày học tập kiên trì do nghỉ 2 ngày liên tiếp. Đây là một mất mát lớn, nhưng đừng để nó đánh gục bạn! Kỷ lục ${maxStreak} ngày của bạn vẫn còn đó - hãy bắt đầu lại và phá vỡ chính mình! 🔥`;
                        } else if (lostStreak >= 7) {
                            message = `Rất tiếc! Chuỗi ${lostStreak} ngày của bạn đã kết thúc do nghỉ 2 ngày liên tiếp. Nhưng đừng bỏ cuộc! Hãy học ngay hôm nay để bắt đầu một chuỗi mới mạnh mẽ hơn. Bạn đã làm được ${lostStreak} ngày, lần này bạn có thể làm tốt hơn! 💪`;
                        } else {
                            message = `Streak ${lostStreak} ngày của bạn đã kết thúc do nghỉ 2 ngày liên tiếp. Đừng lo lắng! Mọi hành trình đều bắt đầu từ bước đầu tiên. Hãy học ngay hôm nay để khởi đầu chuỗi streak mới! 🚀`;
                        }
                        await this.notificationService.createNotification(userId, title, message, "streak_lost", "http://localhost:5173/streak");
                        const user = await this.userprogressRepository.db.collection("users").findOne({ _id: new ObjectId(userId) });
                        if (user && user.email) {
                            await this.sendStreakEmail(user.email, "lost", { lostStreak, maxStreak });
                            console.log(`📧 Email thông báo streak lost đã gửi đến ${user.email}`);
                        }
                    }
                } catch (err) {
                    console.error("Lỗi gửi thông báo/email streak bị reset:", err);
                }
            }
            const updateOp = { $set: { streak: 0 } };
            await this.userprogressRepository.update(userId, updateOp, true);
            await this._invalidateCache();
            return { ...userProgress, streak: 0 };
        }
        return userProgress;
    }

    async sendStreakEmail(userEmail, type, streakData) {
        const { currentStreak, lostStreak, maxStreak } = streakData;
        let subject = "";
        let heading = "";
        let content = "";
        if (type === "warning") {
            subject = "⚠️ CẢNH BÁO: Streak Của Bạn Đang Nguy Hiểm!";
            heading = "🔥 STREAK CỦA BẠN CẦN BẠN!";
            content = `
                <p>Xin chào bạn 👋,</p>
                <p style="color: #ff6b6b; font-weight: bold; font-size: 16px;">
                    Bạn đã nghỉ học 1 ngày và chuỗi <strong>${currentStreak} ngày</strong> của bạn đang trong tình trạng nguy hiểm!
                </p>
                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>⏰ ĐÂY LÀ CƠ HỘI CUỐI CÙNG!</strong><br>
                        Nếu hôm nay bạn không học, chuỗi ${currentStreak} ngày của bạn sẽ bị reset về 0. 
                        Tất cả những nỗ lực trước đó sẽ không còn nữa.
                    </p>
                </div>
                <p style="font-size: 16px; line-height: 1.6;">
                    Hãy dành chỉ <strong>5-10 phút</strong> để học một bài ngắn, ôn vài từ vựng, 
                    hoặc luyện nghe một đoạn hội thoại. Đó là tất cả những gì cần để giữ lại thành quả của bạn! 💪
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/journey" style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                        🚀 HỌC NGAY BÂY GIỜ
                    </a>
                </div>
            `;
        } else if (type === "lost") {
            subject = "💔 Streak Của Bạn Đã Bị Reset";
            heading = "😔 STREAK ĐÃ BỊ RESET VỀ 0";
            if (lostStreak >= 30) {
                content = `
                    <p>Xin chào bạn 👋,</p>
                    <p style="color: #dc3545; font-weight: bold; font-size: 16px;">
                        Thật đáng tiếc! Bạn đã mất chuỗi <strong style="font-size: 20px;">${lostStreak} ngày</strong> học tập kiên trì do nghỉ 2 ngày liên tiếp.
                    </p>
                    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; color: #721c24;">
                            Đây là một mất mát lớn, nhưng đừng để nó đánh gục bạn! 
                            Kỷ lục <strong>${maxStreak} ngày</strong> của bạn vẫn còn đó và chứng minh bạn đã có thể làm được điều đó.
                        </p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Mỗi huyền thoại đều có lúc vấp ngã. Điều khác biệt giữa người thành công và người thất bại 
                        là khả năng đứng dậy và bắt đầu lại. Hãy bắt đầu lại và lần này bạn sẽ phá vỡ chính mình! 🔥
                    </p>
                `;
            } else if (lostStreak >= 7) {
                content = `
                    <p>Xin chào bạn 👋,</p>
                    <p style="color: #dc3545; font-weight: bold; font-size: 16px;">
                        Rất tiếc! Chuỗi <strong>${lostStreak} ngày</strong> của bạn đã kết thúc do nghỉ 2 ngày liên tiếp.
                    </p>
                    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; color: #721c24;">
                            Nhưng đừng bỏ cuộc! Bạn đã chứng minh được khả năng học ${lostStreak} ngày liên tiếp - 
                            đó là một thành tích đáng tự hào.
                        </p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Lần này, với kinh nghiệm đã có, bạn có thể làm tốt hơn! 
                        Hãy đặt mục tiêu vượt qua ${lostStreak} ngày và tạo nên kỷ lục mới. Bạn làm được mà! 💪
                    </p>
                `;
            } else {
                content = `
                    <p>Xin chào bạn 👋,</p>
                    <p style="color: #dc3545; font-weight: bold; font-size: 16px;">
                        Streak <strong>${lostStreak} ngày</strong> của bạn đã kết thúc do nghỉ 2 ngày liên tiếp.
                    </p>
                    <div style="background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; color: #0c5460;">
                            <strong>Đừng lo lắng!</strong> Mọi hành trình đều bắt đầu từ bước đầu tiên. 
                            Điều quan trọng là bạn tiếp tục đi tiếp, không dừng lại.
                        </p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">
                        Hãy học ngay hôm nay để khởi đầu chuỗi streak mới! Lần này bạn đã biết cách duy trì rồi đấy. 🚀
                    </p>
                `;
            }
            content += `
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:5173/journey" 
                       style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                        🔥 BẮT ĐẦU LẠI NGAY
                    </a>
                </div>
            `;
        }
        const mailOptions = {
            from: config.email.user,
            to: userEmail,
            subject: subject,
            html: `
                <div>
                    <h2 style="color: #4CAF50; text-align: center;">${heading}</h2>
                    ${content}
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666; line-height: 1.6;">
                        <strong>💡 Mẹo duy trì streak:</strong><br>
                        • Đặt lịch nhắc nhở hàng ngày vào cùng một giờ<br>
                        • Bắt đầu với mục tiêu nhỏ (5-10 phút/ngày)<br>
                        • Học vào buổi sáng để đảm bảo không quên<br>
                        • Kết hợp học với thói quen hàng ngày của bạn
                    </p>
                    <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        Chúc bạn một hành trình học tập thành công! 🌟<br>
                        — <strong>Đội ngũ EasyTalk</strong><br>
                        <a href="https://easytalk.vn" style="color: #4CAF50; text-decoration: none;">www.easytalk.vn</a>
                    </p>
                </div>
            `,
        };
        return new Promise((resolve, reject) => {
            this.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("❌ Lỗi gửi email streak:", error);
                    reject(error);
                } else {
                    console.log("✅ Email streak đã gửi:", info.response);
                    resolve(info);
                }
            });
        });
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
                const diamondsReward = prize.diamondAwards || 0;
                if (diamondsReward > 0) {
                    await this.addDiamonds(userId, diamondsReward);
                    await this.notificationService.createNotification(userId, "NHẬN KIM CƯƠNG THÀNH TỰU!", `Chúc mừng bạn nhận ${diamondsReward} kim cương từ thành tựu "${prize.name}"!`, "achieve", "/shop");
                }
            }
        }
        await this._invalidateCache();
        return { newPrizes: newlyUnlocked, totalUnlocked: newlyUnlocked.length };
    }

    async checkAndUnlockChampionPrizes(userId) {
        const userProgress = await this.getUserProgressByUserId(userId);
        if (!userProgress) return { newPrizes: [], totalUnlocked: 0 };
        const allPrizes = await prizeService.getAllPrizes();
        const championPrizes = allPrizes.filter(p =>
            ['champion_week', 'champion_month', 'champion_year'].includes(p.type)
        );
        const newlyUnlocked = [];
        const now = this._getVnNow();
        for (const prize of championPrizes) {
            let periodToCheck = null;
            if (prize.type === 'champion_week') {
                periodToCheck = this._getLastCompletedWeekPeriod(now);
            } else if (prize.type === 'champion_month') {
                periodToCheck = this._getLastCompletedMonthPeriod(now);
            } else if (prize.type === 'champion_year') {
                periodToCheck = this._getLastCompletedYearPeriod(now);
            }
            if (!periodToCheck) continue;
            const alreadyUnlocked = userProgress.unlockedPrizes?.some(up => up.code === prize.code && up.period === periodToCheck);
            if (alreadyUnlocked) continue;
            let isChampion = false;
            if (prize.type === 'champion_week') {
                isChampion = await this._checkChampionWeek(userId, prize, periodToCheck);
            } else if (prize.type === 'champion_month') {
                isChampion = await this._checkChampionMonth(userId, prize, periodToCheck);
            } else if (prize.type === 'champion_year') {
                isChampion = await this._checkChampionYear(userId, prize, periodToCheck);
            }
            if (isChampion) {
                await this.userprogressRepository.unlockPrize(userId, prize._id, prize.code, prize.level, periodToCheck);
                newlyUnlocked.push({ ...prize, period: periodToCheck });
                await this._sendPrizeNotification(userId, prize, prize.championType);
                const diamondsReward = prize.diamondAwards || 0;
                if (diamondsReward > 0) {
                    await this.addDiamonds(userId, diamondsReward);
                    await this.notificationService.createNotification(userId, "NHẬN KIM CƯƠNG QUÁN QUÂN!", `Chúc mừng bạn nhận ${diamondsReward} kim cương từ danh hiệu ${prize.name || 'Quán quân'}!`, "achieve", "/shop");
                }
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
        const meetsMinExp = topExpScore >= 100;
        const meetsMinTime = topTimeScore >= 0.333;
        const validExp = isTopExp && meetsMinExp;
        const validTime = isTopTime && meetsMinTime;
        if (validExp && validTime) prize.championType = "both";
        else if (validExp) prize.championType = "exp";
        else if (validTime) prize.championType = "time";
        return validExp || validTime;
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
        const meetsMinExp = topExpScore >= 400;
        const meetsMinTime = topTimeScore >= 1;
        const validExp = isTopExp && meetsMinExp;
        const validTime = isTopTime && meetsMinTime;
        if (validExp && validTime) prize.championType = "both";
        else if (validExp) prize.championType = "exp";
        else if (validTime) prize.championType = "time";
        return validExp || validTime;
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
        const meetsMinExp = topExpScore >= 2000;
        const meetsMinTime = topTimeScore >= 8;
        const validExp = isTopExp && meetsMinExp;
        const validTime = isTopTime && meetsMinTime;
        if (validExp && validTime) prize.championType = "both";
        else if (validExp) prize.championType = "exp";
        else if (validTime) prize.championType = "time";
        return validExp || validTime;
    }

    // _getWeekNumber(date) {
    //     const startOfYear = new Date(date.getFullYear(), 0, 1);
    //     const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    //     return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    // }

    _getLastCompletedWeekPeriod(now) {
        const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const year = vnDate.getFullYear();
        const month = vnDate.getMonth();
        const date = vnDate.getDate();
        const dayOfWeek = vnDate.getDay();
        let representativeDate = new Date(year, month, date);
        if (dayOfWeek === 0) {
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
        if (month == 0) {
            return `${year - 1}-12`;
        }
        return `${year}-${String(month).padStart(2, '0')}`
    }

    _getLastCompletedYearPeriod(now) {
        const year = now.getFullYear();
        const month = now.getMonth();
        if (month === 0) {
            return `${year - 1}`;
        }
        return null;
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

    async getChampionStats(userId) {
        const userProgress = await this.getUserProgressByUserId(userId);
        if (!userProgress?.unlockedPrizes || userProgress.unlockedPrizes.length === 0) {
            return { week: 0, month: 0, year: 0,total: 0 };
        }
        let week = 0, month = 0, year = 0;
        userProgress.unlockedPrizes.forEach(p => {
            if (p.code.includes('CHAMPION_WEEK')) week++;
            else if (p.code.includes('CHAMPION_MONTH')) month++;
            else if (p.code.includes('CHAMPION_YEAR')) year++;
        });
        return { week, month, year, total: week + month + year};
    }

    async manuallyCheckChampionPrizesForAll() {
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

    async addDiamonds(userId, amount) {
        if (amount <= 0) return false;
        const result = await this.userprogressRepository.update(userId, {
            $inc: { diamonds: amount }
        });
        await this._invalidateCache();
        return result.modifiedCount > 0 || result.upsertedCount > 0;
    }

    async getDiamonds(userId) {
        const progress = await this.getUserProgressByUserId(userId);
        return progress?.diamonds || 0;
    }

    async followUser(currentUserId, targetUserId) {
        await this.userprogressRepository.followUser(currentUserId, targetUserId);
        await this._invalidateCache();
    }

    async unfollowUser(currentUserId, targetUserId) {
        await this.userprogressRepository.unfollowUser(currentUserId, targetUserId);
        await this._invalidateCache();
    }

    async isFollowing(currentUserId, targetUserId) {
        return await this.userprogressRepository.isFollowing(currentUserId, targetUserId);
    }

    async getFollowersCount(userId) {
        return await this.userprogressRepository.getFollowersCount(userId);
    }

    async getFollowingCount(userId) {
        return await this.userprogressRepository.getFollowingCount(userId);
    }

    async getFollowersList(userId) {
        return await this.userprogressRepository.getFollowersList(userId);
    }

    async getFollowingList(userId) {
        return await this.userprogressRepository.getFollowingList(userId);
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