const { buildCompletionStatsQuery, buildPopularContentQuery, CONTENT_COLLECTIONS } = require('../repositories/queries/contentQueries');

class ContentAnalyticsService {
    constructor(db) {
        this.db = db;
    }

    async getLessonBreakdown() {
        try {
            const totalGrammars = await this.db.collection('grammars').countDocuments();
            const totalPronunciations = await this.db.collection('pronunciations').countDocuments();
            const totalStories = await this.db.collection('stories').countDocuments();
            return [
                { name: "Ngữ Pháp", y: totalGrammars },
                { name: "Phát Âm", y: totalPronunciations },
                { name: "Câu Chuyện", y: totalStories }
            ];
        } catch (error) {
            console.error('Error getting lesson breakdown:', error);
            throw new Error('Không thể lấy tỷ lệ bài học');
        }
    }

    async getExerciseBreakdown() {
        try {
            const totalGrammarExercises = await this.db.collection('grammarexercises').countDocuments();
            const totalPronunciationExercises = await this.db.collection('pronunciationexercises').countDocuments();
            const totalVocabularyExercises = await this.db.collection('vocabularyexercises').countDocuments();
            const totalDictationExercises = await this.db.collection('dictationexercises').countDocuments();
            return [
                { name: "Ngữ Pháp", y: totalGrammarExercises },
                { name: "Phát Âm", y: totalPronunciationExercises },
                { name: "Từ Vựng", y: totalVocabularyExercises },
                { name: "Nghe Chép Chính Tả", y: totalDictationExercises }
            ];
        } catch (error) {
            console.error('Error getting exercise breakdown:', error);
            throw new Error('Không thể lấy tỷ lệ bài luyện tập');
        }
    }

    async getLessonCompletionStats() {
        try {
            const totalGrammars = await this.db.collection('grammars').countDocuments();
            const totalPronunciations = await this.db.collection('pronunciations').countDocuments();
            const totalStories = await this.db.collection('stories').countDocuments();
            const totalUserProgresses = await this.db.collection('userprogresses').countDocuments();
            if (totalUserProgresses === 0) {
                return {
                    grammars: { total: totalGrammars, avgUnlocked: 0, percentage: 0 },
                    pronunciations: { total: totalPronunciations, avgUnlocked: 0, percentage: 0 },
                    stories: { total: totalStories, avgUnlocked: 0, percentage: 0 }
                };
            }
            const grammarStats = await this.db.collection('userprogresses').aggregate(buildCompletionStatsQuery('unlockedGrammars')).toArray();
            const pronunciationStats = await this.db.collection('userprogresses').aggregate(buildCompletionStatsQuery('unlockedPronunciations')).toArray();
            const storyStats = await this.db.collection('userprogresses').aggregate(buildCompletionStatsQuery('unlockedStories')).toArray();
            const avgGrammars = grammarStats.length > 0 ? grammarStats[0].total / totalUserProgresses : 0;
            const avgPronunciations = pronunciationStats.length > 0 ? pronunciationStats[0].total / totalUserProgresses : 0;
            const avgStories = storyStats.length > 0 ? storyStats[0].total / totalUserProgresses : 0;
            return {
                grammars: {
                    total: totalGrammars,
                    avgUnlocked: Math.round(avgGrammars * 10) / 10,
                    percentage: totalGrammars > 0 ? Math.round((avgGrammars / totalGrammars) * 100) : 0
                },
                pronunciations: {
                    total: totalPronunciations,
                    avgUnlocked: Math.round(avgPronunciations * 10) / 10,
                    percentage: totalPronunciations > 0 ? Math.round((avgPronunciations / totalPronunciations) * 100) : 0
                },
                stories: {
                    total: totalStories,
                    avgUnlocked: Math.round(avgStories * 10) / 10,
                    percentage: totalStories > 0 ? Math.round((avgStories / totalStories) * 100) : 0
                }
            };
        } catch (error) {
            console.error('Error getting lesson completion stats:', error);
            throw new Error('Không thể lấy thống kê hoàn thành bài học');
        }
    }

    async getExerciseCompletionStats() {
        try {
            const totalGrammarEx = await this.db.collection('grammarexercises').countDocuments();
            const totalPronunciationEx = await this.db.collection('pronunciationexercises').countDocuments();
            const totalVocabularyEx = await this.db.collection('vocabularyexercises').countDocuments();
            const totalDictationEx = await this.db.collection('dictationexercises').countDocuments();
            const totalUserProgresses = await this.db.collection('userprogresses').countDocuments();
            if (totalUserProgresses === 0) {
                return {
                    grammarExercises: { total: totalGrammarEx, avgUnlocked: 0, percentage: 0 },
                    pronunciationExercises: { total: totalPronunciationEx, avgUnlocked: 0, percentage: 0 },
                    vocabularyExercises: { total: totalVocabularyEx, avgUnlocked: 0, percentage: 0 },
                    dictationExercises: { total: totalDictationEx, avgUnlocked: 0, percentage: 0 }
                };
            }
            const grammarExStats = await this.db.collection('userprogresses').aggregate(buildCompletionStatsQuery('unlockedGrammarExercises')).toArray();
            const pronunciationExStats = await this.db.collection('userprogresses').aggregate(buildCompletionStatsQuery('unlockedPronunciationExercises')).toArray();
            const vocabularyExStats = await this.db.collection('userprogresses').aggregate(buildCompletionStatsQuery('unlockedVocabularyExercises')).toArray();
            const dictationExStats = await this.db.collection('userprogresses').aggregate(buildCompletionStatsQuery('unlockedDictations')).toArray();
            const avgGrammarEx = grammarExStats.length > 0 ? grammarExStats[0].total / totalUserProgresses : 0;
            const avgPronunciationEx = pronunciationExStats.length > 0 ? pronunciationExStats[0].total / totalUserProgresses : 0;
            const avgVocabularyEx = vocabularyExStats.length > 0 ? vocabularyExStats[0].total / totalUserProgresses : 0;
            const avgDictationEx = dictationExStats.length > 0 ? dictationExStats[0].total / totalUserProgresses : 0;
            return {
                grammarExercises: {
                    total: totalGrammarEx,
                    avgUnlocked: Math.round(avgGrammarEx * 10) / 10,
                    percentage: totalGrammarEx > 0 ? Math.round((avgGrammarEx / totalGrammarEx) * 100) : 0
                },
                pronunciationExercises: {
                    total: totalPronunciationEx,
                    avgUnlocked: Math.round(avgPronunciationEx * 10) / 10,
                    percentage: totalPronunciationEx > 0 ? Math.round((avgPronunciationEx / totalPronunciationEx) * 100) : 0
                },
                vocabularyExercises: {
                    total: totalVocabularyEx,
                    avgUnlocked: Math.round(avgVocabularyEx * 10) / 10,
                    percentage: totalVocabularyEx > 0 ? Math.round((avgVocabularyEx / totalVocabularyEx) * 100) : 0
                },
                dictationExercises: {
                    total: totalDictationEx,
                    avgUnlocked: Math.round(avgDictationEx * 10) / 10,
                    percentage: totalDictationEx > 0 ? Math.round((avgDictationEx / totalDictationEx) * 100) : 0
                }
            };
        } catch (error) {
            console.error('Error getting exercise completion stats:', error);
            throw new Error('Không thể lấy thống kê hoàn thành bài tập');
        }
    }

    async getMostPopularLessons() {
        try {
            const results = {};
            for(const { field, collection, type } of CONTENT_COLLECTIONS.lessons) {
                const pipeline = buildPopularContentQuery(field, collection, type, -1);
                const popular = await this.db.collection('userprogresses').aggregate(pipeline).toArray();
                const key = field.replace('unlocked', '').replace(/^[A-Z]/, m => m.toLowerCase());
                results[key] = popular.length > 0 ? popular[0] : null;
            }
            return results;
        } catch (error) {
            console.error('Error getting most popular lessons:', error);
            throw new Error('Không thể lấy bài học phổ biến nhất');
        }
    }

    async getMostPopularExercises() {
        try {
            const results = {};
            for(const { field, collection, type } of CONTENT_COLLECTIONS.exercises) {
                const pipeline = buildPopularContentQuery(field, collection, type, -1);
                const popular = await this.db.collection('userprogresses').aggregate(pipeline).toArray();
                const key = field.replace('unlocked', '').replace(/^[A-Z]/, m => m.toLowerCase());
                results[key] = popular.length > 0 ? popular[0] : null;
            }
            return results;
        } catch (error) {
            console.error('Error getting most popular exercises:', error);
            throw new Error('Không thể lấy bài tập phổ biến nhất');
        }
    }

    async getLeastPopularLessons() {
        try {
            const results = {};
            for(const { field, collection, type } of CONTENT_COLLECTIONS.lessons) {
                const pipeline = buildPopularContentQuery(field, collection, type, 1);
                const hardest = await this.db.collection('userprogresses').aggregate(pipeline).toArray();
                const key = field.replace('unlocked', '').replace(/^[A-Z]/, m => m.toLowerCase());
                results[key] = hardest.length > 0 ? hardest[0] : null;
            }
            return results;
        } catch (error) {
            console.error('Error getting least popular lessons:', error);
            throw new Error('Không thể lấy bài học khó nhất');
        }
    }

    async getLeastPopularExercises() {
        try {
            const results = {};
            for(const { field, collection, type } of CONTENT_COLLECTIONS.exercises) {
                const pipeline = buildPopularContentQuery(field, collection, type, 1);
                const hardest = await this.db.collection('userprogresses').aggregate(pipeline).toArray();
                const key = field.replace('unlocked', '').replace(/^[A-Z]/, m => m.toLowerCase());
                results[key] = hardest.length > 0 ? hardest[0] : null;
            }
            return results;
        } catch (error) {
            console.error('Error getting least popular exercises:', error);
            throw new Error('Không thể lấy bài tập khó nhất');
        }
    }
}

module.exports = ContentAnalyticsService;