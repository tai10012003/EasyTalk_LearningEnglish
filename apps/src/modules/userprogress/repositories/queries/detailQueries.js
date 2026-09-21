const { ObjectId } = require('mongodb');

function buildFindAllPipeline(filter, skip, limit) {
    return [
        { $match: filter },
        { $sort: { _id: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            }
        },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 1,
                user: 1,
                dailyFlashcardGoal: 1,
                experiencePoints: 1,
                streak: 1,
                maxStreak: 1,
                dailyFlashcardReviews: 1,
                unlockedFlashcardBadges: 1,
                studyDates: 1,
                "userDetails.username": 1,
                "userDetails.email": 1
            }
        }
    ];
}

function _sharedContentLookups() {
    return [
        {
            $lookup: { from: "gates", localField: "unlockedGates", foreignField: "_id", as: "gateDetails" }
        },
        {
            $lookup: { from: "journeys", localField: "gateDetails.journey", foreignField: "_id", as: "journeyForGates" }
        },
        {
            $lookup: { from: "stages", localField: "unlockedStages", foreignField: "_id", as: "stageDetails" }
        },
        {
            $lookup: { from: "gates", localField: "stageDetails.gate", foreignField: "_id", as: "gateForStages" }
        },
        {
            $lookup: { from: "journeys", localField: "gateForStages.journey", foreignField: "_id", as: "journeyForStages" }
        },
        { $lookup: { from: "grammars", localField: "unlockedGrammars", foreignField: "_id", as: "grammarDetails" } },
        { $lookup: { from: "pronunciations", localField: "unlockedPronunciations", foreignField: "_id", as: "pronunciationDetails" } },
        { $lookup: { from: "stories", localField: "unlockedStories", foreignField: "_id", as: "storyDetails" } },
        { $lookup: { from: "grammarexercises", localField: "unlockedGrammarExercises", foreignField: "_id", as: "grammarExerciseDetails" } },
        { $lookup: { from: "pronunciationexercises", localField: "unlockedPronunciationExercises", foreignField: "_id", as: "pronunciationExerciseDetails" } },
        { $lookup: { from: "vocabularyexercises", localField: "unlockedVocabularyExercises", foreignField: "_id", as: "vocabularyExerciseDetails" } },
        { $lookup: { from: "dictationexercises", localField: "unlockedDictations", foreignField: "_id", as: "dictationExerciseDetails" } }
    ];
}

function _sharedProjectFields() {
    return {
        _id: 1,
        user: 1,
        "userDetails.username": 1,
        "userDetails.email": 1,
        dailyFlashcardGoal: 1,
        dailyFlashcardReviews: 1,
        experiencePoints: 1,
        dailyExperiencePoints: 1,
        streak: 1,
        maxStreak: 1,
        studyDates: 1,
        unlockedFlashcardBadges: 1,
        studyTimes: 1,
        dailyStudyTimes: 1,
        gateDetails: {
            $map: {
                input: "$gateDetails",
                as: "gate",
                in: {
                    _id: "$$gate._id",
                    name: {
                        $concat: [
                            "$$gate.title",
                            " - ",
                            {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: {
                                                $filter: {
                                                    input: "$journeyForGates",
                                                    cond: { $eq: ["$$this._id", "$$gate.journey"] }
                                                }
                                            },
                                            as: "j",
                                            in: "$$j.title"
                                        }
                                    },
                                    0
                                ]
                            }
                        ]
                    }
                }
            }
        },
        stageDetails: {
            $map: {
                input: "$stageDetails",
                as: "stage",
                in: {
                    _id: "$$stage._id",
                    name: {
                        $let: {
                            vars: {
                                currentGate: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$gateForStages",
                                                cond: { $eq: ["$$this._id", "$$stage.gate"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            },
                            in: {
                                $concat: [
                                    "$$stage.title",
                                    " - ",
                                    { $ifNull: ["$$currentGate.title", "Cổng không tên"] },
                                    " - ",
                                    {
                                        $arrayElemAt: [
                                            {
                                                $map: {
                                                    input: {
                                                        $filter: {
                                                            input: "$journeyForStages",
                                                            cond: { $eq: ["$$this._id", "$$currentGate.journey"] }
                                                        }
                                                    },
                                                    as: "j",
                                                    in: "$$j.title"
                                                }
                                            },
                                            0
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        grammarDetails: { $map: { input: "$grammarDetails", as: "g", in: { _id: "$$g._id", title: "$$g.title" } } },
        pronunciationDetails: { $map: { input: "$pronunciationDetails", as: "p", in: { _id: "$$p._id", title: "$$p.title" } } },
        storyDetails: { $map: { input: "$storyDetails", as: "s", in: { _id: "$$s._id", title: "$$s.title" } } },
        grammarExerciseDetails: { $map: { input: "$grammarExerciseDetails", as: "ge", in: { _id: "$$ge._id", title: "$$ge.title" } } },
        pronunciationExerciseDetails: { $map: { input: "$pronunciationExerciseDetails", as: "pe", in: { _id: "$$pe._id", title: "$$pe.title" } } },
        vocabularyExerciseDetails: { $map: { input: "$vocabularyExerciseDetails", as: "ve", in: { _id: "$$ve._id", title: "$$ve.title" } } },
        dictationExerciseDetails: { $map: { input: "$dictationExerciseDetails", as: "de", in: { _id: "$$de._id", title: "$$de.title" } } }
    };
}

function buildFindByIdPipeline(id) {
    return [
        { $match: { _id: new ObjectId(id) } },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        ..._sharedContentLookups(),
        { $project: _sharedProjectFields() }
    ];
}

function buildDetailByUserIdPipeline(userId) {
    return [
        { $match: { user: new ObjectId(userId) } },
        {
            $lookup: { from: "users", localField: "user", foreignField: "_id", as: "userDetails" }
        },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "users", localField: "followers", foreignField: "_id", as: "followerDetails" } },
        { $lookup: { from: "users", localField: "following", foreignField: "_id", as: "followingDetails" } },
        ..._sharedContentLookups(),
        {
            $project: {
                ..._sharedProjectFields(),
                followers: "$followers",
                following: "$following",
                followerDetails: 1,
                followingDetails: 1,
                unlockedPrizes: 1,
                diamonds: 1
            }
        }
    ];
}

module.exports = { buildFindAllPipeline, buildFindByIdPipeline, buildDetailByUserIdPipeline };