function calculateJourneyProgress(journeys, userProgress) {
    const userCompletedGates = (userProgress.unlockedGates || []).map(id => id.toString());
    const userCompletedStages = (userProgress.unlockedStages || []).map(id => id.toString());
    journeys.forEach(journey => {
        let totalGates = 0;
        let totalStages = 0;
        let completedJourneyGates = 0;
        let completedJourneyStages = 0;
        if(Array.isArray(journey.gates)) {
            journey.gates.forEach(gate => {
                totalGates++;
                if(userCompletedGates.includes(gate._id?.toString())) {
                    completedJourneyGates++;
                }
                if(Array.isArray(gate.stages)) {
                    totalStages += gate.stages.length;
                    gate.stages.forEach(stage => {
                        if(userCompletedStages.includes(stage._id?.toString())) {
                            completedJourneyStages++;
                        }
                    });
                }
            });
        }
        const totalItems = totalGates + totalStages;
        const completedItems = completedJourneyGates + completedJourneyStages;
        journey.progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    });
    return journeys;
}

function calculateOverallProgress(journeys, userProgress) {
    const userCompletedGates = (userProgress.unlockedGates || []).map(id => id.toString());
    const userCompletedStages = (userProgress.unlockedStages || []).map(id => id.toString());
    const totalGates = journeys.reduce((sum, journey) => sum + (Array.isArray(journey.gates) ? journey.gates.length : 0), 0);
    const totalStages = journeys.reduce((sum, journey) => sum + (Array.isArray(journey.gates) ? journey.gates.reduce((gSum, gate) => gSum + (Array.isArray(gate.stages) ? gate.stages.length : 0), 0) : 0), 0);
    const totalCompletedGates = userCompletedGates.length;
    const totalCompletedStages = userCompletedStages.length;
    const totalItems = totalGates + totalStages;
    const completedItems = totalCompletedGates + totalCompletedStages;
    const overallProgressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    return {
        totalGates,
        totalStages,
        completedGates: totalCompletedGates,
        completedStages: totalCompletedStages,
        progressPercentage: overallProgressPercentage.toFixed(2)
    };
}

module.exports = { calculateJourneyProgress, calculateOverallProgress };