import React from "react";
import GateList from "@/components/admin/gate/GateList.jsx";
import { GateService } from "@/services/GateService.jsx";

function Gate() {
    const fetchGate = async (page = 1) => {
        const limit = 12;
        const res = await GateService.fetchGate(page, limit);
        return {
            gates: res.gates || [],
            currentPage: res.currentPage,
            totalPages: res.totalPages,
            limit,
        };
    };

    const deleteGate = async (id) => {
        return await GateService.deleteGate(id);
    };

    return (
        <div className="admin-lesson-page">
            <GateList
                fetchData={fetchGate}
                deleteItem={deleteGate}
                title="DANH SÁCH CỔNG HỌC TẬP"
                dataKey="gates"
            />
        </div>
    );
}

export default Gate;