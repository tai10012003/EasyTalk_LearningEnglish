import React from "react";
import AddLesson from "../../../components/admin/lesson/AddLesson";
import { GrammarService } from "@/services/GrammarService.jsx";
import Swal from "sweetalert2";

const AddGrammar = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await GrammarService.addGrammar(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài học ngữ pháp đã được thêm thành công!',
            });
            window.location.href = "/admin/grammar";
            return res;
        } catch (err) {
            console.error("Error adding grammar:", err);
            Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài học ngữ pháp!',
            });
        }
    };
    
    return <AddLesson onSubmit={handleSubmit} returnUrl="/admin/grammar" title="THÊM BÀI HỌC NGỮ PHÁP" />;
};

export default AddGrammar;