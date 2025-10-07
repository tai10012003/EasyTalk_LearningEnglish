import React from "react";
import AddExercise from "../../../components/admin/exercise/AddExercise";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";

const AddVocabularyExercise = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await VocabularyExerciseService.addVocabularyExercise(data);
            alert("Bài luyện tập từ vựng đã được thêm thành công!");
            window.location.href = "/admin/vocabulary-exercise";
            return res;
        } catch (err) {
            console.error("Error adding vocabulary:", err);
            alert("Có lỗi xảy ra khi thêm bài luyện tập từ vựng!");
        }
    };
    
    return <AddExercise onSubmit={handleSubmit} returnUrl="/admin/vocabulary-exercise" title="THÊM BÀI LUYỆN TẬP TỪ VỰNG" />;
};

export default AddVocabularyExercise;