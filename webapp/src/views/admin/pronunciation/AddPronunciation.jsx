import React from "react";
import AddLesson from "../../../components/admin/lesson/AddLesson";
import { PronunciationService } from "@/services/PronunciationService.jsx";

const AddPronunciation = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await PronunciationService.addPronunciation(data);
            alert("Bài học phát âm đã được thêm thành công!");
            window.location.href = "/admin/pronunciation";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            alert("Có lỗi xảy ra khi thêm bài học phát âm!");
        }
    };
    
    return <AddLesson onSubmit={handleSubmit} returnUrl="/admin/pronunciation" title="THÊM BÀI HỌC PHÁT ÂM" />;
};

export default AddPronunciation;