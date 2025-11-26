import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import DictationExerciseCard from "@/components/user/dictationexercise/DictationExerciseCard.jsx";
import { useNavigate } from "react-router-dom";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";

function DictationExercise() {
    const [allDictationExercises, setAllDictationExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedDictationExercises, setUnlockedDictationExercises] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Bài luyện tập nghe chép chính tả - EasyTalk";
        DictationExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await DictationExerciseService.fetchDictationExercise(1, 10000);
                const all = allResp.dictationExercises || [];
                setAllDictationExercises(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await DictationExerciseService.getDictationExerciseDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedDictations) ? userProg.unlockedDictations.map(s => s.toString()) : [];
                        setUnlockedDictationExercises(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedDictationExercises([]);
                    }
                } else {
                    setUnlockedDictationExercises([]);
                }
            } catch (err) {
                console.error("Error fetching dictation exercises:", err);
                setAllDictationExercises([]);
                setUnlockedDictationExercises([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const isDictationExerciseUnlocked = (dictationExerciseId) => {
        return unlockedDictationExercises.includes(dictationExerciseId.toString());
    };

    const findCurrentDictationExerciseIndex = () => {
        if (unlockedDictationExercises.length === 0) return -1;
        const lastUnlockedId = unlockedDictationExercises[unlockedDictationExercises.length - 1];
        return allDictationExercises.findIndex(item => item._id.toString() === lastUnlockedId);
    };

    const scrollToCurrentLesson = () => {
        if (currentLessonRef.current) {
            currentLessonRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    };

    return (
        <>
            <div className="user-road-roadmap">
                <div className="user-road-header">
                    <div className="container">
                        <h1 className="user-road-title">
                            <i className="fas fa-headphones me-2"></i> LỘ TRÌNH LUYỆN TẬP NGHE CHÉP CHÍNH TẢ TỪ A-Z
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {unlockedDictationExercises.length} / {allDictationExercises.length}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allDictationExercises.length > 0 ? (unlockedDictationExercises.length / allDictationExercises.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {allDictationExercises.length > 0 ? Math.round((unlockedDictationExercises.length / allDictationExercises.length) * 100) : 0}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allDictationExercises.map((item, index) => {
                            const isUnlocked = isDictationExerciseUnlocked(item._id);
                            const currentIndex = findCurrentDictationExerciseIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <DictationExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title="Cuộn đến bài luyện tập hiện tại" >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">Tiếp tục luyện tập</span>
                        <span className="user-scroll-hot-badge">HOT</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Lên đầu trang" >
                        <i className="fas fa-arrow-up"></i>
                    </button>
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
                            <h5>Hướng Dẫn Bài Luyện Tập Nghe Chép Chính Tả</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                Chọn bài luyện tập nghe chép chính tả mà bạn muốn
                                luyện tập từ danh sách.
                            </p>
                            <p>
                                Nghe mỗi câu và gõ lại đúng chính xác từng câu vào ô
                                nhập liệu.
                            </p>
                            <ul>
                                <li>
                                    <strong>Nghe:</strong> Hệ thống sẽ phát âm thanh
                                    mỗi câu 3 lần. Bạn có thể bấm nút "Loa" hoặc phím{" "}
                                    <strong>Ctrl</strong> để nghe lại.
                                </li>
                                <li>
                                    <strong>Chép chính tả:</strong> Gõ lại câu vừa nghe
                                    vào ô nhập, sau đó nhấn "Kiểm tra" để xác nhận kết
                                    quả.
                                </li>
                                <li>
                                    <strong>Bỏ qua:</strong> Nếu quá khó, bạn có thể bỏ
                                    qua và xem đáp án.
                                </li>
                            </ul>
                            <p>
                                <strong>Lưu ý:</strong> Hãy cố gắng hoàn thành từng
                                câu trước khi chuyển sang câu tiếp theo.
                            </p>
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

export default DictationExercise;