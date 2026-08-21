const { ObjectId } = require('mongodb');
const { getVietnamDate } = require('../../../shared/utils/dateFormat');

class UserProgress {
    constructor(doc = {}) {
        this._id = doc._id || null;
        this.user = doc.user || null;
        this.dailyFlashcardGoal = doc.dailyFlashcardGoal || 20;
        this.dailyFlashcardReviews = doc.dailyFlashcardReviews || {};
        this.unlockedFlashcardBadges = doc.unlockedFlashcardBadges || {};
        this.unlockedGates = doc.unlockedGates || [];
        this.unlockedStages = doc.unlockedStages || [];
        this.unlockedStories = doc.unlockedStories || [];
        this.unlockedGrammars = doc.unlockedGrammars || [];
        this.unlockedPronunciations = doc.unlockedPronunciations || [];
        this.unlockedGrammarExercises = doc.unlockedGrammarExercises || [];
        this.unlockedPronunciationExercises = doc.unlockedPronunciationExercises || [];
        this.unlockedVocabularyExercises = doc.unlockedVocabularyExercises || [];
        this.unlockedDictations = doc.unlockedDictations || [];
        this.grammarStudyStats = doc.grammarStudyStats || {};
        this.pronunciationStudyStats = doc.pronunciationStudyStats || {};
        this.storyStudyStats = doc.storyStudyStats || {};
        this.dictationStudyStats = doc.dictationStudyStats || {};
        this.experiencePoints = doc.experiencePoints || 0;
        this.dailyExperiencePoints = doc.dailyExperiencePoints || {};
        this.studyTimes = doc.studyTimes || 0;
        this.dailyStudyTimes = doc.dailyStudyTimes || {};
        this.streak = doc.streak || 0;
        this.maxStreak = doc.maxStreak || 0;
        this.studyDates = doc.studyDates || [];
        this.diamonds = doc.diamonds || 0;
        this.unlockedPrizes = doc.unlockedPrizes || [];
        this.followers = doc.followers || [];
        this.following = doc.following || [];
        this.createdAt = doc.createdAt || null;
        this.updatedAt = doc.updatedAt || null;
    }

    get todayReviewCount() {
        const todayStr = getVietnamDate();
        return this.dailyFlashcardReviews?.[todayStr] || 0;
    }

    get isDailyGoalAchieved() {
        return this.todayReviewCount >= this.dailyFlashcardGoal;
    }

    get isStreakActive() {
        if(!this.studyDates || this.studyDates.length === 0) return false;
        const todayStr = getVietnamDate();
        const today = new Date(todayStr + 'T00:00:00+07:00');
        const yesterday = new Date(today.getTime() - 86400000);
        const yesterdayStr = getVietnamDate(yesterday);
        const sorted = [...this.studyDates].sort().reverse();
        return sorted[0] === todayStr || sorted[0] === yesterdayStr;
    }

    hasUnlockedPrize(code) {
        return this.unlockedPrizes?.some(p => p.code === code) || false;
    }

    isContentUnlocked(contentId, field) {
        if(!this[field] || !contentId) return false;
        return this[field].some(id => id.toString() === contentId.toString());
    }

    static toObjectIds(arr) {
        if(!Array.isArray(arr)) return [];
        return [...new Set(arr)].map(id => new ObjectId(id));
    }

    static validate(doc) {
        const errors = [];
        if(!doc.user) {
            errors.push('user is required');
        }
        if(doc.dailyFlashcardGoal !== undefined) {
            if(typeof doc.dailyFlashcardGoal !== 'number' || doc.dailyFlashcardGoal < 0 || doc.dailyFlashcardGoal > 200) {
                errors.push('dailyFlashcardGoal must be a number between 0 and 200');
            }
        }
        if(doc.experiencePoints !== undefined && typeof doc.experiencePoints !== 'number') {
            errors.push('experiencePoints must be a number');
        }
        if(doc.diamonds !== undefined && typeof doc.diamonds !== 'number') {
            errors.push('diamonds must be a number');
        }
        if(doc.streak !== undefined && typeof doc.streak !== 'number') {
            errors.push('streak must be a number');
        }
        if(doc.studyDates !== undefined && !Array.isArray(doc.studyDates)) {
            errors.push('studyDates must be an array');
        }
        return errors;
    }

    static buildInitialDocument(userId, options = {}) {
        const { firstGate = null, firstStage = null, initialStory = null, initialGrammar = null, initialPronunciation = null, initialGrammarExercise = null, initialPronunciationExercise = null, initialVocabularyExercise = null, initialDictation = null } = options;
        return {
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
            grammarStudyStats: {},
            pronunciationStudyStats: {},
            storyStudyStats: {},
            dictationStudyStats: {},
            studyTimes: 0,
            dailyStudyTimes: {},
            experiencePoints: 0,
            dailyExperiencePoints: {},
            unlockedPrizes: [],
            diamonds: 0,
            streak: 0,
            maxStreak: 0,
            studyDates: [],
            followers: [],
            following: []
        };
    }
}

module.exports = UserProgress;
