function _basePipeline() {
    return [
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        { $addFields: { username: "$userDetails.username", userId: "$user" } }
    ];
}

function buildLeaderboardExpPipeline(period, limit, dateKeys) {
    const pipeline = [..._basePipeline()];
    if(period === 'all') {
        pipeline.push({
            $project: { _id: "$userId", username: 1, value: { $ifNull: ["$experiencePoints", 0] } }
        });
    } else {
        pipeline.push({ $project: { username: 1, userId: 1, dailyExperiencePoints: 1 } });
        pipeline.push({
            $addFields: {
                value: {
                    $sum: {
                        $map: {
                            input: { $objectToArray: "$dailyExperiencePoints" },
                            as: "item",
                            in: { $cond: [{ $in: ["$$item.k", dateKeys] }, "$$item.v", 0] }
                        }
                    }
                }
            }
        });
        pipeline.push({ $project: { _id: "$userId", username: 1, value: { $round: ["$value", 0] } } });
    }
    pipeline.push(
        { $sort: { value: -1 } },
        { $limit: limit }
    );
    return pipeline;
}

function buildLeaderboardTimePipeline(period, limit, dateKeys) {
    const pipeline = [..._basePipeline()];
    if(period === 'all') {
        pipeline.push({
            $project: { _id: "$userId", username: 1, value: { $ifNull: ["$studyTimes", 0] } }
        });
    } else {
        pipeline.push({ $project: { username: 1, userId: 1, dailyStudyTimes: 1 } });
        pipeline.push({
            $addFields: {
                value: {
                    $sum: {
                        $map: {
                            input: { $objectToArray: "$dailyStudyTimes" },
                            as: "item",
                            in: { $cond: [{ $in: ["$$item.k", dateKeys] }, "$$item.v", 0] }
                        }
                    }
                }
            }
        });
        pipeline.push({ $project: { _id: "$userId", username: 1, value: { $round: ["$value", 2] } } });
    }
    pipeline.push(
        { $sort: { value: -1 } },
        { $limit: limit }
    );
    return pipeline;
}

function buildLeaderboardStreakPipeline(limit) {
    return [
        { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userDetails' } },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        { $project: { username: "$userDetails.username", streak: "$streak", maxStreak: "$maxStreak", userId: "$user" } },
        { $sort: { streak: -1, maxStreak: -1 } },
        { $limit: limit }
    ];
}

module.exports = { buildLeaderboardExpPipeline, buildLeaderboardTimePipeline, buildLeaderboardStreakPipeline };