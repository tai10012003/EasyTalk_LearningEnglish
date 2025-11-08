import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UpdateUser from "@/components/admin/user/UpdateUser";
import { UserService } from "@/services/UserService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdateUserPage = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/user/api/${id}`, {
                    method: "GET",
                });
                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error("Error fetching user", err);
            }
        };
        fetchUser();
    },  [id]);

    const handleSubmit = async (formData, id) => {
        try {
            await UserService.updateUser(id, formData);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Cập nhật thông tin người dùng thành công!',
            });
            window.location.href = "/admin/user";
        } catch (err) {
            console.error("Error updating user:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi khi cập nhật thông tin người dùng!',
            });
        }
    };

    if (!user) return <p>Đang tải dữ liệu...</p>;

    return (
        <UpdateUser
            title="CẬP NHẬT THÔNG TIN NGƯỜI DÙNG"
            onSubmit={handleSubmit}
            returnUrl="/admin/user"
            initialData={user}
        />
    );
};

export default UpdateUserPage;