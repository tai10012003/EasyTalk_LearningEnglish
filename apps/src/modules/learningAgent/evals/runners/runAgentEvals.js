const DailyPlanAgent = require('../../agents/dailyPlanAgent');
const AIProviderService = require('../../services/aiProviderService');
const dailyPlanCases = require('../cases/daily-plan-cases');
const chatCases = require('../cases/chat-cases');
const writingCases = require('../cases/writing-cases');
const studyGuideCases = require('../cases/study-guide-cases');
const { scoreDailyPlan } = require('../scorecards/daily-plan-scorecard');
const { scoreChatReply } = require('../scorecards/chat-scorecard');
const { scoreWritingFeedback } = require('../scorecards/writing-scorecard');
const { scoreStudyGuide } = require('../scorecards/study-guide-scorecard');
const StudyGuideAgent = require('../../agents/studyGuideAgent');

async function runAgentEvals() {
    const dailyPlanAgent = new DailyPlanAgent();
    const aiProviderService = new AIProviderService({ provider: "mock", mode: "mock" });
    const studyGuideAgent = new StudyGuideAgent();
    const results = [];

    for (const testCase of dailyPlanCases) {
        const plan = dailyPlanAgent.buildPlan(testCase.input.progress, testCase.input.memory, testCase.input.options);
        results.push({ suite: "dailyPlan", name: testCase.name, ...scoreDailyPlan(plan, testCase) });
    }

    for (const testCase of chatCases) {
        const reply = await aiProviderService.generateAgentChatReply(testCase.input);
        results.push({ suite: "chat", name: testCase.name, ...scoreChatReply(reply, testCase) });
    }

    for (const testCase of writingCases) {
        const feedback = await aiProviderService.generateWritingFeedback(testCase.input);
        results.push({ suite: "writing", name: testCase.name, ...scoreWritingFeedback(feedback, testCase) });
    }

    for (const testCase of studyGuideCases) {
        const guide = await studyGuideAgent.buildCoachGuide(testCase.input.userId, testCase.input);
        results.push({ suite: "studyGuide", name: testCase.name, ...scoreStudyGuide(guide, testCase) });
    }

    return {
        passed: results.every(result => result.passed),
        results
    };
}

if (require.main === module) {
    runAgentEvals()
        .then(report => {
            console.log(JSON.stringify(report, null, 2));
            process.exit(report.passed ? 0 : 1);
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { runAgentEvals };
