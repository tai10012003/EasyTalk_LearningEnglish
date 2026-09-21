const { ObjectId } = require('mongodb');

function buildAllJourneysWithDetailsQuery() {
    return [
        {
            $lookup: {
                from: 'gates',
                localField: '_id',
                foreignField: 'journey',
                as: 'gates'
            }
        },
        { 
            $unwind: { 
                path: "$gates", 
                preserveNullAndEmptyArrays: true 
            } 
        },
        {
            $lookup: {
                from: 'stages',
                localField: 'gates._id',
                foreignField: 'gate',
                as: 'gates.stages'
            }
        },
        {
            $group: {
                _id: "$_id",
                title: { $first: "$title" },
                createdAt: { $first: "$createdAt" },
                gates: { $push: "$gates" }
            }
        }
    ];
}

function buildJourneyWithDetailsQuery(journeyId) {
    return [
        { 
            $match: { 
                _id: new ObjectId(journeyId) 
            } 
        },
        {
            $lookup: {
                from: 'gates',
                localField: 'gates',
                foreignField: '_id',
                as: 'gates'
            }
        },
        { 
            $unwind: { 
                path: "$gates", 
                preserveNullAndEmptyArrays: true 
            } 
        },
        {
            $lookup: {
                from: 'stages',
                localField: 'gates.stages',
                foreignField: '_id',
                as: 'gates.stages'
            }
        },
        {
            $group: {
                _id: "$_id",
                title: { $first: "$title" },
                gates: { $push: "$gates" }
            }
        }
    ];
}

module.exports = { buildAllJourneysWithDetailsQuery, buildJourneyWithDetailsQuery };