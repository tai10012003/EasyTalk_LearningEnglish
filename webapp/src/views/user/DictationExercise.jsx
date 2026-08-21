import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import DictationExerciseCard from "@/components/user/dictationexercise/DictationExerciseCard.jsx";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";

function DictationExercise() {
    const [allDictationExercises, setAllDictationExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roadmapProgress, setRoadmapProgress] = useState({ unlockedCount: 0, totalCount: 0, percent: 0 });
    const currentLessonRef = useRef(null);

    useEffect(() => {
        document.title = "Bài luyện tập nghe chép chính tả - EasyTalk";
        DictationExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const roadmap = await DictationExerciseService.fetchDictationExerciseRoadmap();
                setAllDictationExercises(roadmap.items || []);
                setRoadmapProgress(roadmap.progress || { unlockedCount: 0, totalCount: 0, percent: 0 });
            } catch (err) {
                console.error("Error fetching dictation exercises:", err);
                setAllDictationExercises([]);
                setRoadmapProgress({ unlockedCount: 0, totalCount: 0, percent: 0 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const findCurrentDictationExerciseIndex = () => {
        return allDictationExercises.findIndex(item => item.isCurrent);
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
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {roadmapProgress.unlockedCount} / {roadmapProgress.totalCount || allDictationExercises.length}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${roadmapProgress.percent || 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {roadmapProgress.percent || 0}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allDictationExercises.map((item, index) => {
                            const isUnlocked = Boolean(item.isUnlocked);
                            const currentIndex = findCurrentDictationExerciseIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null}>
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
