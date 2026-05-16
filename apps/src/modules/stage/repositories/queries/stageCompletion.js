const { ObjectId } = require('mongodb');

async function handleStageCompletion(stageId, currentStage, userProgress, stageService, gateService, journeyService) {
    if(!userProgress.unlockedStages.some(stage => stage.toString() == stageId)) {
        userProgress.unlockedStages.push(new ObjectId(stageId));
    }
    const allStagesInGate = await stageService.getStagesInGate(currentStage.gate);
    const currentStageIndex = allStagesInGate.findIndex(stage => stage._id.toString() == stageId);
    if(currentStageIndex !== -1 && currentStageIndex < allStagesInGate.length - 1) {
        const nextStage = allStagesInGate[currentStageIndex + 1];
        if(!userProgress.unlockedStages.some(stage => stage.toString() == nextStage._id.toString())) {
            userProgress.unlockedStages.push(nextStage._id);
        }
    } else {
        const gateId = currentStage.gate;
        const gate = await gateService.getGateById(gateId);
        if(!gate) {
            throw new Error("Không thể tìm thấy cổng cho chặng hiện tại.");
        }
        const currentJourneyId = gate.journey;
        const allGatesInJourney = await gateService.getGatesInJourney(currentJourneyId);
        const currentGateIndex = allGatesInJourney.findIndex(g => g._id.toString() == currentStage.gate.toString());
        if(currentGateIndex !== -1 && currentGateIndex < allGatesInJourney.length - 1) {
            const nextGate = allGatesInJourney[currentGateIndex + 1];
            if(!userProgress.unlockedGates.some(gate => gate.toString() == nextGate._id.toString())) {
                userProgress.unlockedGates.push(nextGate._id);
                const firstStageOfNextGate = await stageService.getStagesInGate(nextGate._id);
                if(firstStageOfNextGate.length > 0 && 
                    !userProgress.unlockedStages.some(stage => stage.toString() == firstStageOfNextGate[0]._id.toString())) {
                    userProgress.unlockedStages.push(firstStageOfNextGate[0]._id);
                }
            }
        }
    }
    userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
    return userProgress;
}

module.exports = { handleStageCompletion };