class ContentProgressService {
    constructor(deps = {}) {
        this.contentServices = {
            grammarService: deps.grammarService || null,
            storyService: deps.storyService || null,
            pronunciationService: deps.pronunciationService || null,
            grammarExerciseService: deps.grammarExerciseService || null,
            pronunciationExerciseService: deps.pronunciationExerciseService || null,
            vocabularyExerciseService: deps.vocabularyExerciseService || null,
            dictationExerciseService: deps.dictationExerciseService || null
        };
        this.assertRequiredServices();
    }

    assertRequiredServices() {
        const missing = Object.entries(this.contentServices).filter(([, service]) => !service).map(([name]) => name);
        if (missing.length) {
            throw new Error(`ContentProgressService requires content services: ${missing.join(", ")}`);
        }
    }

    async getInitialUnlocks(initialUnlocks = {}) {
        const { grammarService, storyService, pronunciationService, grammarExerciseService, pronunciationExerciseService, vocabularyExerciseService, dictationExerciseService } = this.contentServices;
        const [storyPage, grammarPage, pronunciationPage, grammarExercisePage, pronunciationExercisePage, vocabularyExercisePage, dictationPage] = await Promise.all([
            !initialUnlocks.story ? storyService.getStoryList(1, 1) : null,
            !initialUnlocks.grammar ? grammarService.getGrammarList(1, 1) : null,
            !initialUnlocks.pronunciation ? pronunciationService.getPronunciationList(1, 1) : null,
            !initialUnlocks.grammarExercise ? grammarExerciseService.getGrammarexerciseList(1, 1) : null,
            !initialUnlocks.pronunciationExercise ? pronunciationExerciseService.getPronunciationexerciseList(1, 1) : null,
            !initialUnlocks.vocabularyExercise ? vocabularyExerciseService.getVocabularyexerciseList(1, 1) : null,
            !initialUnlocks.dictation ? dictationExerciseService.getDictationList(1, 1) : null
        ]);
        return {
            story: initialUnlocks.story || storyPage?.stories?.[0]?._id || null,
            grammar: initialUnlocks.grammar || grammarPage?.grammars?.[0]?._id || null,
            pronunciation: initialUnlocks.pronunciation || pronunciationPage?.pronunciations?.[0]?._id || null,
            grammarExercise: initialUnlocks.grammarExercise || grammarExercisePage?.grammarexercises?.[0]?._id || null,
            pronunciationExercise: initialUnlocks.pronunciationExercise || pronunciationExercisePage?.pronunciationexercises?.[0]?._id || null,
            vocabularyExercise: initialUnlocks.vocabularyExercise || vocabularyExercisePage?.vocabularyexercises?.[0]?._id || null,
            dictation: initialUnlocks.dictation || dictationPage?.dictationExercises?.[0]?._id || null
        };
    }
}

module.exports = ContentProgressService;
