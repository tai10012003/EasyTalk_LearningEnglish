import React from "react";

function Dashboard() {
    return (
        <div className="admin-dashboard">
            <h1 className="admin-dashboard-title">Dashboard</h1>
            <div className="admin-dashboard-cards">
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Hành Trình</h5>
                        <h2>12</h2>
                    </div>
                    <div className="admin-card-icon bg-primary">
                        <i className="fas fa-road"></i>
                    </div>
                </div>
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Bài Học</h5>
                        <h2>35</h2>
                    </div>
                    <div className="admin-card-icon bg-success">
                        <i className="fas fa-book"></i>
                    </div>
                </div>
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Bài Luyện Tập</h5>
                        <h2>48</h2>
                    </div>
                    <div className="admin-card-icon bg-warning">
                        <i className="fas fa-pencil-alt"></i>
                    </div>
                </div>
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Người Dùng</h5>
                        <h2>120</h2>
                    </div>
                    <div className="admin-card-icon bg-danger">
                        <i className="fas fa-user-graduate"></i>
                    </div>
                </div>
            </div>
            <div className="admin-dashboard-cards" style={{ marginTop: '20px' }}>
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Ngữ Pháp</h5>
                        <h2>20</h2>
                    </div>
                    <div className="admin-card-icon bg-indigo">
                        <i className="fas fa-book-open"></i>
                    </div>
                </div>
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Phát Âm</h5>
                        <h2>15</h2>
                    </div>
                    <div className="admin-card-icon bg-teal">
                        <i className="fas fa-volume-up"></i>
                    </div>
                </div>
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Câu Chuyện</h5>
                        <h2>10</h2>
                    </div>
                    <div className="admin-card-icon bg-purple">
                        <i className="fas fa-book-reader"></i>
                    </div>
                </div>
                <div className="admin-card">
                    <div className="admin-card-info">
                        <h5>Nghe Chép Chính Tả</h5>
                        <h2>8</h2>
                    </div>
                    <div className="admin-card-icon bg-orange">
                        <i className="fas fa-headphones-alt"></i>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;