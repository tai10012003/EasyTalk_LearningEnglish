const { ObjectId } = require('mongodb');

async function calculateDifficultyStats(flashcardsCollection, listId) {
    const pipeline = [
        { 
            $match: { 
                flashcardList: new ObjectId(listId) 
            } 
        },
        { 
            $group: { 
                _id: { $ifNull: ["$difficulty", 2] }, 
                count: { $sum: 1 } 
            } 
        }
    ];
    const counts = await flashcardsCollection.aggregate(pipeline).toArray();
    const countMap = counts.reduce((acc, c) => { 
        acc[c._id] = c.count; 
        return acc; 
    }, {});
    return {
        toReview: (countMap[2] || 0) + (countMap[3] || 0),
        remembered: countMap[1] || 0,
        learning: countMap[2] || 0,
        hard: countMap[3] || 0
    };
}

function buildDifficultyUpdateOperations(updates, userId) {
    return updates.map(update => ({
        updateOne: {
            filter: { 
                _id: new ObjectId(update.cardId), 
                user: new ObjectId(userId) 
            },
            update: { 
                $set: { 
                    difficulty: update.difficulty 
                } 
            }
        }
    }));
}

module.exports = { calculateDifficultyStats, buildDifficultyUpdateOperations };