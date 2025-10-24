import React from "react";
import UserList from "@/components/admin/user/UserList.jsx";
import { UserService } from "@/services/UserService.jsx";

function User() {
    const fetchUser = async (page = 1, role = "") => {
        const data = await UserService.fetchUser(page, 12, { role })
        return {
            users: data.data || [],
            currentPage: data.currentPage,
            totalPages: data.totalPages,
        };
    };

    const deleteUser = async (id) => {
        return await UserService.deleteUser(id);
    };

    return (
        <div className="admin-lesson-page">
            <UserList
                fetchData={fetchUser}
                deleteItem={deleteUser}
                title="DANH SÁCH NGƯỜI DÙNG"
                dataKey="users"
                addUrl="/admin/user/add"
                updateUrl="/admin/user/update"
            />
        </div>
    );
}

export default User;