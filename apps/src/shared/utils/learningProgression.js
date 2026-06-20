async function completeLearningProgression({ repository, currentItem, userId, userProgress, userProgressService, unlockNext, unlockedField, experience = 10 }) {
    const nextItem = await repository.findNextBySortOrder(currentItem.sort);
    if (nextItem) {
        userProgress = await unlockNext(userProgress, nextItem._id, experience);
    } else {
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + experience;
        await userProgressService.updateUserProgress(userProgress);
    }
    const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
    return {
        nextItem,
        userProgress: {
            [unlockedField]: updatedUserProgress[unlockedField],
            experiencePoints: updatedUserProgress.experiencePoints,
            streak: updatedUserProgress.streak,
            maxStreak: updatedUserProgress.maxStreak,
            studyDates: updatedUserProgress.studyDates
        }
    };
}

module.exports = { completeLearningProgression };