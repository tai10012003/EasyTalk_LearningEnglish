const { createLearningAgentController } = require('./controllers/learningAgentController');
const LearningAgentService = require('./services/learningAgentService');
const LearnerMemoryService = require('./services/learnerMemoryService');
const AIProviderService = require('./services/aiProviderService');
const AIUsageService = require('./services/aiUsageService');
const AITextToSpeechService = require('./services/aiTextToSpeechService');
const AIProviderDebugService = require('./services/aiProviderDebugService');
const DailyPlanCacheService = require('./services/dailyPlanCacheService');
const PromptTemplateService = require('./services/promptTemplateService');
const MockAIResponseService = require('./services/mockAIResponseService');
const AgentSessionService = require('./services/agentSessionService');
const AgentLearningEventService = require('./services/agentLearningEventService');
const AgentModeService = require('./services/agentModeService');
const AIResponseSchemaGuard = require('./schemas/aiResponseSchemaGuard');
const ProviderFactory = require('./adapters/providerFactory');
const AICostReporter = require('./telemetry/aiCostReporter');
const AILatencyReporter = require('./telemetry/aiLatencyReporter');
const FallbackReporter = require('./telemetry/fallbackReporter');
const AITraceService = require('./telemetry/aiTraceService');
const DailyPlanAgent = require('./agents/dailyPlanAgent');
const ChatCoachAgent = require('./agents/chatCoachAgent');
const WritingCoachAgent = require('./agents/writingCoachAgent');
const StudyGuideAgent = require('./agents/studyGuideAgent');
const AgentRegistry = require('./agents/agentRegistry');
const ProgressTool = require('./tools/progressTool');
const MemoryTool = require('./tools/memoryTool');
const DailyPlanTool = require('./tools/dailyPlanTool');
const LearningEventTool = require('./tools/learningEventTool');

module.exports = {
    createLearningAgentController,
    LearningAgentService,
    LearnerMemoryService,
    AIProviderService,
    AIUsageService,
    AITextToSpeechService,
    AIProviderDebugService,
    DailyPlanCacheService,
    PromptTemplateService,
    MockAIResponseService,
    AgentSessionService,
    AgentLearningEventService,
    AgentModeService,
    AIResponseSchemaGuard,
    ProviderFactory,
    AICostReporter,
    AILatencyReporter,
    FallbackReporter,
    AITraceService,
    DailyPlanAgent,
    ChatCoachAgent,
    WritingCoachAgent,
    StudyGuideAgent,
    AgentRegistry,
    ProgressTool,
    MemoryTool,
    DailyPlanTool,
    LearningEventTool
};
