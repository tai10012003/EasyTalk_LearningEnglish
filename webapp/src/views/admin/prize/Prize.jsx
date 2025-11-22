import React from "react";
import PrizeList from "@/components/admin/prize/PrizeList.jsx";
import { PrizeService } from "@/services/PrizeService.jsx";

function Prize() {
    const fetchPrize = async (page = 1) => {
        const data = await PrizeService.fetchPrizes(page, 12);
        return {
            prizes: data.data || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deletePrize = async (id) => {
        return await PrizeService.deletePrize(id);
    };

    return (
        <div className="admin-prize-page">
            <PrizeList
                fetchData={fetchPrize}
                deleteItem={deletePrize}
                title="DANH SÁCH PHẦN THƯỞNG"
                dataKey="prizes"
                addUrl="/admin/prize/add"
                updateUrl="/admin/prize/update"
            />
        </div>
    );
}

export default Prize;