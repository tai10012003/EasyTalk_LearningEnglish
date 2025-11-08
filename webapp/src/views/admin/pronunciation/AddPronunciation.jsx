import React, { useState, useEffect } from "react";
import AddLesson from "@/components/admin/lesson/AddLesson";
import { PronunciationService } from "@/services/PronunciationService.jsx";
import Swal from "sweetalert2";

const AddPronunciation = () => {
    const [existingPronunciations, setExistingPronunciations] = useState([]);

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

    const handleSubmit = async (data) => {
        try {
            const res = await PronunciationService.addPronunciation(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài học phát âm đã được thêm thành công!',
            });
            window.location.href = "/admin/pronunciation";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài học phát âm!',
            });
        }
    };
    
    return <AddLesson onSubmit={handleSubmit} returnUrl="/admin/pronunciation" title="THÊM BÀI HỌC PHÁT ÂM" existingItems={existingPronunciations}/>
};

export default AddPronunciation;