import React from 'react';
import iconhappy from "@/assets/images/iconhappy.png";
import iconsad from "@/assets/images/iconsad.png";

const VocabularyExerciseResultScreen = ({ correctAnswers, totalQuestions, onRestart, onExit }) => {
    const incorrectAnswers = totalQuestions - correctAnswers;
    const percentageCorrect = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const iconSrc = percentageCorrect >= 50 ? iconhappy : iconsad;

    return (
        <div className="exercise-result-screen text-center">
            <h4 className="text-center">KẾT QUẢ BÀI LUYỆN TẬP TỪ VỰNG</h4>
            
            <div className="row mt-4">
                <div className="col-md-7 exercise-result-content">
                    <p>
                        Tổng số câu: <span className="exercise-result-number">{totalQuestions}</span>
                    </p>
                    <p>
                        Số câu đúng: <span className="exercise-result-number correct">{correctAnswers}</span>
                    </p>
                    <p>
                        Số câu sai: <span className="exercise-result-number incorrect">{incorrectAnswers}</span>
                    </p>
                    <p>
                        Tỷ lệ đúng: <span className="exercise-result-percentage">{percentageCorrect.toFixed(2)}%</span>
                    </p>
                </div>
                
                <div className="col-md-5 text-center exercise-result-icon">
                    <img src={iconSrc} alt="Icon kết quả" />
                </div>
            </div>
            
            <div className="d-flex flex-column align-items-center mt-4">
                <button
                    className="btn btn-danger exercise-restart-btn"
                    onClick={onRestart}
                >
                    Làm lại
                </button>
                <button
                    className="btn btn-secondary exercise-exit-btn"
                    onClick={onExit}
                >
                    Thoát
                </button>
            </div>
        </div>
    );
};

export default VocabularyExerciseResultScreen;