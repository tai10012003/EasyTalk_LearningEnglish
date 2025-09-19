import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DictationControls from "../../components/user/dictationexercise/DictationControls";
import DictationComplete from "../../components/user/dictationexercise/DictationComplete";
import DictationFullScript from "../../components/user/dictationexercise/DictationFullScript";
import { DictationExerciseService } from "../../services/DictationExerciseService";

function DictationExerciseDetail() {
    const { id } = useParams();
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
    const [showNext, setShowNext] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [showScript, setShowScript] = useState(false);

    useEffect(() => {
        async function fetchDictation() {
        try {
            const data = await DictationExerciseService.getDictationExerciseById(id);
            if (data.success) {
            setTitle(data.data.title);

            const sentencesArr = data.data.content
                .split(". ")
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
                .map((s) => (s.endsWith(".") ? s : s + "."));

            setSentences(sentencesArr);
            setFullScript(sentencesArr.join("<br>"));
            setCurrentIndex(0);
            }
        } catch (err) {
            console.error("Error fetching dictation:", err);
        }
        }
        fetchDictation();
    }, [id]);

    const removePunctuation = (text) => text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s{2,}/g, " ");

    useEffect(() => {
        if (sentences.length > 0) {
        playSentence(3, sentences[currentIndex]);
        }
    }, [currentIndex, sentences, playSpeed]);

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
            if (userWords[matchIndex] === correctWords[matchIndex]) {
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
        if (userWords.join(" ") === correctSentence) {
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

    const retryExercise = () => window.location.reload();
    const goBackToList = () => navigate("/dictation-exercise");

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
                        />
                    </div>
                </>    
            ) : (
                <>
                    <DictationComplete
                        retryExercise={retryExercise}
                        goBackToList={goBackToList}
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