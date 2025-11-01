class UserProgress {
    _id;
    user;
    unlockedGates = [];
    unlockedStages = [];
    unlockedStories = [];
    unlockedGrammars = [];
    unlockedPronunciations = [];
    unlockedGrammarExercises = [];
    unlockedPronunciationExercises = [];
    unlockedVocabularyExercises = [];
    unlockedDictations = [];
    experiencePoints = 0;
    streak = 0;
    maxStreak = 0;
    studyDates = [];

    constructor(init = {}) {
        Object.assign(this, init);
    }
}

module.exports = UserProgress;