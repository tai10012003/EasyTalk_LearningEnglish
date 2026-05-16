const { ObjectId } = require('mongodb');

function buildFlashcardListQuery() {
    return [
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userObj"
            }
        },
        {
            $addFields: {
                username: { $arrayElemAt: ["$userObj.username", 0] }
            }
        },
        { 
            $project: { 
                userObj: 0 
            } 
        }
    ];
}

function buildFlashcardListByIdQuery(id) {
    return [
        { 
            $match: { 
                _id: new ObjectId(id) 
            } 
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userObj"
            }
        },
        {
            $addFields: {
                username: { $arrayElemAt: ["$userObj.username", 0] }
            }
        },
        { 
            $project: { 
                userObj: 0 
            } 
        }
    ];
}

function buildFlashcardByListQuery(listId) {
    return [
        { 
            $match: { 
                flashcardList: new ObjectId(listId) 
            } 
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userObj"
            }
        },
        {
            $addFields: {
                username: { $arrayElemAt: ["$userObj.username", 0] }
            }
        },
        { 
            $project: { 
                userObj: 0 
            } 
        }
    ];
}

function buildFlashcardByIdQuery(id) {
    return [
        { 
            $match: { 
                _id: new ObjectId(id) 
            } 
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userObj"
            }
        },
        {
            $addFields: {
                username: { $arrayElemAt: ["$userObj.username", 0] }
            }
        },
        { 
            $project: { 
                userObj: 0 
            } 
        }
    ];
}

module.exports = { buildFlashcardListQuery, buildFlashcardListByIdQuery, buildFlashcardByListQuery, buildFlashcardByIdQuery };