import React, { useEffect, useState } from "react";
import PronunciationCard from "../../components/user/pronunciation/PronunciationCard";
import { PronunciationService } from "../../services/PronunciationService";

function Pronunciation() {
    const [pronunciations, setPronunciations] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    useEffect(() => {
        PronunciationService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await PronunciationService.fetchPronunciations(currentPage, 6, {
                    search: searchKeyword,
                });
                setPronunciations(data.pronunciations  || []);
                setTotalPages(data.totalPages);
            } catch (err) {
                console.error(err);
                setPronunciations([]);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [currentPage, searchKeyword]);

    const renderPagination = () => {
        const pages = [];
        if (currentPage > 1) {
            pages.push(
                <li className="page-item" key="prev">
                    <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        &laquo; Previous
                    </button>
                </li>
            );
        }
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li
                    className={`page-item ${i == currentPage ? "active" : ""}`}
                    key={i}
                >
                    <button className="page-link" onClick={() => setCurrentPage(i)}>
                        {i}
                    </button>
                </li>
            );
        }
        if (currentPage < totalPages) {
            pages.push(
                <li className="page-item" key="next">
                    <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next &raquo;
                    </button>
                </li>
            );
        }

        return pages;
    };

    return (
        <>
            <div className="lesson-container">
                <div className="hero-mini">
                    <h3 className="hero-title">DANH SÁCH BÀI HỌC PHÁT ÂM
                        <i
                            className="fas fa-question-circle help-icon"
                            style={{ cursor: "pointer" }}
                            onClick={() => setIsModalOpen(true)}
                        ></i></h3>
                    <div className="search-bar">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm kiếm bài học phát âm..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        <button
                            className="search-button"
                            onClick={() => {
                                setCurrentPage(1);
                            }}
                        >
                            <i className="fas fa-search me-2"></i>
                        </button>
                    </div>
                </div>
                <div className="container">
                    <div className="lesson-list">
                    {isLoading ? (
                        <div className="spinner-container">
                            <div className="spinner-loader"></div>
                        </div>
                    ) : pronunciations.length > 0 ? (
                            <div className="container">
                                <div className="row">
                                    {pronunciations.map((pronunciation) => (
                                        <PronunciationCard key={pronunciation._id} pronunciation={pronunciation} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center no-stories">Không có bài học phát âm nào.</p>
                        )}
                    </div>
                    <nav aria-label="Page navigation">
                        <ul className="pagination justify-content-center" id="pagination-controls">
                            {renderPagination()}
                        </ul>
                    </nav>
                </div>
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                        <h5>Hướng Dẫn Đọc Bài Học Ngữ Pháp</h5>
                        <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                            &times;
                        </button>
                        </div>
                        <div className="custom-modal-body">
                        <p>Câu chuyện được chia thành nhiều đoạn nhỏ, hiển thị từng đoạn để bạn dễ dàng đọc và hiểu.</p>
                        <p>
                            <strong>Các chức năng:</strong>
                        </p>
                        <ul>
                            <li><strong>Tiếp theo:</strong> Nhấn nút <strong>Tiếp theo</strong> để chuyển sang đoạn tiếp theo.</li>
                            <li><strong>Quay lại:</strong> Nhấn nút <strong>Quay lại</strong> để đọc lại đoạn trước đó.</li>
                            <li><strong>Dịch nghĩa:</strong> Xem bản dịch tiếng Việt của đoạn hiện tại.</li>
                            <li><strong>Nghe:</strong> Hệ thống đọc to đoạn hiện tại bằng tiếng Anh.</li>
                        </ul>
                        <p><strong>Lưu ý:</strong></p>
                        <ul>
                            <li>Đọc kỹ từng đoạn và tận dụng các chức năng.</li>
                            <li>Sau khi hoàn thành, sẽ hiển thị thông báo "Bạn đã hoàn thành câu chuyện".</li>
                        </ul>
                        <p>🎉 Chúc bạn học vui vẻ!</p>
                        </div>
                        <div className="custom-modal-footer">
                        <button className="footer-btn" onClick={() => setIsModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Pronunciation;