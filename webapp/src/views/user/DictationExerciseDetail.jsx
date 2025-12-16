import React, { useEffect, useState, useRef, useCallback  } from "react";
import Swal from "sweetalert2";
import { useParams, useNavigate, UNSAFE_NavigationContext } from "react-router-dom";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import DictationControls from "@/components/user/dictationexercise/DictationControls.jsx";
import DictationComplete from "@/components/user/dictationexercise/DictationComplete.jsx";
import DictationFullScript from "@/components/user/dictationexercise/DictationFullScript.jsx";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";

function DictationExerciseDetail() {
    const { slug } = useParams();
    const [exerciseId, setExerciseId] = useState(null);
    const { navigator } = React.useContext(UNSAFE_NavigationContext);
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [sentences, setSentences] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playSpeed, setPlaySpeed] = useState(1);
    const [fullScriptSpeed, setFullScriptSpeed] = useState(1);
    const [fullScript, setFullScript] = useState("");
    const [userInput, setUserInput] = useState("");
    const [result, setResult] = useState("");
    const [currentSentenceDisplay, setCurrentSentenceDisplay] = useState("");
    const [repeatCount, setRepeatCount] = useState(3);
    const [showNext, setShowNext] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [showScript, setShowScript] = useState(false);
    const allowNavigationRef = React.useRef(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
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
        document.title = "Chi tiết bài nghe chép chính tả - EasyTalk";
        async function fetchDictation() {
            setIsLoading(true);
            try {
                const data = await DictationExerciseService.getDictationExerciseBySlug(slug);
                if (data.success) {
                    setExerciseId(data.data._id);
                    setTitle(data.data.title);
                    const sentencesArr = data.data.content.split(". ").map((s) => s.trim()).filter((s) => s.length > 0).map((s) => (s.endsWith(".") ? s : s + "."));
                    setSentences(sentencesArr);
                    setFullScript(sentencesArr.join("<br>"));
                    setCurrentIndex(0);
                    setHasStarted(true);
                }
            } catch (err) {
                console.error("Error fetching dictation:", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDictation();
    }, [slug]);

    const removePunctuation = (text) => text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");

    useEffect(() => {
        if (sentences.length > 0) {
            playSentence(repeatCount, sentences[currentIndex]);
        }
    }, [currentIndex, sentences, playSpeed, repeatCount]);

    const playSentence = (repeats = 1, sentenceText) => {
        speechSynthesis.cancel();
        const sentence = sentenceText || sentences[currentIndex];
        let count = 0;
        function speak() {
            const utterance = new SpeechSynthesisUtterance(sentence);
            utterance.lang = "en-US";
            utterance.rate = playSpeed;
            speechSynthesis.speak(utterance);
            count++;
            if (count < repeats) {
                utterance.onend = speak;
            }
        }
        if (sentence) speak();
    };

    const checkDictation = () => {
        const correctSentence = removePunctuation(
            sentences[currentIndex].toLowerCase().trim()
        );
        const correctWords = correctSentence.split(" ");
            const userWords = removePunctuation(userInput.toLowerCase().trim()).split(
            " "
        );
        let matchIndex = 0;
        let correctSoFar = "";
        while (matchIndex < userWords.length && matchIndex < correctWords.length) {
            if (userWords[matchIndex] == correctWords[matchIndex]) {
                correctSoFar += correctWords[matchIndex] + " ";
            } else {
                break;
            }
            matchIndex++;
        }
        if (matchIndex < correctWords.length) {
            correctSoFar += correctWords[matchIndex] + " ";
        }
        let maskedSentence = correctSoFar;
        for (let i = matchIndex + 1; i < correctWords.length; i++) {
            maskedSentence += "*** ";
        }
        setCurrentSentenceDisplay(maskedSentence.trim());
        if (userWords.join(" ") == correctSentence) {
            setResult(
                <p style={{ color: "green" }}>
                    Câu chính xác: {sentences[currentIndex]}
                </p>
            );
            setShowNext(true);
        } else {
            setResult(
                <p style={{ color: "black" }}>
                    Đáp án hiện tại: {maskedSentence.trim()}
                </p>
            );
        }
    };

    const skipSentence = () => {
        setUserInput(sentences[currentIndex]);
        setResult(
            <p style={{ color: "green" }}>
                Câu chính xác: {sentences[currentIndex]}
            </p>
        );
        setShowNext(true);
    };

    useEffect(() => {
        if (!navigator || !hasStarted || exerciseCompleted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && hasStarted && !exerciseCompleted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang làm bài luyện nghe. Nếu rời trang, tiến trình sẽ không được lưu. Bạn có chắc muốn rời đi?",
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
    }, [navigator, hasStarted, exerciseCompleted]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!exerciseCompleted && hasStarted) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [exerciseCompleted, hasStarted]);

    const nextSentence = () => {
        speechSynthesis.cancel();
        if (currentIndex + 1 < sentences.length) {
            setCurrentIndex(currentIndex + 1);
            setUserInput("");
            setResult("");
            setCurrentSentenceDisplay("");
            setShowNext(false);
        } else {
            setResult(
                <p className="completion-message">
                    Bạn đã hoàn thành bài luyện nghe chép chính tả !
                </p>
            );
            setShowActions(true);
        }
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
            await DictationExerciseService.completeDictationExercise(exerciseId);
            setExerciseCompleted(true);
            Swal.fire({
                icon: "success",
                title: "Hoàn thành!",
                text: "Chúc mừng! Bạn đã hoàn thành bài luyện tập nghe chính tả. Bài luyện tập nghe chính tả tiếp theo đã được mở khóa.",
                confirmButtonText: "Quay lại danh sách bài luyện tập nghe chính tả",
            }).then(() => {
                window.location.href = "/dictation-exercise";
            });
        } catch (err) {
            console.error("Error completing dictation exercise:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Có lỗi xảy ra khi cập nhật tiến độ."
            });
        }
    }

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="container dictation-container">
            {!showActions ? (
                <>
                    <div className="dictation-learning">
                        <div className="section_tittle">
                            <h3>Chủ đề: {title}</h3>
                        </div>
                        <DictationControls
                            playSentence={playSentence}
                            playSpeed={playSpeed}
                            updateSpeed={(e) => setPlaySpeed(e.target.value)}
                            userInput={userInput}
                            setUserInput={setUserInput}
                            checkDictation={checkDictation}
                            skipSentence={skipSentence}
                            nextSentence={nextSentence}
                            result={result}
                            currentSentenceDisplay={currentSentenceDisplay}
                            showNext={showNext}
                            repeatCount={repeatCount}
                            setRepeatCount={setRepeatCount}
                            currentSentence={sentences[currentIndex]}
                        />
                    </div>
                </>    
            ) : (
                <>
                    <DictationComplete
                        onComplete={handleComplete}
                    />
                    <DictationFullScript
                        fullScript={fullScript}
                        toggleScript={() => setShowScript(!showScript)}
                        showScript={showScript}
                        playFullScript={() => {
                            speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(sentences.join(" "));
                            utterance.lang = "en-US";
                            utterance.rate = Number(fullScriptSpeed);
                            speechSynthesis.speak(utterance);
                        }}
                        fullScriptSpeed={fullScriptSpeed}
                        updateFullScriptSpeed={(e) => setFullScriptSpeed(e.target.value)}
                    />
                </>
                
            )}
        </div>
    );
}

export default DictationExerciseDetail;