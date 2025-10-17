import React from "react";
import AddUser from "../../../components/admin/user/AddUser";
import { UserService } from "@/services/UserService.jsx";
import Swal from "sweetalert2";

const AddUserPage = () => {
    const handleSubmit = async (data) => {
        try {
            const res = await UserService.addUser(data);
            await Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Người dùng mới đã được thêm thành công!',
            });
            window.location.href = "/admin/user";
            return res;
        } catch (err) {
            console.error("Error adding user:", err);
            await Swal.fire({
                icon: 'error',
                title: 'Thất bại!',
                text: 'Có lỗi xảy ra khi thêm người dùng mới!',
            });
        }
    };
    
    return <AddUser onSubmit={handleSubmit} returnUrl="/admin/user" title="THÊM NGƯỜI DÙNG MỚI" />;
};

export default AddUserPage;