import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FlashCardService } from "../../services/FlashCardService";
import FlashCardCard from "@/components/user/flashcard/FlashCardCard.jsx";
import CreateFlashCard from "@/components/user/flashcard/CreateFlashCard.jsx";
import UpdateFlashCardList from "@/components/user/flashcardList/UpdateFlashCardList.jsx";

const FlashCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardList, setFlashcardList] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFlashcards, setTotalFlashcards] = useState(0);
  const [limit] = useState(5);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FlashCardService.fetchFlashcards(id, currentPage, limit);
      setFlashcardList(data.flashcardList);
      setFlashcards(data.flashcards || []);
      setTotalPages(data.totalPages || 1);
      setTotalFlashcards(data.totalFlashcards || 0);
    } catch (error) {
      console.error("Error fetching flashcard list:", error);
      alert("Lỗi khi tải danh sách flashcard: " + error.message);
    }
    setLoading(false);
  }, [id, currentPage, limit]);

  useEffect(() => {
    document.title = "Flashcard - EasyTalk";
    fetchData();
  }, [fetchData]);

  const handleDeleteList = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh sách từ này không?")) {
      try {
        const data = await FlashCardService.deleteFlashcardList(id);
        if (data.success) {
          alert("Danh sách từ đã bị xóa");
          navigate("/flashcards");
        } else {
          alert("Xóa thất bại: " + data.message);
        }
      } catch (error) {
        alert("Lỗi khi xóa danh sách: " + error.message);
      }
    }
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

  if (loading) return <div>Loading...</div>;
  if (!flashcardList) return <div>Không tìm thấy danh sách flashcards.</div>;

  return (
    <div>
      <div className="flashcard-detail-container container">
        <div className="flashcard-detail-header">
          <div className="section_tittle">
            <h3>Flashcards: {flashcardList.name}</h3>
          </div>
          <p className="flashcard-detail-description">{flashcardList.description}</p>
        </div>
        <div className="flashcard-detail-actions">
          <button className="btn_4 mx-2" onClick={() => setIsCreateModalOpen(true)}>
            <i className="fas fa-plus"></i>Thêm từ mới
          </button>
          <button className="btn_4 mx-2" onClick={() => setIsEditListModalOpen(true)}>
            <i className="fas fa-edit"></i>Chỉnh sửa danh sách
          </button>
          <button className="btn_4 mx-2" onClick={handleDeleteList}>
            <i className="fas fa-trash-alt"></i>Xoá danh sách
          </button>
        </div>
        <div className="flashcard-detail-alert alert alert-success">
          Chú ý: nếu như list từ vựng của bạn là tiếng Trung, Nhật, hay Hàn,
          click vào nút chỉnh sửa để thay đổi ngôn ngữ. Audio mặc định là
          tiếng Anh-Anh và Anh-Mỹ. Các ngôn ngữ khác chỉ hỗ trợ trên máy tính.
        </div>
        <a
          className="btn_1 btn-lg btn-block flashcard-detail-review"
          href={`/flashcards/flashcardlist/${flashcardList._id}/review`}
        >
          <i className="fas fa-dumbbell"></i>Luyện tập flashcards
        </a>
        <div className="flashcard-detail-list">
          <div className="section_tittle">
            <h4>DANH SÁCH TỪ VỰNG</h4>
          </div>
          {flashcards.length == 0 ? (
            <p className="flashcard-detail-empty">Không có flashcards nào trong danh sách này.</p>
          ) : (
            flashcards.map((flashcard) => (
              <FlashCardCard
                key={flashcard._id}
                flashcard={flashcard}
                onUpdate={fetchData}
                onDelete={fetchData}
              />
            ))
          )}
        </div>
        <nav aria-label="Page navigation">
          <ul className="pagination justify-content-center" id="pagination-controls">
            {renderPagination()}
          </ul>
        </nav>
      </div>
      <CreateFlashCard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        listId={id}
        onCreated={fetchData}
      />
      <UpdateFlashCardList
        isOpen={isEditListModalOpen}
        onClose={() => setIsEditListModalOpen(false)}
        flashcardList={flashcardList}
        onUpdated={fetchData}
      />
    </div>
  );
};

export default FlashCard;
