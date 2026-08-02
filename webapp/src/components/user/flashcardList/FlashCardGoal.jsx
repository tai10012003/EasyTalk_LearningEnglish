import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FlashCardService } from "@/services/FlashCardService.jsx";
import { useTranslation } from "react-i18next";

const FlashCardGoal = ({ isOpen, onClose, currentGoal }) => {
    const { t } = useTranslation();
    const [goal, setGoal] = useState(20);
    const [isLoading, setIsLoading] = useState(false);
    const [todayCount, setTodayCount] = useState(0);
    const [isFetching, setIsFetching] = useState(false);

    const getBonusByGoal = (g) => {
        if (g <= 20) return 10;
        if (g <= 70) return 20;
        if (g <= 130) return 30;
        if (g <= 200) return 50;
        return 50;
    };

    useEffect(() => {
        if (!isOpen) return;
        const fetchGoal = async () => {
            setIsFetching(true);
            try {
                const res = await FlashCardService.fetchDailyGoal();
                if (res && res.data) {
                    setGoal(res.data.goal || 20);
                    setTodayCount(res.data.todayCount || 0);
                } else if (currentGoal) {
                    setGoal(currentGoal.goal || 20);
                    setTodayCount(currentGoal.todayCount || 0);
                }
            } catch (error) {
                console.error(t("flashcardPage.goal.fetchErrorLog"), error);
                Swal.fire({
                    icon: "error",
                    title: t("flashcardPage.goal.fetchErrorTitle"),
                    text: t("flashcardPage.goal.fetchErrorText"),
                });
            } finally {
                setIsFetching(false);
            }
        };
        fetchGoal();
    }, [isOpen, currentGoal, t]);

    const handleSave = async () => {
        if (todayCount > 0) {
            Swal.fire({
                icon: "warning",
                title: t("flashcardPage.goal.lockedTitle"),
                text: t("flashcardPage.goal.lockedText"),
            });
            return;
        }
        if (goal < 0 || goal > 200) {
            Swal.fire({
                icon: "warning",
                title: t("flashcardPage.goal.warningTitle"),
                text: t("flashcardPage.goal.rangeWarning"),
            });
            return;
        }
        setIsLoading(true);
        try {
            await FlashCardService.updateDailyGoal(goal);
            const bonus = getBonusByGoal(goal);
            Swal.fire({
                icon: "success",
                title: t("flashcardPage.goal.successTitle"),
                text: t("flashcardPage.goal.successText", { goal, bonus }),
            }).then(() => {
                onClose(goal);
                window.location.reload();
            });
        } catch {
            Swal.fire({
                icon: "error",
                title: t("flashcardPage.goal.errorTitle"),
                text: t("flashcardPage.goal.errorText"),
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;
    if (isFetching) {
        return (
            <div className="custom-modal-overlay">
                <div className="custom-modal text-center">
                    <p>{t("flashcardPage.goal.loading")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>{t("flashcardPage.goal.title")}</h5>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="custom-modal-body">
                    <p>{t("flashcardPage.goal.description")}</p>
                    <input
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(parseInt(e.target.value) || 0)}
                        min="0"
                        max="200"
                        className="form-control mb-3"
                        placeholder={t("flashcardPage.goal.placeholder")}
                        disabled={todayCount > 0}
                    />
                    {todayCount > 0 && (
                        <small className="text-warning d-block mb-2">
                            {t("flashcardPage.goal.todayLocked", { count: todayCount })}
                        </small>
                    )}
                    <p><strong>{t("flashcardPage.goal.bonusTitle")}</strong></p>
                    <ul className="mb-0">
                        <li>{t("flashcardPage.goal.bonus1")}</li>
                        <li>{t("flashcardPage.goal.bonus2")}</li>
                        <li>{t("flashcardPage.goal.bonus3")}</li>
                        <li>{t("flashcardPage.goal.bonus4")}</li>
                    </ul>
                    <p className="small text-info mt-2">
                        {t("flashcardPage.goal.note")}
                    </p>
                </div>
                {todayCount == 0 && (
                    <div className="custom-modal-footer">
                        <button className="footer-btn" onClick={handleSave} disabled={isLoading}>
                            {isLoading ? t("flashcardPage.goal.saving") : t("flashcardPage.goal.save")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlashCardGoal;
