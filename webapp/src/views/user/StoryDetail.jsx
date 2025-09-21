import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import StorySentence from "../../components/user/story/StorySentence";
import StoryQuiz from "../../components/user/story/StoryQuiz";
import StoryComplete from "../../components/user/story/StoryComplete";
import StoryVocabularyQuiz from "../../components/user/story/StoryVocabularyQuiz";
import { StoryService } from "../../services/StoryService";

function StoryDetail() {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [displayedItems, setDisplayedItems] = useState([]);
    const [showQuizOnly, setShowQuizOnly] = useState(false);
    const [quizResults, setQuizResults] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(1); 
    const contentRefs = useRef([]);

    useEffect(() => {
        document.title = "Chi tiết bài học câu chuyện - EasyTalk";
        StoryService.getStoryById(id).then((res) => {
            setStory(res);
            setTimeout(() => {
                setDisplayedItems([{ type: "sentence", data: res.content[0] }]);
                const quizCount = res.content.filter(c => c.quiz).length;
                const total = res.content.length + quizCount + 1 + 1;
                setCurrentStep(1); 
                setTotalSteps(total);
            }, 2000);
        });
    },  [id]);

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

    if (!story) return <p className="no-stories">Đang tải...</p>;

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
                            onComplete={async () => {
                                try {
                                    await StoryService.completeStory(story._id);
                                    window.alert("Chúc mừng! Bạn đã hoàn thành câu chuyện. Câu chuyện tiếp theo đã được mở khóa.");
                                    window.location.href = "/story";
                                } catch (err) {
                                    console.error("Error completing story:", err);
                                    window.alert("Có lỗi xảy ra khi cập nhật tiến độ.");
                                }
                            }} 
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default StoryDetail;