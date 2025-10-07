import React from "react";
import AddExercise from "../../../components/admin/exercise/AddExercise";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";

const AddGrammarExercise = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await GrammarExerciseService.addGrammarExercise(data);
            alert("Bài luyện tập ngữ pháp đã được thêm thành công!");
            window.location.href = "/admin/grammar-exercise";
            return res;
        } catch (err) {
            console.error("Error adding grammar:", err);
            alert("Có lỗi xảy ra khi thêm bài luyện tập ngữ pháp!");
        }
    };
    
    return <AddExercise onSubmit={handleSubmit} returnUrl="/admin/grammar-exercise" title="THÊM BÀI LUYỆN TẬP NGỮ PHÁP" />;
};

export default AddGrammarExercise;