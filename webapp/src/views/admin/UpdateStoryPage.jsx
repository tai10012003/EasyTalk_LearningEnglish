import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateStory from "../../components/admin/UpdateStory";
import { StoryService } from "@/services/StoryService.jsx";

const UpdateStoryPage = () => {
    const { id } = useParams();
    const [story, setStory] = useState(null);

    useEffect(() => {
        const fetchStory = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/story/api/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setStory(data);
            } catch (err) {
                console.error("Error fetching story:", err);
            }
        };
        fetchStory();
    }, [id]);

    const handleSubmit = async (formData, id) => {
        try {
            await StoryService.updateStory(id, formData);
            alert("Cập nhật bài học câu chuyện thành công!");
            window.location.href = "/admin/story";
        } catch (err) {
            console.error("Error updating story:", err);
            alert("Có lỗi khi cập nhật!");
        }
    };

    if (!story) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateStory
            title="CẬP NHẬT BÀI HỌC CÂU CHUYỆN"
            onSubmit={handleSubmit}
            returnUrl="/admin/story"
            initialData={story}
        />
    );
};

export default UpdateStoryPage;