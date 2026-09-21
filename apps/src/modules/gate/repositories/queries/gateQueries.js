function buildGateListQuery() {
    return [
        {
            $lookup: {
                from: "journeys",
                localField: "journey",
                foreignField: "_id",
                as: "journeyInfo"
            }
        },
        { 
            $unwind: { 
                path: "$journeyInfo", 
                preserveNullAndEmptyArrays: true 
            } 
        }
    ];
}

module.exports = { buildGateListQuery };