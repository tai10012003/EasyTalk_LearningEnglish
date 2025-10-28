import React, { useState, useEffect } from "react";
import AddStory from "../../../components/admin/story/AddStory";
import { StoryService } from "@/services/StoryService.jsx";
import Swal from "sweetalert2";

const AddStoryPage = () => {
    const [existingStories, setExistingStories] = useState([]);

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

    const handleSubmit = async (data) => {
        try {
            const res = await StoryService.addStory(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Bài học câu chuyện đã được thêm thành công!',
            });
            window.location.href = "/admin/story";
            return res;
        } catch (err) {
            console.error("Error adding story:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm bài học câu chuyện',
            });
        }
    };
        
    return (
        <AddStory
            onSubmit={handleSubmit}
            returnUrl="/admin/story"
            title="THÊM BÀI HỌC CÂU CHUYỆN"
            existingItems={existingStories}
        />
    );
};

export default AddStoryPage;