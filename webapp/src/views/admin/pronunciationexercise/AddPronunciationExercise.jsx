import React from "react";
import AddExercise from "../../../components/admin/exercise/AddExercise";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";

const AddPronunciationExercise = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await PronunciationExerciseService.addPronunciationExercise(data);
            alert("Bài luyện tập phát âm đã được thêm thành công!");
            window.location.href = "/admin/pronunciation-exercise";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            alert("Có lỗi xảy ra khi thêm bài luyện tập phát âm!");
        }
    };
    
    return <AddExercise onSubmit={handleSubmit} returnUrl="/admin/pronunciation-exercise" title="THÊM BÀI LUYỆN TẬP PHÁT ÂM" isPronunciationPage={true} />;
};

export default AddPronunciationExercise;