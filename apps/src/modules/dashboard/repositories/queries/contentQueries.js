function buildCompletionStatsQuery(field) {
    return [
        { 
            $project: { 
                count: { 
                    $size: { $ifNull: [`$${field}`, []] } 
                } 
            } 
        },
        { 
            $group: { 
                _id: null, 
                total: { $sum: "$count" } 
            } 
        }
    ];
}

function buildPopularContentQuery(field, collection, type, sortOrder = -1) {
    return [
        { $unwind: `$${field}` },
        { 
            $group: { 
                _id: `$${field}`, 
                count: { $sum: 1 } 
            } 
        },
        { $sort: { count: sortOrder } },
        { $limit: 1 },
        {
            $lookup: {
                from: collection,
                localField: '_id',
                foreignField: '_id',
                as: 'details'
            }
        },
        { $unwind: "$details" },
        {
            $project: {
                _id: 1,
                title: "$details.title",
                count: 1,
                type: { $literal: type }
            }
        }
    ];
}

const CONTENT_COLLECTIONS = {
    lessons: [
        { field: 'unlockedGrammars', collection: 'grammars', type: 'Ngữ Pháp' },
        { field: 'unlockedPronunciations', collection: 'pronunciations', type: 'Phát Âm' },
        { field: 'unlockedStories', collection: 'stories', type: 'Câu Chuyện' }
    ],
    exercises: [
        { field: 'unlockedGrammarExercises', collection: 'grammarexercises', type: 'Ngữ Pháp' },
        { field: 'unlockedPronunciationExercises', collection: 'pronunciationexercises', type: 'Phát Âm' },
        { field: 'unlockedVocabularyExercises', collection: 'vocabularyexercises', type: 'Từ Vựng' },
        { field: 'unlockedDictations', collection: 'dictationexercises', type: 'Nghe Chép Chính Tả' }
    ]
};

module.exports = { buildCompletionStatsQuery, buildPopularContentQuery, CONTENT_COLLECTIONS };