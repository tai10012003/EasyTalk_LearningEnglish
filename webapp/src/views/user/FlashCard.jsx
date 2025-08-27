import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FlashcardService } from "../../services/flashcardService";
import FlashCardCard from "../../components/user/flashcard/FlashcardCard";
import CreateFlashCard from "../../components/user/flashcard/CreateFlashcard";
import UpdateFlashCardList from "../../components/user/flashcardList/UpdateFlashCardList";

const FlashCard = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "5");

  const [flashcardList, setFlashcardList] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFlashcards, setTotalFlashcards] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await FlashcardService.fetchFlashcards(id, page, limit);
      setFlashcardList(data.flashcardList);
      setFlashcards(data.flashcards || []);
      setTotalPages(data.totalPages || 1);
      setTotalFlashcards(data.totalFlashcards || 0);
    } catch (error) {
      console.error("Error fetching flashcard list:", error);
      alert("Lỗi khi tải danh sách flashcard: " + error.message);
    }
    setLoading(false);
  }, [id, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteList = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh sách từ này không?")) {
      try {
        const data = await FlashcardService.deleteFlashcardList(id);
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

  const handlePageChange = (newPage) => {
    setSearchParams({ page: newPage, limit });
  };

  if (loading) return <div>Loading...</div>;
  if (!flashcardList) return <div>Không tìm thấy danh sách flashcards.</div>;

  return (
    <div>
      <div className="container flashcard-container">
        <div className="custom-container d-flex justify-content-center my-4">
          <div className="content">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h2 className="my-4">Flashcards: {flashcardList.name}</h2>
              </div>
              <div className="col-md-4 d-flex justify-content-end">
                <div className="d-flex">
                  <button
                    className="btn btn-primary mx-2 flashcard-list-action-btn"
                    onClick={() => setIsEditListModalOpen(true)}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    className="btn btn-primary mx-2 flashcard-list-action-btn"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Thêm từ mới
                  </button>
                  <button
                    className="btn btn-danger mx-2 flashcard-list-action-btn"
                    onClick={handleDeleteList}
                  >
                    Xoá
                  </button>
                </div>
              </div>
            </div>
            <div
              className="alert alert-success"
              style={{ margin: "10px 0 20px 0" }}
            >
              Chú ý: nếu như list từ vựng của bạn là tiếng Trung, Nhật, hay Hàn,
              click vào nút chỉnh sửa để thay đổi ngôn ngữ. Audio mặc định là
              tiếng Anh-Anh và Anh-Mỹ. Các ngôn ngữ khác chỉ hỗ trợ trên máy
              tính.
            </div>
            <p>Mô tả: {flashcardList.description}</p>
            <a
              className="btn btn-outline-success btn-lg btn-block mb-4 w-100"
              href={`/flashcards/flashcardlist/${flashcardList._id}/review`}
            >
              Luyện tập flashcards
            </a>
          </div>
        </div>
        <div className="custom-container mt-4">
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-center align-items-center mb-4">
                <h3>DANH SÁCH TỪ VỰNG</h3>
              </div>
              {flashcards.length === 0 ? (
                <p>Không có flashcards nào trong danh sách này.</p>
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
              <div className="pagination-container mt-4">
                <nav aria-label="Page navigation">
                  <ul className="pagination justify-content-center">
                    {page > 1 && (
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page - 1)}
                        >
                          &lt;&lt;
                        </button>
                      </li>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <li
                          key={p}
                          className={`page-item ${
                            page === p ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        </li>
                      )
                    )}
                    {page < totalPages && (
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page + 1)}
                        >
                          &gt;&gt;
                        </button>
                      </li>
                    )}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
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
