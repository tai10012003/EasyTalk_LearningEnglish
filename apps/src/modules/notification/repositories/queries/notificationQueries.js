function buildAdminNotificationsQuery() {
    return [
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userInfo"
            }
        },
        {
            $unwind: {
                path: "$userInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                title: 1,
                message: 1,
                type: 1,
                link: 1,
                isRead: 1,
                createdAt: 1,
                "userInfo._id": 1,
                "userInfo.username": 1,
                "userInfo.email": 1
            }
        },
        { $sort: { createdAt: -1 } }
    ];
}

module.exports = { buildAdminNotificationsQuery };