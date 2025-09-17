import React, { useEffect, useState } from "react";
import GrammarExerciseCard from "../../components/user/grammarexercise/GrammarExerciseCard";
import { GrammarExerciseService } from "../../services/GrammarExerciseService";

function GrammarExercise() {
    const [exercises, setExercises] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const pageLimit = 6;

    useEffect(() => {
        GrammarExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await GrammarExerciseService.fetchGrammarExercise(currentPage, pageLimit, {
                    search: searchKeyword,
                });
                setExercises(data.data || []);
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
                        DANH SÁCH BÀI LUYỆN TẬP NGỮ PHÁP
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
                            placeholder="Tìm kiếm bài luyện tập ngữ pháp..."
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
                        {isLoading ? (
                            <div className="spinner-container">
                                <div className="spinner-loader"></div>
                            </div>
                        ) : exercises.length > 0 ? (
                            <div className="container">
                                <div className="row">
                                    {exercises.map((exercise) => (
                                        <GrammarExerciseCard
                                            key={exercise._id}
                                            exercise={exercise}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center no-stories">
                                Không có bài luyện tập từ vựng nào.
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
                            <h5>Hướng Dẫn Bài Luyện Tập Ngữ Pháp</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Chọn bài tập ngữ pháp mà bạn muốn luyện tập từ danh sách.</p>
                            <p>Mỗi bài tập sẽ có các câu hỏi ngữ pháp bao gồm các dạng câu hỏi như: trắc nghiệm, điền từ vào lỗ trống và dịch nghĩa.</p>
                            <p><strong>Dạng câu hỏi:</strong></p>
                            <ul>
                                <li><strong>Trắc Nghiệm:</strong> Chọn đáp án đúng nhất trong các lựa chọn được đưa ra.</li>
                                <li><strong>Điền Từ Vào Chỗ Trống:</strong> Điền từ thích hợp vào ô trống để hoàn thành câu.</li>
                                <li><strong>Dịch Nghĩa:</strong> Dịch câu từ Tiếng Việt sang Tiếng Anh hoặc ngược lại.</li>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Nhấn <strong>Kiểm tra</strong> sau khi trả lời mỗi câu hỏi để xem đáp án và giải thích.</li>
                                <li>Mỗi bộ đề có số lượng câu hỏi khác nhau, hãy cố gắng hoàn thành hết các câu hỏi.</li>
                                <li>Thời gian làm bài là 20 phút. Hãy cố gắng hoàn thành đúng giờ nhé.</li>
                                <li>Nhấn <strong>Nộp bài</strong> bài thì hệ thống sẽ hiển thị kết quả bài luyện tập gồm có: số câu hỏi, số câu đúng, số câu sai, tỷ lệ chính xác (%). Nhấn <strong>Xem lịch sử</strong> để thấy những câu mình đã làm, để biết mình đúng hoặc sai chỗ nào.</li>
                            </ul>
                            <p>Chúc bạn luyện tập tốt và cải thiện ngữ pháp của mình!</p>
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
        </>
    );
}

export default GrammarExercise;