import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UNSAFE_NavigationContext } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import { FlashCardService } from "@/services/FlashCardService.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import FlashCardReviewCard from "@/components/user/flashcard/FlashCardReviewCard.jsx";
import Swal from "sweetalert2";

const FlashCardReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { navigator } = React.useContext(UNSAFE_NavigationContext);
    const allowNavigationRef = useRef(false);
    const [activeTime, setActiveTime] = useState(0);
    const lastInteractionRef = useRef(Date.now());
    const intervalRef = useRef(null);
    const hasRecordedRef = useRef(false);
    const [flashcards, setFlashcards] = useState([]);
    const [listName, setListName] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mode, setMode] = useState("flip");
    const [isOwner, setIsOwner] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState(false);

    const handleUserInteraction = useCallback(() => {
        lastInteractionRef.current = Date.now();
        console.log("Tương tác phát hiện → tiếp tục đếm thời gian học Flashcard");
        if (!intervalRef.current) {
            startActiveTimer();
        }
    }, []);

    const startActiveTimer = useCallback(() => {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const inactiveSeconds = Math.floor((now - lastInteractionRef.current) / 1000);
            if (inactiveSeconds < 60) {
                setActiveTime(prev => prev + 1);
            } else {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }, 1000);
    }, []);

    useEffect(() => {
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
            'click', 'keydown', 'keyup', 'touchmove'
        ];
        events.forEach(event => {
            window.addEventListener(event, handleUserInteraction, true);
        });
        startActiveTimer();
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserInteraction, true);
            });
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [handleUserInteraction, startActiveTimer]);

    useEffect(() => {
        document.title = "Ôn tập flashcard - EasyTalk";
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await FlashCardService.fetchReview(id);
                setFlashcards(data.flashcards);
                setListName(data.flashcardList.name);
                setIsOwner(data.isOwner || false);
                setCurrentIndex(0);
                randomMode();
            } catch (err) {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi tải flashcard",
                    text: err.message,
                    confirmButtonText: "Quay lại",
                }).then(() => navigate("/flashcards"));
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    useEffect(() => {
        if (!navigator || flashcards.length == 0) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && flashcards.length > 0) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang luyện tập flashcard giữa chừng. Nếu rời trang, tiến độ sẽ không được lưu. Bạn có chắc muốn rời đi?",
                    showCancelButton: true,
                    confirmButtonText: "Rời đi",
                    cancelButtonText: "Ở lại",
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                });
                if (result.isConfirmed) {
                    allowNavigationRef.current = true;
                    originalMethod.apply(navigator, args);
                }
            } else {
                originalMethod.apply(navigator, args);
            }
        };
        navigator.push = (...args) => handleNavigation(originalPush, args);
        navigator.replace = (...args) => handleNavigation(originalReplace, args);
        return () => {
            navigator.push = originalPush;
            navigator.replace = originalReplace;
        };
    }, [navigator, flashcards.length]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (flashcards.length > 0 && !allowNavigationRef.current) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [flashcards.length]);

    const randomMode = () => {
        let modes = ["flip", "choice", "fill"];
        if (flashcards.length < 4) {
            modes = modes.filter(m => m !== "choice");
        }
        setMode(modes[Math.floor(Math.random() * modes.length)]);
    };

    const triggerButtonDelay = useCallback(() => {
        setShowActionButtons(false);
        setTimeout(() => {
            setShowActionButtons(true);
        }, 3000);
    }, []);

    const handleNext = () => {
        if (flashcards.length == 0) return;
        const nextIdx = Math.floor(Math.random() * flashcards.length);
        setCurrentIndex(nextIdx);
        randomMode();
        triggerButtonDelay();
    };

    const handleNextWeighted = () => {
        if (flashcards.length == 0) return;
        const weights = flashcards.map(f => {
            switch (f.difficulty) {
                case 1: return 0.2;
                case 2: return 1;
                case 3: return 3;
                default: return 1;
            }
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        let idx = 0;
        for (; idx < weights.length; idx++) {
            r -= weights[idx];
            if (r <= 0) break;
        }
        setCurrentIndex(idx);
        randomMode();
        triggerButtonDelay();
    };

    const handleRate = async (difficulty) => {
        const card = flashcards[currentIndex];
        try {
            await FlashCardService.updateDifficulty(card._id, difficulty);
            card.difficulty = difficulty;
            let title = "";
            switch (difficulty) {
                case 1: title = "Tuyệt vời!"; break;
                case 2: title = "Tốt!"; break;
                case 3: title = "Cố lên!"; break;
            }
            Swal.fire({
                icon: "success",
                title,
                timer: 1000,
                showConfirmButton: false,
            });
            handleNextWeighted();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể cập nhật độ khó.",
            });
        }
    };

    const handleRemove = async () => {
        const result = await Swal.fire({
            title: "Xác nhận xóa từ vựng",
            text: "Bạn đã nhớ từ này rồi chứ? Hệ thống sẽ tự động xóa từ vựng đã ghi nhớ khỏi danh sách luyện tập!",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Đúng vậy",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
        });
        if (result.isConfirmed) {
            const updated = flashcards.filter((_, idx) => idx !== currentIndex);
            setFlashcards(updated);
            if (updated.length == 0) {
                await finalizeAndExit();
            } else {
                setCurrentIndex(0);
                randomMode();
                triggerButtonDelay();
                Swal.fire({
                    icon: "success",
                    title: "Đã xóa từ vựng",
                    text: "Từ vựng đã được loại khỏi danh sách ôn tập.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        }
    };

    useEffect(() => {
        if (flashcards.length > 0) {
            triggerButtonDelay();
        }
    }, [flashcards.length, triggerButtonDelay]);

    const handleCheckAnswer = (answer, correct) => {
        if (answer.toLowerCase() == correct.toLowerCase()) {
            Swal.fire({
                icon: "success",
                title: "Chính xác!",
                timer: 1200,
                showConfirmButton: false,
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Sai rồi!",
                text: `Đáp án đúng là: ${correct}`,
            });
        }
    };

    const finalizeAndExit = async () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        const now = Date.now();
        const lastActiveSeconds = Math.floor((now - lastInteractionRef.current) / 1000);
        const finalActiveTime = activeTime + (lastActiveSeconds < 60 ? lastActiveSeconds : 0);
        if (finalActiveTime >= 60 && !hasRecordedRef.current) {
            await UserProgressService.recordStudyTime(finalActiveTime);
            hasRecordedRef.current = true;
        }
        allowNavigationRef.current = true;
        Swal.fire({
            icon: "success",
            title: "🎉 Hoàn thành!",
            text: "Bạn đã hoàn thành luyện tập flashcard!",
            confirmButtonText: "OK",
        }).then(() => navigate(`/flashcards/flashcardlist/${id}`));
    };

    const handleStop = async () => {
        const result = await Swal.fire({
            title: "Dừng học?",
            text: "Bạn có chắc chắn muốn dừng học không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Có, dừng lại",
            cancelButtonText: "Tiếp tục học",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });
        if (result.isConfirmed) {
            await finalizeAndExit();
        }
    };

    if (isLoading) return <LoadingScreen />;
    if (flashcards.length == 0) return <p>Không có flashcards nào.</p>;

    return (
        <div className="flashcard-review-container">
            <div className="section_tittle" style={{ marginBottom: "30px" }}>
                <h3 className="title">Luyện tập: {listName}</h3> 
            </div>
            <button className="btn_1" onClick={handleStop}>
                <i className="fas fa-stop-circle mr-2"></i>Dừng học
            </button>
            <FlashCardReviewCard
                card={flashcards[currentIndex]}
                mode={mode}
                onCheckAnswer={handleCheckAnswer}
                allWords={flashcards.map(c => c.word)}
            />
            <div className="flashcard-review-actions" style={{ marginTop: "30px" }}>
                {showActionButtons ? (
                    <>
                        {isOwner ? (
                            <>
                                <button className="btn_1 easy" onClick={() => handleRate(1)}>
                                    <i className="fas fa-thumbs-up"></i> Dễ
                                </button>
                                <button className="btn_1 normal" onClick={() => handleRate(2)}>
                                    <i className="fas fa-minus"></i> Thường
                                </button>
                                <button className="btn_1 hard" onClick={() => handleRate(3)}>
                                    <i className="fas fa-thumbs-down"></i> Khó
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn_1 danger" onClick={handleRemove}>
                                    <i className="fas fa-check-circle"></i> Đã nhớ từ vựng
                                </button>
                                <button className="btn_1 primary" onClick={handleNext}>
                                    <i className="fas fa-arrow-right"></i> Tiếp theo
                                </button>
                            </>
                        )}
                    </>
                ) : (
                    <div style={{ 
                        height: "60px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        color: "#999",
                        fontStyle: "italic"
                    }}>
                        Đang tải câu hỏi tiếp theo... (3s)
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashCardReview;