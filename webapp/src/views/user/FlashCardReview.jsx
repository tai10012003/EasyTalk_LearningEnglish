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
    const [readyForActions, setReadyForActions] = useState(false);
    const [cardKey, setCardKey] = useState(0);
    const pendingUpdatesRef = useRef([]);
    const lastCombinationsRef = useRef([]);

    const handleUserInteraction = useCallback(() => {
        lastInteractionRef.current = Date.now();
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
            if (flashcards.length > 0) {
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

    useEffect(() => {
        lastCombinationsRef.current = [];
    }, [flashcards.length]);

    const randomMode = (preferredCardId = null) => {
        if (flashcards.length === 0) return;
        let modes = ["flip", "choice", "fill"];
        if (flashcards.length < 4) {
            modes = modes.filter(m => m !== "choice");
        }
        const currentCardId = flashcards[currentIndex]?._id;
        const currentMode = mode;
        const banned = lastCombinationsRef.current.slice(0, 2);
        let validPairs = [];
        flashcards.forEach((card, idx) => {
            modes.forEach(mode => {
                const alreadyBanned = banned.some(
                    b => b.cardId === card._id && b.mode === mode
                );
                if (!alreadyBanned) {
                    validPairs.push({
                        cardId: card._id,
                        mode,
                        cardIndex: idx
                    });
                }
            });
        });
        if (preferredCardId) {
            const preferred = validPairs.filter(p => p.cardId === preferredCardId);
            if (preferred.length > 0) {
                validPairs = preferred;
            }
        }
        if (validPairs.length === 0) {
            lastCombinationsRef.current = [];
            validPairs = flashcards.flatMap((card, idx) =>
                modes.map(mode => ({ cardId: card._id, mode, cardIndex: idx }))
            );
        }
        const chosen = validPairs[Math.floor(Math.random() * validPairs.length)];
        if (currentCardId) {
            lastCombinationsRef.current = [
                { cardId: currentCardId, mode: currentMode },
                ...lastCombinationsRef.current.slice(0, 2)
            ].slice(0, 3);
        }
        setCurrentIndex(chosen.cardIndex);
        setMode(chosen.mode);
        setReadyForActions(false);
        setCardKey(prev => prev + 1);
    };

    const handleNext = () => {
        randomMode();
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
        const selectedCardId = flashcards[idx]._id;
        randomMode(selectedCardId);
    };

    const handleRate = async (difficulty) => {
        if (!isOwner) return;
        const card = flashcards[currentIndex];
        card.difficulty = difficulty;
        setFlashcards([...flashcards]);
        pendingUpdatesRef.current.push({
            cardId: card._id,
            difficulty
        });
        let title = "";
        switch (difficulty) {
            case 1: title = "Tuyệt vời!"; break;
            case 2: title = "Tốt!"; break;
            case 3: title = "Cố lên!"; break;
        }
        Swal.fire({
            icon: "success",
            title,
            timer: 800,
            showConfirmButton: false,
        });
        handleNextWeighted();
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
            lastCombinationsRef.current = [];
            if (updated.length === 0) {
                setFlashcards(updated);
                await finalizeAndExit();
            } else {
                setFlashcards(updated);
                Swal.fire({
                    icon: "success",
                    title: "Đã xóa từ vựng",
                    text: `Còn ${updated.length} từ để ôn tiếp!`,
                    timer: 1500,
                    showConfirmButton: false,
                });
                setTimeout(() => {
                    const randomIndex = Math.floor(Math.random() * updated.length);
                    let modes = ["flip", "choice", "fill"];
                    if (updated.length < 4) {
                        modes = modes.filter(m => m !== "choice");
                    }
                    const randomModeChoice = modes[Math.floor(Math.random() * modes.length)];
                    setCurrentIndex(randomIndex);
                    setMode(randomModeChoice);
                    setReadyForActions(false);
                    setCardKey(prev => prev + 1);
                }, 100);
            }
        }
    };

    const handleAnswerReady = () => {
        setReadyForActions(true);
    };

    useEffect(() => {
        setReadyForActions(false);
        if (mode == "flip") {
            const timer = setTimeout(() => {
                setReadyForActions(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [mode, currentIndex, cardKey]);

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
        if (isOwner && pendingUpdatesRef.current.length > 0) {
            try {
                await FlashCardService.updateDifficulties(pendingUpdatesRef.current);
            } catch (err) {
                console.error("Lỗi gửi batch update:", err);
            }
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
            {
                flashcards.length > 0 && flashcards[currentIndex] ? (
                    <FlashCardReviewCard
                        key={cardKey}
                        card={flashcards[currentIndex]}
                        mode={mode}
                        onCheckAnswer={handleCheckAnswer}
                        allWords={flashcards.map(c => c.word)}
                        onAnswerReady={handleAnswerReady}
                    />
                ) : flashcards.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "50px", fontSize: "1.2rem" }}>
                        <p>Chúc mừng! Bạn đã hoàn thành toàn bộ flashcard!</p>
                        <button className="btn_1" onClick={finalizeAndExit}>
                            Hoàn thành
                        </button>
                    </div>
                ) : null
            }
            <div className="flashcard-review-actions" style={{ marginTop: "30px" }}>
                {readyForActions ? (
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
                        {mode == "flip" ? "Đang tải câu hỏi tiếp theo... (3s)" : "Vui lòng trả lời câu hỏi để tiếp tục"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashCardReview;