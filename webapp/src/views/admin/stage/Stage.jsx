import React from "react";
import StageList from "@/components/admin/stage/StageList.jsx";
import { StageService } from "@/services/StageService.jsx";

function Stage() {
    const fetchStage = async (page = 1) => {
        const data = await StageService.fetchStage(page, 6);
        return {
            stages: data.data || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteStage = async (id) => {
        return await StageService.deleteStage(id);
    };

    return (
        <div className="admin-lesson-page">
            <StageList
                fetchData={fetchStage}
                deleteItem={deleteStage}
                title="DANH SÁCH CHẶNG HỌC TẬP"
                dataKey="stages"
                addUrl="/admin/stage/add"
                updateUrl="/admin/stage/update"
            />
        </div>
    );
}

export default Stage;