import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function scrollTargetToCenter(target) {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const documentHeight = document.documentElement.scrollHeight;
    const viewportHeight = window.innerHeight;
    const targetCenter = window.scrollY + rect.top + rect.height / 2;
    const nextTop = clamp(targetCenter - viewportHeight / 2, 0, Math.max(0, documentHeight - viewportHeight));
    window.scrollTo({
        top: nextTop,
        behavior: "smooth"
    });
}

function clearActiveGuideTargets() {
    document.querySelectorAll(".coach-guide-target-active").forEach((target) => {
        target.classList.remove("coach-guide-target-active");
    });
}

function CoachGuideRobot({ mood }) {
    return (
        <div className={`coach-guide-robot mood-${mood}`} aria-hidden="true">
            <div className="coach-guide-robot-antenna"></div>
            <div className="coach-guide-robot-head">
                <span></span>
                <span></span>
                <i></i>
            </div>
            <div className="coach-guide-robot-body">
                <b></b>
            </div>
        </div>
    );
}

function CoachGuideOverlay({
    isOpen,
    title,
    message,
    mood,
    status,
    targetKey,
    steps = [],
    currentStep = 0,
    onBack,
    onNext,
    onClose,
    onSpeak,
    onStop,
    onStartStep,
    finalStepLabel = "Bắt đầu bước này",
    minuteOptions = [],
    selectedMinutes,
    onSelectMinutes,
    variant = "default",
    primaryAction,
    secondaryAction,
    tertiaryAction
}) {
    const [targetRect, setTargetRect] = useState(null);
    const [isTourNavLocked, setIsTourNavLocked] = useState(false);
    const tourNavLockTimerRef = useRef(null);
    const activeStep = steps[currentStep];
    const isCompact = variant === "compact";
    const isLabel = variant === "label";
    const isPointer = variant === "pointer";
    const isSpeaking = mood === "talking" || mood === "thinking";
    const soundTooltip = isSpeaking ? "Dừng giọng nói" : "Phát giọng nói";

    useEffect(() => {
        if (!isOpen) return undefined;
        document.body.classList.add("coach-guide-active");
        document.documentElement.classList.add("coach-guide-active");

        const getGuideCard = (event) => event.target?.closest?.(".coach-guide-card");
        const preventBackgroundScroll = (event) => {
            const guideCard = getGuideCard(event);
            if (guideCard && event.type === "wheel") {
                guideCard.scrollTop += event.deltaY;
            }
            event.preventDefault();
        };
        const preventScrollKeys = (event) => {
            const scrollKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
            if (!scrollKeys.includes(event.key)) return;
            const guideCard = getGuideCard(event);
            if (guideCard) {
                const scrollAmount = ["ArrowDown", " "].includes(event.key) ? 80 : event.key === "ArrowUp" ? -80 : 0;
                if (event.key === "PageDown") guideCard.scrollTop += guideCard.clientHeight * 0.8;
                if (event.key === "PageUp") guideCard.scrollTop -= guideCard.clientHeight * 0.8;
                if (event.key === "Home") guideCard.scrollTop = 0;
                if (event.key === "End") guideCard.scrollTop = guideCard.scrollHeight;
                if (scrollAmount) guideCard.scrollTop += scrollAmount;
            }
            event.preventDefault();
        };

        document.addEventListener("wheel", preventBackgroundScroll, { passive: false, capture: true });
        document.addEventListener("touchmove", preventBackgroundScroll, { passive: false, capture: true });
        document.addEventListener("keydown", preventScrollKeys, { capture: true });

        return () => {
            document.body.classList.remove("coach-guide-active");
            document.documentElement.classList.remove("coach-guide-active");
            document.removeEventListener("wheel", preventBackgroundScroll, { capture: true });
            document.removeEventListener("touchmove", preventBackgroundScroll, { capture: true });
            document.removeEventListener("keydown", preventScrollKeys, { capture: true });
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || steps.length === 0) {
            setIsTourNavLocked(false);
            window.clearTimeout(tourNavLockTimerRef.current);
        }

        return () => {
            window.clearTimeout(tourNavLockTimerRef.current);
        };
    }, [isOpen, steps.length]);

    useEffect(() => {
        if (!isOpen || !targetKey) {
            setTargetRect(null);
            clearActiveGuideTargets();
            return undefined;
        }

        let activeTarget = null;
        let isCancelled = false;
        const shouldHighlightTarget = !isLabel && !isPointer;

        const updateTargetRect = () => {
            const target = document.querySelector(`[data-coach-target="${targetKey}"]`);
            if (!target) {
                setTargetRect(null);
                return;
            }
            const rect = target.getBoundingClientRect();
            setTargetRect({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            });
        };

        const findAndFocusTarget = () => {
            if (isCancelled) return false;
            const target = document.querySelector(`[data-coach-target="${targetKey}"]`);
            if (!target) return false;
            clearActiveGuideTargets();
            activeTarget = target;
            if (shouldHighlightTarget) {
                activeTarget.classList.add("coach-guide-target-active");
            }
            scrollTargetToCenter(activeTarget);
            window.setTimeout(updateTargetRect, 120);
            window.setTimeout(updateTargetRect, 420);
            window.setTimeout(updateTargetRect, 820);
            return true;
        };

        findAndFocusTarget();
        const retryTimer = window.setInterval(() => {
            if (findAndFocusTarget()) {
                window.clearInterval(retryTimer);
            }
        }, 180);
        const stopRetryTimer = window.setTimeout(() => window.clearInterval(retryTimer), 6000);
        window.addEventListener("resize", updateTargetRect);
        window.addEventListener("scroll", updateTargetRect, true);

        return () => {
            isCancelled = true;
            window.clearInterval(retryTimer);
            window.clearTimeout(stopRetryTimer);
            activeTarget?.classList.remove("coach-guide-target-active");
            clearActiveGuideTargets();
            window.removeEventListener("resize", updateTargetRect);
            window.removeEventListener("scroll", updateTargetRect, true);
        };
    }, [isLabel, isOpen, isPointer, targetKey]);

    const cardStyle = useMemo(() => {
        if (isPointer) {
            const cardWidth = Math.min(330, window.innerWidth - 28);
            if (!targetRect) {
                return {
                    left: 24,
                    right: "auto",
                    bottom: 24,
                    top: "auto",
                    width: cardWidth,
                    transform: "none"
                };
            }
            const top = targetRect.top > 250
                ? targetRect.top - 178
                : targetRect.top + Math.min(90, targetRect.height + 18);
            return {
                left: clamp(targetRect.left + 8, 14, window.innerWidth - cardWidth - 14),
                top: clamp(top, 82, window.innerHeight - 250),
                right: "auto",
                bottom: "auto",
                width: cardWidth,
                transform: "none"
            };
        }
        if (isLabel) {
            if (!targetRect) {
                return {
                    left: 24,
                    right: "auto",
                    bottom: 24,
                    top: "auto",
                    width: "auto",
                    transform: "none"
                };
            }
            return {
                left: clamp(targetRect.left + 4, 14, window.innerWidth - 230),
                top: clamp(targetRect.top - 54, 72, window.innerHeight - 70),
                right: "auto",
                bottom: "auto",
                width: "auto",
                transform: "none"
            };
        }
        if (isCompact) {
            return {
                left: 24,
                right: "auto",
                bottom: 24,
                top: "auto",
                width: Math.min(320, window.innerWidth - 28),
                transform: "none"
            };
        }
        if (!targetRect) return undefined;
        const cardWidth = Math.min(430, window.innerWidth - 28);
        const gap = 18;
        const canPlaceRight = targetRect.left + targetRect.width + gap + cardWidth < window.innerWidth;
        const left = canPlaceRight
            ? targetRect.left + targetRect.width + gap
            : clamp(targetRect.left - cardWidth - gap, 14, window.innerWidth - cardWidth - 14);
        return {
            left,
            top: "50%",
            right: "auto",
            bottom: "auto",
            width: cardWidth,
            transform: "translateY(-50%)"
        };
    }, [isCompact, isLabel, isPointer, targetRect]);

    if (!isOpen) return null;

    const lockTourNavigation = () => {
        setIsTourNavLocked(true);
        window.clearTimeout(tourNavLockTimerRef.current);
        tourNavLockTimerRef.current = window.setTimeout(() => {
            setIsTourNavLocked(false);
        }, 3000);
    };

    const handleTourBack = () => {
        if (isTourNavLocked) return;
        onBack?.();
        lockTourNavigation();
    };

    const handleTourNext = () => {
        if (isTourNavLocked) return;
        onNext?.();
        lockTourNavigation();
    };

    const handleStartStep = () => {
        if (isTourNavLocked) return;
        onStartStep?.();
        lockTourNavigation();
    };

    return (
        <div className={`coach-guide-root ${targetKey ? "has-target" : ""} ${isCompact ? "is-compact" : ""} ${isLabel ? "is-label" : ""} ${isPointer ? "is-pointer" : ""}`}>
            <div className="coach-guide-dim"></div>
            {targetRect && !isLabel && !isPointer && (
                <div
                    className="coach-guide-spotlight"
                    style={{
                        left: targetRect.left - 8,
                        top: targetRect.top - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16
                    }}
                ></div>
            )}

            <section className="coach-guide-card" style={cardStyle} aria-label="AI Coach guide">
                {isPointer ? (
                    <div className="coach-guide-pointer-card">
                        <button className="coach-guide-close" type="button" onClick={onClose} aria-label="Đóng AI Coach">
                            <i className="fas fa-times"></i>
                        </button>
                        <CoachGuideRobot mood={mood} />
                        <span>AI Coach</span>
                        <h4>{title}</h4>
                        <p>{message}</p>
                        {primaryAction && (
                            <button type="button" onClick={primaryAction.onClick}>
                                <i className={primaryAction.icon}></i>
                                {primaryAction.label}
                            </button>
                        )}
                    </div>
                ) : isLabel ? (
                    <button className="coach-guide-label-pill" type="button" onClick={onClose} aria-label="Đóng hướng dẫn hồ sơ học tập">
                        {title}
                    </button>
                ) : (
                    <>
                <button className="coach-guide-close" type="button" onClick={onClose} aria-label="Đóng AI Coach">
                    <i className="fas fa-times"></i>
                </button>

                {isCompact ? (
                    <div className="coach-guide-compact-body">
                        <CoachGuideRobot mood={mood} />
                        <div>
                            <span>AI Coach</span>
                            <h4>{title}</h4>
                            <p>{message}</p>
                        </div>
                        {primaryAction && (
                            <button type="button" onClick={primaryAction.onClick}>
                                <i className={primaryAction.icon}></i>
                                {primaryAction.label}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                <header className="coach-guide-header">
                    <div>
                        <span>AI Coach</span>
                        <h4>{title}</h4>
                    </div>
                    <CoachGuideRobot mood={mood} />
                </header>

                <div className="coach-guide-body">
                    <div className="coach-guide-status-row">
                        <div>
                            <strong>
                                <i className="fas fa-robot"></i>
                                EasyTalk Companion
                                <button
                                    type="button"
                                    className={`coach-guide-sound-toggle ${isSpeaking ? "active" : ""}`}
                                    onClick={isSpeaking ? onStop : onSpeak}
                                    aria-label={soundTooltip}
                                    title={soundTooltip}
                                >
                                    <i className={`fas ${isSpeaking ? "fa-volume-mute" : "fa-volume-up"}`}></i>
                                    <span>{soundTooltip}</span>
                                </button>
                            </strong>
                            <em>{status}</em>
                        </div>
                    </div>

                    {activeStep && (
                        <article className="coach-guide-active-step">
                            <span>{currentStep === 0 ? "Ưu tiên nhất" : `Bước ${currentStep + 1}`}</span>
                            <h5>{activeStep.title}</h5>
                            <p>{activeStep.meta}</p>
                        </article>
                    )}

                    <div className="coach-guide-message">
                        <p>{message}</p>
                    </div>

                    {minuteOptions.length > 0 && (
                        <div className="coach-guide-minute-grid" aria-label="Chọn thời gian học hôm nay">
                            {minuteOptions.map((minutes) => (
                                <button
                                    key={minutes}
                                    type="button"
                                    className={minutes === selectedMinutes ? "active" : ""}
                                    onClick={() => onSelectMinutes?.(minutes)}
                                >
                                    {minutes}
                                    <span>phút</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* {steps.length > 0 && (
                        <div className="coach-guide-step-strip">
                            {steps.map((step, index) => (
                                <button
                                    key={step.targetKey || `${step.title}-${index}`}
                                    type="button"
                                    className={index === currentStep ? "active" : ""}
                                    disabled={isTourNavLocked}
                                    onClick={() => step.onSelect?.(index)}
                                    aria-label={`Xem bước ${index + 1}: ${step.title}`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    )} */}

                    {steps.length === 0 && (primaryAction || secondaryAction) && (
                        <div className="coach-guide-actions">
                            {primaryAction?.to ? (
                                <Link to={primaryAction.to} onClick={primaryAction.onClick}>
                                    <i className={primaryAction.icon}></i>
                                    {primaryAction.label}
                                </Link>
                            ) : primaryAction ? (
                                <button type="button" onClick={primaryAction.onClick}>
                                    <i className={primaryAction.icon}></i>
                                    {primaryAction.label}
                                </button>
                            ) : null}

                            {secondaryAction && (
                                <button type="button" className="coach-guide-secondary" onClick={secondaryAction.onClick}>
                                    <i className={secondaryAction.icon}></i>
                                    {secondaryAction.label}
                                </button>
                            )}
                        </div>
                    )}

                    {steps.length > 0 && (
                        isTourNavLocked ? (
                            <div className="coach-guide-tour-wait">
                                <i className="fas fa-spinner"></i>
                                Loading ....
                            </div>
                        ) : (
                            <div className="coach-guide-tour-controls">
                                <button type="button" onClick={handleTourBack} disabled={currentStep === 0}>
                                    Back
                                </button>
                                <span>{currentStep + 1} / {steps.length}</span>
                                {currentStep < steps.length - 1 ? (
                                    <button type="button" onClick={handleTourNext}>Next</button>
                                ) : (
                                    <button type="button" onClick={handleStartStep}>{finalStepLabel}</button>
                                )}
                            </div>
                        )
                    )}

                    {tertiaryAction && (
                        <button type="button" className="coach-guide-text-action" onClick={tertiaryAction.onClick}>
                            {tertiaryAction.label}
                        </button>
                    )}
                </div>
                    </>
                )}
                    </>
                )}
            </section>
        </div>
    );
}

export default CoachGuideOverlay;
