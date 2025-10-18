import React, { useEffect, useState } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationExerciseCard from "@/components/user/pronunciationexercise/PronunciationExerciseCard.jsx";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";

function PronunciationExercise() {
    const [exercises, setExercises] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const pageLimit = 12;

    useEffect(() => {
        document.title = "Bài luyện tập phát âm - EasyTalk";
        PronunciationExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await PronunciationExerciseService.fetchPronunciationExercise(currentPage, pageLimit, {
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
                        DANH SÁCH BÀI LUYỆN TẬP PHÁT ÂM
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
                            placeholder="Tìm kiếm bài luyện tập phát âm..."
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
                                        <PronunciationExerciseCard
                                            key={exercise._id}
                                            exercise={exercise}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center no-stories">
                                Không có bài luyện tập phát âm nào.
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
                            <h5>Hướng Dẫn Bài Luyện Tập Phát Âm</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Chọn bài luyện tập phát âm mà bạn muốn luyện tập từ danh sách.</p>
                            <p>Mỗi bài luyện tập sẽ có các câu hỏi phát âm với hai dạng câu hỏi chính: chọn đáp án đúng và phát âm.</p>
                            <p><strong>Dạng câu hỏi:</strong></p>
                            <ul>
                                <li><strong>Trắc nghiệm:</strong> Nghe một câu và chọn đáp án đúng nhất từ các lựa chọn đưa ra.</li>
                                <li><strong>Phát Âm:</strong> Người dùng sẽ nghe một câu hoặc cụm từ, sau đó phát âm lại. Hệ thống sẽ ghi lại giọng nói, phân tích và hiển thị độ chính xác theo tỷ lệ phần trăm (%).</li>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Nhấn <strong>Kiểm tra</strong> sau khi hoàn thành mỗi câu hỏi để xem kết quả và giải thích.</li>
                                <li>Khi thực hiện câu hỏi <strong>phát âm</strong>, hệ thống sẽ ghi lại giọng nói của bạn, phân tích và chỉ ra các từ phát âm đúng và sai. Độ chính xác sẽ được hiển thị dưới dạng phần trăm.</li>
                                <li>Thời gian làm bài là 20 phút. Hãy cố gắng hoàn thành đúng giờ nhé.</li>
                                <li>Sau khi nhấn <strong>Nộp bài</strong>, hệ thống sẽ hiển thị kết quả luyện tập, bao gồm: tổng số câu hỏi, số câu trả lời đúng, tỷ lệ chính xác (%) và phân tích chi tiết về các từ bạn đã phát âm đúng hoặc sai. Nhấn <strong>Xem lịch sử</strong> để xem lại các câu hỏi đã làm và đánh giá độ chính xác của từng câu.</li>
                            </ul>
                            <p>Chúc bạn luyện tập tốt và cải thiện kỹ năng phát âm của mình!</p>
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

export default PronunciationExercise;