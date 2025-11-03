import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
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
  const [isOwner, setIsOwner] = useState(false);
  const [limit] = useState(5);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await FlashCardService.fetchFlashcards(id, currentPage, limit);
      setFlashcardList(data.flashcardList);
      setFlashcards(data.flashcards || []);
      setTotalPages(data.totalPages || 1);
      setTotalFlashcards(data.totalFlashcards || 0);
      setIsOwner(data.isOwner || false);
    } catch (error) {
      console.error("Error fetching flashcard list:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi tải dữ liệu",
        text: "Không thể tải danh sách flashcard: " + error.message,
        confirmButtonText: "OK",
      });
    }
    setIsLoading(false);
  }, [id, currentPage, limit]);

  useEffect(() => {
    document.title = "Flashcard - EasyTalk";
    fetchData();
  }, [fetchData]);

  const handleDeleteList = async () => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Bạn có chắc chắn muốn xóa danh sách từ này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });
    if (result.isConfirmed) {
      try {
        const data = await FlashCardService.deleteFlashcardList(id);
        if (data.success) {
          await Swal.fire({
            icon: "success",
            title: "Đã xóa!",
            text: "Danh sách từ đã bị xóa thành công.",
            confirmButtonText: "OK",
          });
          navigate("/flashcards");
        } else {
          Swal.fire({
            icon: "error",
            title: "Thất bại",
            text: "Không thể xóa: " + (data.message || "Lỗi không xác định."),
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Lỗi khi xóa",
          text: "Lỗi khi xóa danh sách: " + error.message,
          confirmButtonText: "OK",
        });
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

  if (isLoading) return <LoadingScreen />;
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
        {isOwner && (
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
        )}
        <div className="flashcard-detail-alert alert alert-success">
          Chú ý: nếu như list từ vựng của bạn là tiếng Trung, Nhật, hay Hàn,
          click vào nút chỉnh sửa để thay đổi ngôn ngữ. Audio mặc định là
          tiếng Anh-Anh và Anh-Mỹ. Các ngôn ngữ khác chỉ hỗ trợ trên máy tính.
        </div>
        {flashcards.length >= 3 ? (
          <a
            className="btn_1 btn-lg btn-block flashcard-detail-review"
            href={`/flashcards/flashcardlist/${flashcardList._id}/review`}
          >
            <i className="fas fa-dumbbell"></i>Luyện tập flashcards
          </a>
        ) : (
          <div className="alert alert-error text-center mt-3">
            Cần ít nhất <strong>3 từ vựng</strong> trong danh sách để bắt đầu luyện tập!
          </div>
        )}
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
                isOwner={isOwner && flashcard.username === flashcardList.username}
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
      {isOwner && (
        <UpdateFlashCardList
          isOpen={isEditListModalOpen}
          onClose={() => setIsEditListModalOpen(false)}
          flashcardList={flashcardList}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
};

export default FlashCard;