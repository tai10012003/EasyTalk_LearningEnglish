import React, { useState, useEffect } from "react";
import FlashCardListCard from "../../components/user/flashcardList/FlashCardListCard";
import CreateFlashCardList from "../../components/user/flashcardList/CreateFlashCardList";
import { FlashcardService } from "../../services/flashcardService";

const FlashCardList = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("explore");

    const loadFlashcards = async (page = currentPage) => {
        setIsLoading(true);
        try {
            const data = await FlashcardService.fetchFlashcardLists(page, 3);
            setFlashcards(data.flashcardLists || []);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            setFlashcards([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        FlashcardService.resetAlertFlag();
        loadFlashcards(currentPage);
    }, [currentPage, activeTab]);

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
        <div className="lesson-container">
            <div className="hero-mini d-flex justify-content-between align-items-center">
                <h3 className="hero-title mb-0">DANH SÁCH TỪ VỰNG FLASHCARD</h3>
            </div>
            <div className="container">
                <CreateFlashCardList
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onCreated={() => loadFlashcards(currentPage)}
                />
                <div className="flashcard-menu d-flex justify-content-between align-items-center mb-4">
                    <div className="flashcard-btn-group btn-group">
                        <button
                            className={`flashcard-btn ${activeTab == "mine" ? "active" : ""}`}
                            onClick={() => setActiveTab("mine")}
                        >
                            Dành cho bạn
                        </button>
                        <button
                            className={`flashcard-btn ${activeTab == "explore" ? "active" : ""}`}
                            onClick={() => setActiveTab("explore")}
                        >
                            Khám phá
                        </button>
                    </div>
                </div>
                <div className="lesson-list">
                     <button
                        className="btn_1 mb-4"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <i className="fas fa-plus mr-2"></i>Tạo mới
                    </button>
                    {isLoading ? (
                        <div className="spinner-container">
                            <div className="spinner-loader"></div>
                        </div>
                    ) : flashcards.length > 0 ? (
                        <div className="container">
                            <div className="row">
                                {flashcards.map((flashcardLists) => (
                                    <FlashCardListCard
                                        key={flashcardLists._id}
                                        flashcardLists={flashcardLists}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center no-stories">Không có flashcard nào.</p>
                    )}
                </div>
                <nav aria-label="Page navigation">
                    <ul className="pagination justify-content-center" id="pagination-controls">
                        {renderPagination()}
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default FlashCardList;