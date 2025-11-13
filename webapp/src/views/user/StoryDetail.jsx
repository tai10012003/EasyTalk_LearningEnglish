import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, UNSAFE_NavigationContext } from 'react-router-dom';
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import StorySentence from "@/components/user/story/StorySentence.jsx";
import StoryQuiz from "@/components/user/story/StoryQuiz.jsx";
import StoryComplete from "@/components/user/story/StoryComplete.jsx";
import StoryVocabularyQuiz from "@/components/user/story/StoryVocabularyQuiz.jsx";
import { StoryService } from "@/services/StoryService.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import Swal from "sweetalert2";

function StoryDetail() {
    const { slug } = useParams();
    const { navigator } = React.useContext(UNSAFE_NavigationContext);
    const [story, setStory] = useState(null);
    const [storyCompleted, setStoryCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [displayedItems, setDisplayedItems] = useState([]);
    const [showQuizOnly, setShowQuizOnly] = useState(false);
    const [quizResults, setQuizResults] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(1);
    const allowNavigationRef = useRef(false);
    const contentRefs = useRef([]);
    const [activeTime, setActiveTime] = useState(0);
    const lastInteractionRef = useRef(Date.now());
    const intervalRef = useRef(null);
    const hasRecordedRef = useRef(false);

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
        if (!navigator || !story || storyCompleted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && displayedItems.length > 0 && !storyCompleted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang học giữa chừng. Nếu rời trang, tiến trình sẽ không được lưu. Bạn có chắc muốn rời đi?",
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
    }, [navigator, story, displayedItems.length, storyCompleted]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!storyCompleted && displayedItems.length > 0) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [storyCompleted, displayedItems.length]);

    useEffect(() => {
        document.title = "Chi tiết bài học câu chuyện - EasyTalk";
        const fetchStoryDetail = async () => {
            setIsLoading(true);
            try {
                const res = await StoryService.getStoryBySlug(slug);
                setStory(res);
                setTimeout(() => {
                    setDisplayedItems([{ type: "sentence", data: res.content[0] }]);
                    const quizCount = res.content.filter(c => c.quiz).length;
                    const total = res.content.length + quizCount + 1 + 1;
                    setCurrentStep(1);
                    setTotalSteps(total);
                }, 2000);
            } catch (error) {
                console.error("Error fetching story:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStoryDetail();
    }, [slug]);

    const getRandomWords = (arr, count) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    const handleQuizResult = (type, correct, total, unanswered) => {
        setQuizResults(prev => [...prev, { type, correct, total, unanswered }]);
    };

    const [vocabQuizShown, setVocabQuizShown] = useState(false);

    const handleNext = (currentIndex, result) => {
        if(result && result.type !== "vocabQuizCheck") { 
            handleQuizResult(result.type, result.correct, result.total, result.unanswered);
        }
        if (!story) return;
        const content = story.content;
        const lastItem = displayedItems[displayedItems.length - 1];
        // Nếu câu có quiz → hiển thị quiz
        if (lastItem.type == "sentence" && lastItem.data.quiz) {
            setDisplayedItems([...displayedItems, { type: "quiz", data: lastItem.data.quiz }]);
        } 
        // Nếu câu cuối cùng (hoặc quiz cuối cùng) → hiển thị VocabularyQuiz 1 lần
        else if (!vocabQuizShown &&
            ((lastItem.type == "sentence" && displayedItems.filter(i => i.type == "sentence").length == content.length) ||
            (lastItem.type == "quiz" && displayedItems.filter(i => i.type == "sentence").length == content.length))
        ) {
            // Gom tất cả từ vựng từ các câu
            const allVocabulary = content.flatMap(c => c.vocabulary || []);
            const quizWords = getRandomWords(allVocabulary, 5);
            setDisplayedItems([...displayedItems, { type: "vocabQuiz", data: quizWords }]);
            setVocabQuizShown(true);
            setShowQuizOnly(true);
        }
        // Câu bình thường → hiển thị câu tiếp theo
        else if (lastItem.type == "sentence") {
            const nextIndex = displayedItems.filter(i => i.type == "sentence").length;
            if (nextIndex < content.length) {
                setDisplayedItems([...displayedItems, { type: "sentence", data: content[nextIndex] }]);
            } else {
                setDisplayedItems([...displayedItems, { type: "complete" }]);
            }
        } 
        // Quiz bình thường → hiển thị câu tiếp theo nếu còn
        else if (lastItem.type == "quiz") {
            const nextIndex = displayedItems.filter(i => i.type == "sentence").length;
            if (nextIndex < content.length) {
                setDisplayedItems([...displayedItems, { type: "sentence", data: content[nextIndex] }]);
            } else {
                setDisplayedItems([...displayedItems, { type: "complete" }]);
            }
        } 
        // VocabularyQuiz → hiển thị hoàn thành
        else if (lastItem.type == "vocabQuiz") {
            if(result.type == "vocabQuizCheck") {
                setCurrentStep(prev => prev + 1);
                return;
            }
            if(result.type == "vocabQuiz") {
                const newDisplayed = [...displayedItems, { type: "complete" }];
                setDisplayedItems(newDisplayed);
                setCurrentStep(newDisplayed.length);
                setShowQuizOnly(false);
                return;
            }
        }
        // Scroll xuống
        setTimeout(() => {
            const lastRef = contentRefs.current[contentRefs.current.length - 1];
            if (lastRef) lastRef.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
        const step = displayedItems.length;
        setCurrentStep(step);
    };
    
    const handleComplete = async () => {
        try {
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
            await StoryService.completeStory(story._id);
            setStoryCompleted(true);
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Chúc mừng! Bạn đã hoàn thành bài học câu chuyện. Bài học câu chuyện tiếp theo đã được mở khóa.",
                confirmButtonText: "Quay lại danh sách bài học câu chuyện",
            }).then(() => {
                window.location.href = "/story";
            });
        } catch (err) {
            console.error("Error completing story:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Có lỗi xảy ra khi cập nhật tiến độ."
            });
        }
    };

    if (isLoading) { return <LoadingScreen />; }
    if (!story) return <p className="no-stories">Đang tải bài học câu chuyện ...</p>;

    return (
        <div className="story-detail-container container">
            <div className="story-detail-header my-4">
                <div className="section_tittle">
                    <h3>{story.title}</h3>
                </div>
                <p className="story-detail-description">{story.description}</p>
            </div>
            <div className="lesson-progress-container">
                <div
                    className="lesson-progress-bar-fill"
                    style={{ width: `${Math.round((currentStep / totalSteps) * 100)}%` }}
                >
                    {Math.round((currentStep / totalSteps) * 100)}%
                </div>
            </div>
            <p className="lesson-step-counter">Step {currentStep} / {totalSteps}</p>
            {displayedItems.map((item, idx) => (
                <div
                    key={idx}
                    ref={(el) => (contentRefs.current[idx] = el)}
                    style={{
                        display: showQuizOnly && item.type != "vocabQuiz" ? "none" : "block"
                    }}
                >
                    {item.type == "sentence" && <StorySentence sentence={item.data} onNext={() => handleNext(idx)} />}
                    {item.type == "quiz" && <StoryQuiz quiz={item.data} onNext={(result) => handleNext(idx, result)} />}
                    {item.type == "vocabQuiz" && <StoryVocabularyQuiz vocabulary={item.data} onNext={(result) => handleNext(idx, result)} />}
                    {item.type == "complete" && (
                        <StoryComplete
                            quizResults={quizResults} 
                            onComplete={handleComplete}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default StoryDetail;