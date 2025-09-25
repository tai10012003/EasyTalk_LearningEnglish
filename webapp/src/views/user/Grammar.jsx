import React, { useEffect, useState } from "react";
import GrammarCard from "@/components/user/grammar/GrammarCard.jsx";
import { useNavigate } from "react-router-dom";
import { GrammarService } from "@/services/GrammarService.jsx";

function Grammar() {
    const [allGrammars, setAllGrammars] = useState([]);
    const [grammars, setGrammars] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [unlockedGrammars, setUnlockedGrammars] = useState([]); 
    const navigate = useNavigate();
    const pageLimit = 6;

    useEffect(() => {
        document.title = "Bài học ngữ pháp - EasyTalk";
        GrammarService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await GrammarService.fetchGrammars(1, 10000, {
                    search: searchKeyword,
                });
                const all = allResp.grammars || [];
                setAllGrammars(all);
                const data = await GrammarService.fetchGrammars(currentPage, pageLimit, {
                    search: searchKeyword,
                });
                setGrammars(data.grammars  || []);
                setTotalPages(data.totalPages);
                if (all.length > 0) {
                    try {
                        const detailResp = await GrammarService.getGrammarDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        setUnlockedGrammars(
                            Array.isArray(userProg?.unlockedGrammars) ? userProg.unlockedGrammars.map(s => s.toString()) : []
                        );
                    } catch (err) {
                        setUnlockedGrammars([]);
                    }
                } else {
                    setUnlockedGrammars([]);
                }
             } catch (err) {
                console.error(err);
                setAllGrammars([]);
                setGrammars([]);
                setTotalPages(1);
                setUnlockedGrammars([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentPage, searchKeyword]);

    const isGrammarLocked = (grammarId) => {
        return !unlockedGrammars.includes(grammarId.toString());
    };

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
                    <h3 className="hero-title">DANH SÁCH BÀI HỌC NGỮ PHÁP
                        <i
                            className="fas fa-question-circle help-icon"
                            style={{ cursor: "pointer" }}
                            onClick={() => setIsModalOpen(true)}
                        ></i></h3>
                    <div className="search-bar">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm kiếm bài học ngữ pháp..."
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
                    ) : grammars.length > 0 ? (
                            <div className="container">
                                <div className="row">
                                    {grammars.map((grammar) => (
                                        <GrammarCard key={grammar._id} grammar={grammar} isLocked={isGrammarLocked(grammar._id)} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-center no-stories">Không có bài học ngữ pháp nào.</p>
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

export default Grammar;
