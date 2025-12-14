import React, { useState, useEffect } from "react";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const FollowListModal = ({ userId, type = "followers", onClose, onFollowChanged }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = AuthService.getCurrentUser()?.id;

    const fetchList = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const list = type === "followers" ? await UserProgressService.getFollowersList(userId) : await UserProgressService.getFollowingList(userId);
            const safeList = list || [];
            if (!currentUserId) {
                setUsers(
                    safeList.map((u) => ({
                        ...u,
                        _id: u._id?.toString ? u._id.toString() : u._id,
                        isFollowedByCurrentUser: false,
                    }))
                );
                return;
            }
            const checked = await Promise.all(
                safeList.map(async (u) => {
                    try {
                        const stats = await UserProgressService.getFollowStats(u._id);
                        return {
                            ...u,
                            _id: u._id?.toString ? u._id.toString() : u._id,
                            isFollowedByCurrentUser: !!stats.isFollowing,
                        };
                    } catch (err) {
                        console.error("Lỗi kiểm tra follow của user", u, err);
                        return {
                            ...u,
                            _id: u._id?.toString ? u._id.toString() : u._id,
                            isFollowedByCurrentUser: false,
                        };
                    }
                })
            );
            setUsers(checked);
        } catch (err) {
            console.error("Lỗi tải danh sách:", err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFollow = async (targetUserId, targetUsername, currentlyFollowing) => {
        if (!currentUserId) {
            Swal.fire("Lỗi", "Bạn cần đăng nhập để thực hiện thao tác này.", "info");
            return;
        }
        if (currentUserId.toString() === targetUserId.toString()) {
            Swal.fire("Oops!", "Bạn không thể theo dõi chính mình!", "info");
            return;
        }
        try {
            if (currentlyFollowing) {
                const result = await Swal.fire({
                    title: "Hủy theo dõi?",
                    text: `Bạn có chắc muốn hủy theo dõi ${targetUsername}?`,
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonText: "Hủy theo dõi",
                    cancelButtonText: "Giữ lại",
                    confirmButtonColor: "#d33",
                });
                if (!result.isConfirmed) return;
                const response = await UserProgressService.unfollowUser(targetUserId);
                onFollowChanged?.();
                if (response?.alreadyUnfollowed) {
                    Swal.fire("Thông báo", "Bạn đã hủy theo dõi từ trước rồi!", "info");
                    setUsers(prev =>
                        prev.map(u => u._id.toString() === targetUserId.toString() ? { ...u, isFollowedByCurrentUser: false } : u)
                    );
                } else {
                    setUsers(prev =>
                        prev.map(u => u._id.toString() === targetUserId.toString() ? { ...u, isFollowedByCurrentUser: false } : u)
                    );
                    Swal.fire("Đã hủy!", `Bạn đã hủy theo dõi ${targetUsername}`, "success");
                }
            } else {
                const response = await UserProgressService.followUser(targetUserId);
                onFollowChanged?.();
                if (response?.alreadyFollowing) {
                    Swal.fire("Thông báo", `Bạn đã theo dõi ${targetUsername} từ trước rồi!`, "info");
                    setUsers(prev =>
                        prev.map(u => u._id.toString() === targetUserId.toString() ? { ...u, isFollowedByCurrentUser: true } : u)
                    );
                } else {
                    setUsers(prev =>
                        prev.map(u => u._id.toString() === targetUserId.toString() ? { ...u, isFollowedByCurrentUser: true } : u)
                    );
                    Swal.fire("Thành công!", `Bạn đã theo dõi ${targetUsername}! Cùng cố lên nào!`,"success");
                }
            }
        } catch (err) {
            console.error("Lỗi thao tác follow:", err);
            Swal.fire("Lỗi", "Không thể thực hiện thao tác", "error");
        }
    };

    useEffect(() => {
        fetchList();
    }, [userId, type]);

    const title = type === "followers" ? "Người theo dõi" : "Người đang theo dõi";

    return (
        <div className="user-statistic-modal-overlay" onClick={onClose}>
            <div className="user-statistic-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-statistic-modal-header bg-indigo-600">
                    <h5>{title} ({users.length})</h5>
                    <button onClick={onClose} className="user-statistic-modal-close">×</button>
                </div>
                <div className="user-statistic-modal-body">
                    {loading ? (
                        <div className="text-center py-12">
                            <i className="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-center text-gray-500 py-12 text-lg">
                            Chưa có {type === "followers" ? "người theo dõi" : "người nào đang theo dõi"}
                        </p>
                    ) : (
                        <div className="user-statistic-card-list">
                            {users.map(user => {
                                const isFollowing = !!user.isFollowedByCurrentUser;
                                return (
                                    <div
                                        key={user._id}
                                        className="user-statistic-card-item"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: "bold", fontSize: "18px", color: "#1f2937" }}>
                                                @{user.username}
                                            </div>
                                            <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
                                                {user.email}
                                            </div>
                                        </div>
                                        {currentUserId && currentUserId.toString() !== user._id.toString() && (
                                            <button
                                                onClick={() => handleToggleFollow(user._id, user.username, isFollowing)}
                                                style={{
                                                    padding: "10px 24px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                    backgroundColor: isFollowing ? "#fa4c4cff" : "#6366f1",
                                                    color: "#ffffff",
                                                    transition: "all 0.2s"
                                                }}
                                                onMouseOver={e => {
                                                    e.target.style.backgroundColor = isFollowing ? "#d31818ff" : "#4f46e5";
                                                }}
                                                onMouseOut={e => {
                                                    e.target.style.backgroundColor = isFollowing ? "#fa4c4cff" : "#6366f1";
                                                }}
                                            >
                                                {isFollowing ? "Hủy theo dõi" : "Theo dõi"}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="user-statistic-modal-footer">
                    <button onClick={onClose} className="user-statistic-modal-btn">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FollowListModal;