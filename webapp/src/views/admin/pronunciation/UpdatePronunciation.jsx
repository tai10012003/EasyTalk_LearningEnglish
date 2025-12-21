import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateLesson from "@/components/admin/lesson/UpdateLesson";
import { PronunciationService } from "@/services/PronunciationService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdatePronunciation = () => {
    const { id } = useParams();
    const [existingPronunciations, setExistingPronunciations] = useState([]);
    const [pronunciation, setPronunciation] = useState(null);

    const PRONUNCIATION_MODULES_BY_LEVEL = {
        A1: [
            { value: "Module 1: Bảng Chữ Cái và Âm Cơ Bản", label: "Module 1: Bảng Chữ Cái và Âm Cơ Bản" },
            { value: "Module 2: Phụ Âm Cơ Bản (Phần 1)", label: "Module 2: Phụ Âm Cơ Bản (Phần 1)" },
            { value: "Module 3: Phụ Âm Cơ Bản (Phần 2)", label: "Module 3: Phụ Âm Cơ Bản (Phần 2)" },
            { value: "Module 4: Phụ Âm và Nguyên Âm Đặc Biệt", label: "Module 4: Phụ Âm và Nguyên Âm Đặc Biệt" },
        ],
        A2: [
            { value: "Module 5: Âm Cuối (Final Sounds)", label: "Module 5: Âm Cuối (Final Sounds)" },
            { value: "Module 6: Trọng Âm Từ Cơ Bản", label: "Module 6: Trọng Âm Từ Cơ Bản" },
            { value: "Module 7: Nối Âm Cơ Bản (Linking)", label: "Module 7: Nối Âm Cơ Bản (Linking)" },
            { value: "Module 8: Âm Yếu và Mạnh (Weak Forms)", label: "Module 8: Âm Yếu và Mạnh (Weak Forms)" },
        ],
        B1: [
            { value: "Module 9: Cụm Phụ Âm Đầu", label: "Module 9: Cụm Phụ Âm Đầu" },
            { value: "Module 10: Cụm Phụ Âm Cuối Nâng Cao", label: "Module 10: Cụm Phụ Âm Cuối Nâng Cao" },
            { value: "Module 11: Trọng Âm Từ Nâng Cao", label: "Module 11: Trọng Âm Từ Nâng Cao" },
            { value: "Module 12: Ngữ Điệu Cơ Bản (Intonation)", label: "Module 12: Ngữ Điệu Cơ Bản (Intonation)" },
            { value: "Module 13: Nhịp Điệu (Rhythm)", label: "Module 13: Nhịp Điệu (Rhythm)" },
            { value: "Module 14: Rút Gọn và Liên Âm", label: "Module 14: Rút Gọn và Liên Âm" },
        ],
        B2: [
            { value: "Module 15: Âm Tiết và Âm Tiết Yếu", label: "Module 15: Âm Tiết và Âm Tiết Yếu" },
            { value: "Module 16: Đồng Hóa Âm (Assimilation)", label: "Module 16: Đồng Hóa Âm (Assimilation)" },
            { value: "Module 17: Nuốt Âm (Elision)", label: "Module 17: Nuốt Âm (Elision)" },
            { value: "Module 18: Nối Âm Nâng Cao", label: "Module 18: Nối Âm Nâng Cao" },
            { value: "Module 19: Trọng Âm Câu (Sentence Stress)", label: "Module 19: Trọng Âm Câu (Sentence Stress)" },
            { value: "Module 20: Ngữ Điệu Nâng Cao", label: "Module 20: Ngữ Điệu Nâng Cao" },
        ],
        C1: [
            { value: "Module 21: Giọng Anh - Mỹ So Sánh", label: "Module 21: Giọng Anh - Mỹ So Sánh" },
            { value: "Module 22: Âm Khó và Dễ Nhầm", label: "Module 22: Âm Khó và Dễ Nhầm" },
            { value: "Module 23: Phát Âm Chuyên Sâu", label: "Module 23: Phát Âm Chuyên Sâu" },
            { value: "Module 24: Âm Thanh Liên Kết (Connected Speech)", label: "Module 24: Âm Thanh Liên Kết (Connected Speech)" },
            { value: "Module 25: Trọng Âm Từ Đặc Biệt", label: "Module 25: Trọng Âm Từ Đặc Biệt" },
            { value: "Module 26: Ngữ Điệu Tinh Tế", label: "Module 26: Ngữ Điệu Tinh Tế" },
            { value: "Module 27: Giọng Điệu Địa Phương (Accents)", label: "Module 27: Giọng Điệu Địa Phương (Accents)" },
            { value: "Module 28: Phát Âm Học Thuật và Chuyên Ngành", label: "Module 28: Phát Âm Học Thuật và Chuyên Ngành" },
            { value: "Module 29: Kỹ Thuật Luyện Phát Âm Chuyên Sâu", label: "Module 29: Kỹ Thuật Luyện Phát Âm Chuyên Sâu" },
            { value: "Module 30: Hoàn Thiện và Ứng Dụng", label: "Module 30: Hoàn Thiện và Ứng Dụng" },
        ],
    };

    useEffect(() => {
        const fetchPronunciation = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/pronunciation/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setPronunciation(data);
            } catch (err) {
                console.error("Error fetching pronunciation:", err);
            }
        };
        fetchPronunciation();
    },  [id]);

    useEffect(() => {
        const fetchPronunciations = async () => {
            try {
                const data = await PronunciationService.fetchPronunciations(1, 10000);
                setExistingPronunciations(data.pronunciations || []);
            } catch (err) {
                console.error("Error fetching pronunciations:", err);
            }
        };
        fetchPronunciations();
    }, []);

    const handleSubmit = async (formData, id) => {
        try {
            const res = await PronunciationService.updatePronunciation(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài học phát âm đã được cập nhật thành công!',
            });
            window.location.href = "/admin/pronunciation";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài học phát âm!',
            });
        }
    };

    if (!pronunciation) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateLesson
            title="CẬP NHẬT BÀI HỌC PHÁT ÂM"
            onSubmit={handleSubmit}
            returnUrl="/admin/pronunciation"
            initialData={pronunciation}
            existingItems={existingPronunciations}
            modulesByLevel={PRONUNCIATION_MODULES_BY_LEVEL}
        />
    );
};

export default UpdatePronunciation;