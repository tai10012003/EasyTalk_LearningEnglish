import React, { useState, useEffect } from "react";
import FlashcardCard from "../../components/user/flashcard/FlashcardCard";
import CreateFlashcard from "../../components/user/flashcard/CreateFlashcard";
import { fetchFlashcardLists } from "../../services/flashcardService";

const FlashcardList = () => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadFlashcards = async (page = 1) => {
        try {
            const data = await fetchFlashcardLists(page);
            setFlashcards(data.flashcardLists || []);
            setCurrentPage(data.currentPage);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tải danh sách flashcards");
        }
    };

    useEffect(() => {
        loadFlashcards();
    }, []);

    const handlePageChange = (page) => {
        loadFlashcards(page);
    };

    return (
        <div className="container flashcard-container">
            <div className="d-flex justify-content-between align-items-center my-4">
                <h3>DANH SÁCH ĐÃ TẠO</h3>
                <button className="footer-btn" onClick={() => setIsModalOpen(true)}>Tạo mới</button>
            </div>
            <div className="row">
                {flashcards.length > 0
                ? flashcards.map(f => <FlashcardCard key={f._id} flashcardList={f} />)
                : <p className="text-center">Không có danh sách flashcards nào.</p>
                }
            </div>
            <nav aria-label="Pagination" className="my-3">
                <ul className="pagination justify-content-center">
                    {currentPage > 1 && (
                        <li className="page-item">
                            <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>« Previous</button>
                        </li>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <li key={page} className={`page-item ${page == currentPage ? "active" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(page)}>{page}</button>
                        </li>
                    ))}
                    {currentPage < totalPages && (
                        <li className="page-item">
                            <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Next »</button>
                        </li>
                    )}
                </ul>
            </nav>
            <CreateFlashcard
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={() => loadFlashcards(currentPage)}
            />
        </div>
    );
};

export default FlashcardList;
