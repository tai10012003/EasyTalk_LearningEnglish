import React from "react";
import StoryList from "@/components/admin/story/StoryList.jsx";
import { StoryService } from "@/services/StoryService.jsx";

function Story() {
    const fetchStory = async (page = 1) => {
        const data = await StoryService.fetchStories(page, 6, { admin: true });
        return {
            stories: data.data || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteStory = async (id) => {
        return await StoryService.deleteStory(id);
    };

    return (
        <div className="admin-story-page">
            <StoryList
                fetchData={fetchStory}
                deleteItem={deleteStory}
                title="DANH SÁCH BÀI HỌC CÂU CHUYỆN"
                dataKey="stories"
                addUrl="/admin/story/add"
                updateUrl="/admin/story/update"
                translateUrl="/admin/story/translate"
            />
        </div>
    );
}

export default Story;
