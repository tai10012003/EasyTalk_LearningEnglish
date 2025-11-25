import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import StoryCard from "@/components/user/story/StoryCard.jsx";
import { useNavigate } from "react-router-dom";
import { StoryService } from "@/services/StoryService.jsx";

function Story() {
    const [allStories, setAllStories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedStories, setUnlockedStories] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Bài học câu chuyện - EasyTalk";
        StoryService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await StoryService.fetchStories(1, 10000);
                const all = allResp.data || [];
                setAllStories(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await StoryService.getStoryDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedStories) ? userProg.unlockedStories.map(s => s.toString()) : [];
                        setUnlockedStories(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedStories([]);
                    }
                } else {
                    setUnlockedStories([]);
                }
            } catch (err) {
                console.error("Error fetching stories:", err);
                setAllStories([]);
                setUnlockedStories([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const isStoryUnlocked = (storyId) => {
        return unlockedStories.includes(storyId.toString());
    };

    const findCurrentStoryIndex = () => {
        if (unlockedStories.length === 0) return -1;
        const lastUnlockedId = unlockedStories[unlockedStories.length - 1];
        return allStories.findIndex(item => item._id.toString() === lastUnlockedId);
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
                            <i className="fas fa-book"></i> LỘ TRÌNH ĐỌC CÂU CHUYỆN TỪ A-Z
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            Hoàn thành từng bài để mở khóa bài tiếp theo • Đã mở khóa: {unlockedStories.length} / {allStories.length}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allStories.length > 0 ? (unlockedStories.length / allStories.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {allStories.length > 0 ? Math.round((unlockedStories.length / allStories.length) * 100) : 0}% hoàn thành
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allStories.map((item, index) => {
                            const isUnlocked = isStoryUnlocked(item._id);
                            const currentIndex = findCurrentStoryIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <StoryCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title="Cuộn đến bài học hiện tại" >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">Tiếp tục học</span>
                        <span className="user-scroll-hot-badge">HOT</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Lên đầu trang" >
                        <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>Hướng Dẫn Đọc Câu Chuyện</h5>
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
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default Story;