import React, { useState } from "react";
import { createFlashcardList } from "../../../services/flashcardService";

const CreateFlashcard = ({ isOpen, onClose, onCreated }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await createFlashcardList(name, description);
            if (data.success) {
                alert("Tạo danh sách flashcard thành công!");
                setName("");
                setDescription("");
                onCreated();
                onClose();
            } else {
                alert("Có lỗi xảy ra: " + data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Có lỗi xảy ra: " + error.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal">
                <div className="custom-modal-header">
                    <h5>Tạo danh sách flashcards mới</h5>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="custom-modal-body">
                        <div className="mb-3">
                            <label className="form-label">Tên danh sách:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nhập tên danh sách"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Mô tả:</label>
                            <textarea
                                className="form-control"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Mô tả danh sách (tối đa 500 ký tự)"
                                rows={4}
                                maxLength={500}
                                required
                            />
                            <small className="text-muted">Tối đa 500 ký tự</small>
                        </div>
                    </div>
                    <div className="custom-modal-footer">
                        <button type="button" className="footer-btn" onClick={onClose}>Đóng</button>
                        <button type="submit" className="footer-btn">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFlashcard;