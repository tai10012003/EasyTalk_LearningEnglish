import React, { useEffect, useState } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import DictationExerciseCard from "@/components/user/dictationexercise/DictationExerciseCard.jsx";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";

function DictationExercise() {
    const [exercises, setExercises] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");

    const pageLimit = 12;

    useEffect(() => {
        document.title = "Bài nghe chép chính tả - EasyTalk";
        DictationExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await DictationExerciseService.fetchDictationExercise(currentPage, pageLimit, {
                    search: searchKeyword,
                });
                setExercises(data.dictationExercises || []);
                setTotalPages(data.totalPages || 1);
            } catch (err) {
                console.error(err);
                setExercises([]);
                setTotalPages(1);
            } finally {
                setIsLoading(false);
            }
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
                    className={`page-item ${i === currentPage ? "active" : ""}`}
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
                    <h3 className="hero-title">
                        DANH SÁCH BÀI NGHE CHÉP CHÍNH TẢ
                        <i
                            className="fas fa-question-circle help-icon"
                            style={{ cursor: "pointer" }}
                            onClick={() => setIsModalOpen(true)}
                        ></i>
                    </h3>
                    <div className="search-bar">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm kiếm bài nghe..."
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />
                        <button
                            className="search-button"
                            onClick={() => setCurrentPage(1)}
                        >
                            <i className="fas fa-search me-2"></i>
                        </button>
                    </div>
                </div>
                <div className="container">
                    <div className="lesson-list">
                        { exercises.length > 0 ? (
                            <div className="container">
                                <div className="row">
                                    {exercises.map((exercise) => (
                                        <DictationExerciseCard
                                            key={exercise._id}
                                            exercise={exercise}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center no-stories">
                                Không có bài nghe chép chính tả nào.
                            </p>
                        )}
                    </div>
                    <nav aria-label="Page navigation">
                        <ul
                            className="pagination justify-content-center"
                            id="pagination-controls"
                        >
                            {renderPagination()}
                        </ul>
                    </nav>
                </div>
            </div>
            {isModalOpen && (
                <div
                    className="custom-modal-overlay"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>Hướng Dẫn Bài Luyện Tập Nghe Chép Chính Tả</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                Chọn bài luyện tập nghe chép chính tả mà bạn muốn
                                luyện tập từ danh sách.
                            </p>
                            <p>
                                Nghe mỗi câu và gõ lại đúng chính xác từng câu vào ô
                                nhập liệu.
                            </p>
                            <ul>
                                <li>
                                    <strong>Nghe:</strong> Hệ thống sẽ phát âm thanh
                                    mỗi câu 3 lần. Bạn có thể bấm nút "Loa" hoặc phím{" "}
                                    <strong>Ctrl</strong> để nghe lại.
                                </li>
                                <li>
                                    <strong>Chép chính tả:</strong> Gõ lại câu vừa nghe
                                    vào ô nhập, sau đó nhấn "Kiểm tra" để xác nhận kết
                                    quả.
                                </li>
                                <li>
                                    <strong>Bỏ qua:</strong> Nếu quá khó, bạn có thể bỏ
                                    qua và xem đáp án.
                                </li>
                            </ul>
                            <p>
                                <strong>Lưu ý:</strong> Hãy cố gắng hoàn thành từng
                                câu trước khi chuyển sang câu tiếp theo.
                            </p>
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                className="footer-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default DictationExercise;