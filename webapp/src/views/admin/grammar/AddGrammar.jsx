import React from "react";
import AddLesson from "../../../components/admin/lesson/AddLesson";
import { GrammarService } from "@/services/GrammarService.jsx";

const AddGrammar = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await GrammarService.addGrammar(data);
            alert("Bài học ngữ pháp đã được thêm thành công!");
            window.location.href = "/admin/grammar";
            return res;
        } catch (err) {
            console.error("Error adding grammar:", err);
            alert("Có lỗi xảy ra khi thêm bài học ngữ pháp!");
        }
    };
    
    return <AddLesson onSubmit={handleSubmit} returnUrl="/admin/grammar" title="THÊM BÀI HỌC NGỮ PHÁP" />;
};

export default AddGrammar;