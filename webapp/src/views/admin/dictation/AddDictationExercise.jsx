import React from "react";
import AddDictation from "../../../components/admin/dictation/AddDictation";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";

const AddDictationExercise = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await DictationExerciseService.addDictationExercise(data);
            alert("Bài luyện tập nghe chép chính tả đã được thêm thành công!");
            window.location.href = "/admin/dictation-exercise";
            return res;
        } catch (err) {
            console.error("Error adding dictation:", err);
            alert("Có lỗi xảy ra khi thêm bài luyện tập nghe chép chính tả!");
        }
    };
    
    return <AddDictation onSubmit={handleSubmit} returnUrl="/admin/dictation-exercise" title="THÊM BÀI LUYỆN TẬP NGHE CHÉP CHÍNH TẢ" />;
};

export default AddDictationExercise;