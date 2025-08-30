import React, { useState } from "react";
import { FlashcardService } from "../../../services/flashcardService";

const CreateFlashCard = ({ isOpen, onClose, listId, onCreated }) => {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [pos, setPos] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!word.trim() || !meaning.trim() || !exampleSentence.trim()) {
    alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
    return;
  }
  setLoading(true);
    try {
      const formData = new FormData();
      formData.append("word", word);
      formData.append("meaning", meaning);
      formData.append("pos", pos);
      formData.append("pronunciation", pronunciation);
      formData.append("exampleSentence", exampleSentence);
      if (image) {
        formData.append("image", image);
      }
      const data = await FlashcardService.createFlashcard(listId, formData);
      if (data.success) {
        alert("✅ Tạo flashcard thành công!");
        setWord("");
        setMeaning("");
        setPos("");
        setPronunciation("");
        setExampleSentence("");
        setImage(null);
        onCreated();
        onClose();
      } else {
        alert("❌ Có lỗi xảy ra: " + data.message);
      }
    } catch (error) {
      alert("❌ Lỗi khi tạo flashcard: " + error.message);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
        <div className="custom-modal-header">
          <h5>THÊM TỪ VỰNG MỚI</h5>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="custom-modal-body">
            <div className="mb-3">
              <label className="form-label">Từ vựng:</label>
              <input
                type="text"
                className="form-control"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Nhập từ vựng"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Định nghĩa:</label>
              <input
                type="text"
                className="form-control"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="Nhập định nghĩa"
                required
              />
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Từ loại:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pos}
                    onChange={(e) => setPos(e.target.value)}
                    placeholder="Nhập từ loại (VD: noun, verb)"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Phát âm:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pronunciation}
                    onChange={(e) => setPronunciation(e.target.value)}
                    placeholder="Nhập phát âm (VD: /ˈæp.əl/)"
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Ví dụ:</label>
              <textarea
                className="form-control"
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                placeholder="Thêm ví dụ"
                rows={4}
                maxLength={500}
                required
              />
              <small className="text-muted">{exampleSentence.length}/500 ký tự</small>
            </div>
            <div className="mb-3">
              <label className="form-label">
                <i className="bi bi-card-image"></i> Hình ảnh (tuỳ chọn):
              </label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage(e.target.files[0])}
                accept="image/*"
              />
            </div>
          </div>
          <div
            className="custom-modal-footer"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button type="button" className="footer-btn" onClick={onClose} disabled={loading}>
              <i className="fas fa-times"></i>Đóng
            </button>
            <button type="submit" className="footer-btn" disabled={loading}>
              <i className="fas fa-save"></i>{loading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFlashCard;