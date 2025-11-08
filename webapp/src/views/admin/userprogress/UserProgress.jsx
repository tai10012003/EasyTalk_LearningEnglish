import React from "react";
import UserProgressList from "@/components/admin/userprogress/UserProgressList.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";

function UserProgress() {
    const fetchUserProgress = async (page = 1) => {
        const data = await UserProgressService.fetchUserProgressList(page, 12);
        return {
            userprogress: data.userprogresses || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteUserProgress = async (id) => {
        return await UserProgressService.deleteUserProgress(id);
    };

    return (
        <div className="admin-lesson-page">
            <UserProgressList
                fetchData={fetchUserProgress}
                deleteItem={deleteUserProgress}
                title="DANH SÁCH TIẾN TRÌNH NGƯỜI DÙNG"
                dataKey="userprogress"
                detailUrl="/admin/userprogress"
            />
        </div>
    );
}

export default UserProgress;