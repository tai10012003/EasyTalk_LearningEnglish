import React from "react";
import AddStage from "../../../components/admin/stage/AddStage";
import { StageService } from "@/services/StageService.jsx";

const AddStagePage = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await StageService.addStage(data);
            alert("Chặng học tập đã được thêm thành công!");
            window.location.href = "/admin/stage";
            return res;
        } catch (err) {
            console.error("Error adding stage:", err);
            alert("Có lỗi xảy ra khi thêm chặng học tập");
        }
    };
    
    return <AddStage onSubmit={handleSubmit} returnUrl="/admin/stage" title="THÊM CHẶNG HỌC TẬP" />;
};

export default AddStagePage;