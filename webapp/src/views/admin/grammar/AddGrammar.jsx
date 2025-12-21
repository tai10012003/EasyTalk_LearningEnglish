import React, { useState, useEffect } from "react";
import AddLesson from "@/components/admin/lesson/AddLesson";
import { GrammarService } from "@/services/GrammarService.jsx";
import Swal from "sweetalert2";

const AddGrammar = () => {
    const [existingGrammars, setExistingGrammars] = useState([]);

    const GRAMMAR_MODULES_BY_LEVEL = {
        A1: [
            { value: "Module 1: Nền Tảng Căn Bản", label: "Module 1: Nền Tảng Căn Bản" },
            { value: "Module 2: Thì Hiện Tại Đơn", label: "Module 2: Thì Hiện Tại Đơn" },
            { value: "Module 3: Câu Hỏi và Lượng Từ", label: "Module 3: Câu Hỏi và Lượng Từ" },
            { value: "Module 4: Thì Hiện Tại Tiếp Diễn", label: "Module 4: Thì Hiện Tại Tiếp Diễn" },
        ],
        A2: [
            { value: "Module 5: Thì Quá Khứ", label: "Module 5: Thì Quá Khứ" },
            { value: "Module 6: Thì Tương Lai và So Sánh", label: "Module 6: Thì Tương Lai và So Sánh" },
            { value: "Module 7: So Sánh Nhất và Động Từ Khuyết Thiếu", label: "Module 7: So Sánh Nhất và Động Từ Khuyết Thiếu" },
            { value: "Module 8: Đại Từ và Liên Từ", label: "Module 8: Đại Từ và Liên Từ" },
        ],
        B1: [
            { value: "Module 9: Thì Hiện Tại Hoàn Thành", label: "Module 9: Thì Hiện Tại Hoàn Thành" },
            { value: "Module 10: Thì Quá Khứ Tiếp Diễn", label: "Module 10: Thì Quá Khứ Tiếp Diễn" },
            { value: "Module 11: Câu Điều Kiện và Bị Động", label: "Module 11: Câu Điều Kiện và Bị Động" },
            { value: "Module 12: Động Từ Khuyết Thiếu Nâng Cao", label: "Module 12: Động Từ Khuyết Thiếu Nâng Cao" },
            { value: "Module 13: Mệnh Đề Quan Hệ Cơ Bản", label: "Module 13: Mệnh Đề Quan Hệ Cơ Bản" },
            { value: "Module 14: Câu Gián Tiếp", label: "Module 14: Câu Gián Tiếp" },
        ],
        B2: [
            { value: "Module 15: Thì Hoàn Thành Nâng Cao", label: "Module 15: Thì Hoàn Thành Nâng Cao" },
            { value: "Module 16: Câu Điều Kiện Nâng Cao", label: "Module 16: Câu Điều Kiện Nâng Cao" },
            { value: "Module 17: Câu Bị Động Nâng Cao", label: "Module 17: Câu Bị Động Nâng Cao" },
            { value: "Module 18: Động Từ Nguyên Mẫu và V-ing", label: "Module 18: Động Từ Nguyên Mẫu và V-ing" },
            { value: "Module 19: Mệnh Đề và Liên Từ Phức", label: "Module 19: Mệnh Đề và Liên Từ Phức" },
            { value: "Module 20: Rút Gọn Mệnh Đề", label: "Module 20: Rút Gọn Mệnh Đề" },
        ],
        C1: [
            { value: "Module 21: Đảo Ngữ Nâng Cao", label: "Module 21: Đảo Ngữ Nâng Cao" },
            { value: "Module 22: Câu Giả Định (Subjunctive)", label: "Module 22: Câu Giả Định (Subjunctive)" },
            { value: "Module 23: Động Từ Khiếm Khuyết trong Quá Khứ", label: "Module 23: Động Từ Khiếm Khuyết trong Quá Khứ" },
            { value: "Module 24: Cấu Trúc Nâng Cao", label: "Module 24: Cấu Trúc Nâng Cao" },
            { value: "Module 25: Mệnh Đề Quan Hệ Nâng Cao", label: "Module 25: Mệnh Đề Quan Hệ Nâng Cao" },
            { value: "Module 26: Câu Bị Động Đặc Biệt", label: "Module 26: Câu Bị Động Đặc Biệt" },
            { value: "Module 27: Liên Từ và Cụm Liên Từ Học Thuật", label: "Module 27: Liên Từ và Cụm Liên Từ Học Thuật" },
            { value: "Module 28: Câu Phức và Rút Gọn Nâng Cao", label: "Module 28: Câu Phức và Rút Gọn Nâng Cao" },
            { value: "Module 29: Cấu Trúc So Sánh Đặc Biệt", label: "Module 29: Cấu Trúc So Sánh Đặc Biệt" },
            { value: "Module 30: Hoàn Thiện Ngữ Pháp", label: "Module 30: Hoàn Thiện Ngữ Pháp" },
        ],
    };

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
    
    return <AddLesson onSubmit={handleSubmit} returnUrl="/admin/grammar" title="THÊM BÀI HỌC NGỮ PHÁP" existingItems={existingGrammars} modulesByLevel={GRAMMAR_MODULES_BY_LEVEL} />;
};

export default AddGrammar;