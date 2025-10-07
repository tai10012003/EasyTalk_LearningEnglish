import React from "react";
import AddStory from "../../../components/admin/story/AddStory";
import { StoryService } from "@/services/StoryService.jsx";

const AddStoryPage = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await StoryService.addStory(data);
            alert("Bài học câu chuyện đã được thêm thành công!");
            window.location.href = "/admin/story";
            return res;
        } catch (err) {
            console.error("Error adding story:", err);
            alert("Có lỗi xảy ra khi thêm bài học câu chuyện");
        }
    };
    
    return (
        <AddStory
            onSubmit={handleSubmit}
            returnUrl="/admin/story"
            title="THÊM BÀI HỌC CÂU CHUYỆN"
        />
    );
};

export default AddStoryPage;