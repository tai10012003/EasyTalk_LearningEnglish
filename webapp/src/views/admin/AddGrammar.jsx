import React from "react";
import AddLesson from "../../components/admin/AddLesson";
import { GrammarService } from "@/services/GrammarService.jsx";

const AddGrammar = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await GrammarService.addGrammar(data);
            alert("Bài luyện tập ngữ pháp đã được thêm thành công!");
            window.location.href = "/admin/grammar";
            return res;
        } catch (err) {
            console.error("Error adding grammar:", err);
            alert("Có lỗi xảy ra khi thêm bài luyện tập ngữ pháp!");
        }
    };
    
    return <AddLesson onSubmit={handleSubmit} title="THÊM BÀI LUYỆN TẬP NGỮ PHÁP" />;
};

export default AddGrammar;