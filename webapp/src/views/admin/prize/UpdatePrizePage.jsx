import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdatePrize from "@/components/admin/prize/UpdatePrize";
import { PrizeService } from "@/services/PrizeService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdatePrizePage = () => {
    const { id } = useParams();
    const [prize, setPrize] = useState(null);

    useEffect(() => {
        const fetchPrize = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/prize/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setPrize(data);
            } catch (err) {
                console.error("Error fetching prize", err);
            }
        };
        fetchPrize();
    },  [id]);

    const handleSubmit = async (formData, id) => {
        try {
            await PrizeService.updatePrize(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Cập nhật thông tin giải thưởng thành công!',
            });
            window.location.href = "/admin/prize";
        } catch (err) {
            console.error("Error updating prize:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi khi cập nhật thông tin giải thưởng!',
            });
        }
    };

    if (!prize) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdatePrize
            title="CẬP NHẬT THÔNG TIN GIẢI THƯỞNG"
            onSubmit={handleSubmit}
            returnUrl="/admin/prize"
            initialData={prize}
        />
    );
};

export default UpdatePrizePage;