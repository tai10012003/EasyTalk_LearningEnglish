import React from "react";
import AddStage from "../../../components/admin/stage/AddStage";
import { StageService } from "@/services/StageService.jsx";
import Swal from "sweetalert2";

const AddStagePage = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await StageService.addStage(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Chặng học tập đã được thêm thành công!',
            });
            window.location.href = "/admin/stage";
            return res;
        } catch (err) {
            console.error("Error adding stage:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm chặng học tập',
            });
        }
    };

    return <AddStage onSubmit={handleSubmit} returnUrl="/admin/stage" title="THÊM CHẶNG HỌC TẬP" />;
};

export default AddStagePage;