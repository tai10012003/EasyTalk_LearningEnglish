import React from "react";
import AddLesson from "../../../components/admin/lesson/AddLesson";
import { PronunciationService } from "@/services/PronunciationService.jsx";
import Swal from "sweetalert2";

const AddPronunciation = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await PronunciationService.addPronunciation(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài học phát âm đã được thêm thành công!',
            });
            window.location.href = "/admin/pronunciation";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài học phát âm!',
            });
        }
    };
    
    return <AddLesson onSubmit={handleSubmit} returnUrl="/admin/pronunciation" title="THÊM BÀI HỌC PHÁT ÂM" />;
};

export default AddPronunciation;