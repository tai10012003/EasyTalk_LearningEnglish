import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateStory from "@/components/admin/story/UpdateStory";
import { StoryService } from "@/services/StoryService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdateStoryPage = () => {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [existingStories, setExistingStories] = useState([]);

    useEffect(() => {
        const fetchStory = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/story/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setStory(data);
            } catch (err) {
                console.error("Error fetching story:", err);
            }
        };
        fetchStory();
    }, [id]);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const data = await StoryService.fetchStories(1, 10000);
                setExistingStories(data.data || []);
            } catch (err) {
                console.error("Error fetching stories:", err);
            }
        };
        fetchStories();
    }, []);

    const handleSubmit = async (formData, id) => {
        try {
            const res = await StoryService.updateStory(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Cập nhật bài học câu chuyện thành công!',
            });
            window.location.href = "/admin/story";
            return res;
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi cập nhật bài học câu chuyện!',
            });
        }
    };

    if (!story) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateStory
            title="CẬP NHẬT BÀI HỌC CÂU CHUYỆN"
            onSubmit={handleSubmit}
            returnUrl="/admin/story"
            initialData={story}
            existingItems={existingStories}
        />
    );
};

export default UpdateStoryPage;