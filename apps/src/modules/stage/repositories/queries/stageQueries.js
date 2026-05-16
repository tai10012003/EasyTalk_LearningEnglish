function buildStageQuery() {
    return [
        {
            $lookup: {
                from: "gates",
                localField: "gate",
                foreignField: "_id",
                as: "gateInfo"
            }
        },
        { 
            $unwind: { 
                path: "$gateInfo", 
                preserveNullAndEmptyArrays: true 
            } 
        },
        {
            $lookup: {
                from: "journeys",
                localField: "gateInfo.journey",
                foreignField: "_id",
                as: "journeyInfo"
            }
        },
        { 
            $unwind: { 
                path: "$journeyInfo", 
                preserveNullAndEmptyArrays: true 
            } 
        },
        { 
            $addFields: { 
                "gateInfo.journeyInfo": "$journeyInfo" 
            } 
        },
        { 
            $project: { 
                journeyInfo: 0 
            } 
        }
    ];
}

module.exports = { buildStageQuery };