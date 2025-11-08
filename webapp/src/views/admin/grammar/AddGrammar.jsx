import React, { useState, useEffect } from "react";
import AddLesson from "@/components/admin/lesson/AddLesson";
import { GrammarService } from "@/services/GrammarService.jsx";
import Swal from "sweetalert2";

const AddGrammar = () => {
    const [existingGrammars, setExistingGrammars] = useState([]);

    useEffect(() => {
        const fetchGrammars = async () => {
            try {
                const data = await GrammarService.fetchGrammars(1, 10000);
                setExistingGrammars(data.grammars || []);
            } catch (err) {
                console.error("Error fetching grammars:", err);
            }
        };
        fetchGrammars();
    }, []);

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
    
    return <AddLesson onSubmit={handleSubmit} returnUrl="/admin/grammar" title="THÊM BÀI HỌC NGỮ PHÁP" existingItems={existingGrammars}/>;
};

export default AddGrammar;