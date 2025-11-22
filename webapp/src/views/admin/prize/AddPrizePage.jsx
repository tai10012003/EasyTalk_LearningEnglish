import React from "react";
import AddPrize from "@/components/admin/prize/AddPrize";
import { PrizeService } from "@/services/PrizeService.jsx";
import Swal from "sweetalert2";

const AddPrizePage = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await PrizeService.addPrize(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Phần thưởng mới đã được thêm thành công!',
            });
            window.location.href = "/admin/prize";
            return res;
        } catch (err) {
            console.error("Error adding prize:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm phần thưởng mới!',
            });
        }
    };
    
    return <AddPrize onSubmit={handleSubmit} returnUrl="/admin/prize" title="THÊM PHẦN THƯỞNG MỚI" />;
};

export default AddPrizePage;