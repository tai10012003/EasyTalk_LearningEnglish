import React from "react";
import JourneyList from "@/components/admin/journey/JourneyList.jsx";
import { JourneyService } from "@/services/JourneyService.jsx";

function Journey() {
    const fetchJourney = async (page = 1) => {
        const limit = 6;
        const res = await JourneyService.fetchJourneyAdmin(page, limit);
        return {
            journeys: res.journeys || [],
            currentPage: res.currentPage,
            totalPages: res.totalPages,
        };
    };

    const deleteJourney = async (id) => {
        return await JourneyService.deleteJourney(id);
    };

    return (
        <div className="admin-lesson-page">
            <JourneyList
                fetchData={fetchJourney}
                deleteItem={deleteJourney}
                title="DANH SÁCH HÀNH TRÌNH HỌC TẬP"
                dataKey="journeys"
            />
        </div>
    );
}

export default Journey;