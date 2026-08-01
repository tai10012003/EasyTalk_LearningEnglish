import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { LearningAgentService } from "@/services/LearningAgentService.jsx";

const LABELS = {
    newbie: "Mới bắt đầu",
    beginner: "Beginner",
    elementary: "Elementary",
    intermediate: "Intermediate",
    "upper-intermediate": "Upper-intermediate",
    advanced: "Advanced",
    learning_journey: "Hành trình học tập",
    story_lesson: "Bài học câu chuyện",
    grammar_lesson: "Bài học ngữ pháp",
    pronunciation_lesson: "Bài học phát âm",
    flashcard_practice: "Luyện tập flashcard",
    grammar_practice: "Luyện tập ngữ pháp",
    vocabulary_practice: "Luyện tập từ vựng",
    pronunciation_practice: "Luyện tập phát âm",
    dictation_practice: "Luyện tập nghe chép chính tả",
    ai_chat: "Giao tiếp với AI",
    ai_writing: "Luyện viết với AI",
    speaking: "Nói",
    listening: "Nghe",
    writing: "Viết",
    grammar: "Ngữ pháp",
    vocabulary: "Từ vựng",
    pronunciation: "Phát âm"
};

const MAX_LEARNING_GOALS = 3;
const MAX_WEAK_SKILLS = 2;

function toInputText(values = []) {
    return values.join(", ");
}

function fromInputText(value = "") {
    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 12);
}

function CoachMemoryPanel({ onMemorySaved }) {
    const [options, setOptions] = useState(null);
    const [form, setForm] = useState(null);
    const [topicsInput, setTopicsInput] = useState("");
    const [mistakesInput, setMistakesInput] = useState("");
    const [draftForm, setDraftForm] = useState(null);
    const [draftTopicsInput, setDraftTopicsInput] = useState("");
    const [draftMistakesInput, setDraftMistakesInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function loadMemory() {
            setIsLoading(true);
            try {
                const [memory, memoryOptions] = await Promise.all([
                    LearningAgentService.getMemory(),
                    LearningAgentService.getMemoryOptions()
                ]);
                if (!mounted) return;
                setOptions(memoryOptions);
                setForm({
                    proficiencyLevel: memory.proficiencyLevel || "beginner",
                    learningGoals: (memory.learningGoals || []).slice(0, memoryOptions?.limits?.learningGoals || MAX_LEARNING_GOALS),
                    weakSkills: (memory.weakSkills || []).slice(0, memoryOptions?.limits?.weakSkills || MAX_WEAK_SKILLS)
                });
                setTopicsInput(toInputText(memory.preferredTopics || []));
                setMistakesInput(toInputText(memory.frequentMistakes || []));
            } catch (error) {
                console.error("Cannot load learner memory:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        }
        loadMemory();
        return () => {
            mounted = false;
        };
    }, []);

    const openEditor = () => {
        if (!form) return;
        setDraftForm({
            ...form,
            learningGoals: [...(form.learningGoals || [])],
            weakSkills: [...(form.weakSkills || [])]
        });
        setDraftTopicsInput(topicsInput);
        setDraftMistakesInput(mistakesInput);
        setIsEditorOpen(true);
    };

    const closeEditor = () => {
        if (isSaving) return;
        setIsEditorOpen(false);
        setDraftForm(null);
        setDraftTopicsInput("");
        setDraftMistakesInput("");
    };

    useEffect(() => {
        window.addEventListener("easyTalk:coachMemoryEditRequested", openEditor);
        return () => {
            window.removeEventListener("easyTalk:coachMemoryEditRequested", openEditor);
        };
    }, [form, topicsInput, mistakesInput, isSaving]);

    const toggleArrayValue = (field, value) => {
        setDraftForm((current) => {
            const values = new Set(current?.[field] || []);
            if (values.has(value)) {
                values.delete(value);
            } else {
                const limit = field === "learningGoals"
                    ? (options?.limits?.learningGoals || MAX_LEARNING_GOALS)
                    : field === "weakSkills"
                    ? (options?.limits?.weakSkills || MAX_WEAK_SKILLS)
                    : Infinity;
                if (values.size >= limit) {
                    Swal.fire({
                        icon: "info",
                        title: "Chọn trọng tâm vừa đủ",
                        text: field === "learningGoals"
                            ? `Bạn chỉ nên chọn tối đa ${limit} mục tiêu học để Coach lên kế hoạch sát hơn.`
                            : `Bạn chỉ nên chọn tối đa ${limit} kỹ năng yếu để Coach ưu tiên đúng trọng tâm mỗi ngày.`,
                        timer: 1800,
                        showConfirmButton: false
                    });
                    return current;
                }
                values.add(value);
            }
            return { ...current, [field]: [...values] };
        });
    };

    const handleSave = async () => {
        if (!draftForm) return;
        setIsSaving(true);
        try {
            const payload = {
                ...draftForm,
                preferredTopics: fromInputText(draftTopicsInput),
                frequentMistakes: fromInputText(draftMistakesInput)
            };
            const memory = await LearningAgentService.updateMemory(payload);
            setForm({
                proficiencyLevel: memory.proficiencyLevel || "beginner",
                learningGoals: (memory.learningGoals || []).slice(0, options?.limits?.learningGoals || MAX_LEARNING_GOALS),
                weakSkills: (memory.weakSkills || []).slice(0, options?.limits?.weakSkills || MAX_WEAK_SKILLS)
            });
            setTopicsInput(toInputText(memory.preferredTopics || []));
            setMistakesInput(toInputText(memory.frequentMistakes || []));
            Swal.fire({
                icon: "success",
                title: "Đã lưu hồ sơ học tập",
                text: "AI Coach đang làm mới kế hoạch hôm nay.",
                timer: 1500,
                showConfirmButton: false
            });
            await onMemorySaved?.(memory);
            setIsEditorOpen(false);
            setDraftForm(null);
            setDraftTopicsInput("");
            setDraftMistakesInput("");
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Không thể lưu hồ sơ",
                text: error.message || "Vui lòng thử lại sau."
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <section
                className="coach-memory-card"
                data-coach-target="coach-memory-profile"
                data-coach-guide-target="learner-memory"
            >
                <div className="coach-memory-loading">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải hồ sơ học tập...</p>
                </div>
            </section>
        );
    }

    if (!form || !options) {
        return (
            <section
                className="coach-memory-card"
                data-coach-target="coach-memory-profile"
                data-coach-guide-target="learner-memory"
            >
                <div className="coach-memory-loading">
                    <i className="fas fa-exclamation-circle"></i>
                    <p>Chưa tải được hồ sơ học tập.</p>
                </div>
            </section>
        );
    }

    const formatList = (values = [], fallback = "Chưa có") => {
        const labels = values.map(value => LABELS[value] || value).filter(Boolean);
        return labels.length ? labels.join(", ") : fallback;
    };

    const renderEditorForm = () => {
        if (!draftForm) return null;
        return (
        <>
            <div className="coach-memory-field">
                <label>Trình độ hiện tại</label>
                <select
                    value={draftForm.proficiencyLevel}
                    onChange={(e) => setDraftForm({ ...draftForm, proficiencyLevel: e.target.value })}
                >
                    {options.proficiencyLevels.map(level => (
                        <option key={level} value={level}>{LABELS[level] || level}</option>
                    ))}
                </select>
            </div>

            <div className="coach-memory-field">
                <label>Mục tiêu học <span>Tối đa {options?.limits?.learningGoals || MAX_LEARNING_GOALS}</span></label>
                <div className="coach-memory-chips">
                    {options.learningGoals.map(goal => (
                        <button
                            key={goal}
                            type="button"
                            className={draftForm.learningGoals.includes(goal) ? "active" : ""}
                            disabled={!draftForm.learningGoals.includes(goal) && draftForm.learningGoals.length >= (options?.limits?.learningGoals || MAX_LEARNING_GOALS)}
                            onClick={() => toggleArrayValue("learningGoals", goal)}
                        >
                            {LABELS[goal] || goal}
                        </button>
                    ))}
                </div>
            </div>

            <div className="coach-memory-field">
                <label>Kỹ năng yếu cần Coach ưu tiên <span>Tối đa {options?.limits?.weakSkills || MAX_WEAK_SKILLS}</span></label>
                <div className="coach-memory-chips">
                    {options.skills.map(skill => (
                        <button
                            key={skill}
                            type="button"
                            className={draftForm.weakSkills.includes(skill) ? "active" : ""}
                            disabled={!draftForm.weakSkills.includes(skill) && draftForm.weakSkills.length >= (options?.limits?.weakSkills || MAX_WEAK_SKILLS)}
                            onClick={() => toggleArrayValue("weakSkills", skill)}
                        >
                            {LABELS[skill] || skill}
                        </button>
                    ))}
                </div>
            </div>

            <div className="coach-memory-field">
                <label>Chủ đề yêu thích luyện nói và luyện viết</label>
                <input
                    value={draftTopicsInput}
                    onChange={(e) => setDraftTopicsInput(e.target.value)}
                    placeholder="travel, work, food"
                />
            </div>

            <div className="coach-memory-field">
                <label>Lỗi thường gặp</label>
                <input
                    value={draftMistakesInput}
                    onChange={(e) => setDraftMistakesInput(e.target.value)}
                    placeholder="past tense, article a/an, pronunciation /θ/"
                />
            </div>

        </>
        );
    };

    return (
        <>
            <section
                className="coach-memory-card coach-memory-summary-card"
                data-coach-target="coach-memory-profile"
                data-coach-guide-target="learner-memory"
            >
                <div className="coach-section-heading">
                    <h3>Hồ sơ học tập của bạn</h3>
                    <span>Memory nền</span>
                </div>

                <div className="coach-memory-summary-text">
                    <div className="coach-memory-summary-item">
                        <i className="fas fa-signal"></i>
                        <p><strong>Trình độ hiện tại</strong><span>{LABELS[form.proficiencyLevel] || form.proficiencyLevel}</span></p>
                    </div>
                    <div className="coach-memory-summary-item">
                        <i className="fas fa-bullseye"></i>
                        <p><strong>Mục tiêu học</strong><span>{formatList(form.learningGoals)}</span></p>
                    </div>
                    <div className="coach-memory-summary-item">
                        <i className="fas fa-brain"></i>
                        <p><strong>Kỹ năng yếu cần Coach ưu tiên</strong><span>{formatList(form.weakSkills)}</span></p>
                    </div>
                    <div className="coach-memory-summary-item">
                        <i className="fas fa-tags"></i>
                        <p><strong>Chủ đề yêu thích luyện nói và luyện viết</strong><span>{formatList(fromInputText(topicsInput), "Có thể để trống")}</span></p>
                    </div>
                    <div className="coach-memory-summary-item">
                        <i className="fas fa-triangle-exclamation"></i>
                        <p><strong>Lỗi thường gặp</strong><span>{formatList(fromInputText(mistakesInput), "Có thể để trống")}</span></p>
                    </div>
                </div>

                <button className="coach-memory-save" onClick={openEditor}>
                    <i className="fas fa-user-edit"></i>
                    Cập nhật hồ sơ học tập
                </button>
            </section>

            {isEditorOpen && (
                <div className="coach-memory-modal-root" role="dialog" aria-modal="true" aria-label="Cập nhật hồ sơ học tập">
                    <div className="coach-memory-modal-dim" onClick={closeEditor}></div>
                    <section className="coach-memory-modal-card">
                        <button
                            className="coach-memory-modal-close"
                            type="button"
                            onClick={closeEditor}
                            disabled={isSaving}
                            aria-label="Đóng cập nhật hồ sơ"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        <div className="coach-section-heading">
                            <h3>Cập nhật hồ sơ học tập</h3>
                            <span>AI cá nhân hóa</span>
                        </div>
                        {renderEditorForm()}
                        <button className="coach-memory-save" onClick={handleSave} disabled={isSaving}>
                            <i className={isSaving ? "fas fa-spinner fa-spin" : "fas fa-save"}></i>
                            {isSaving ? "Đang lưu..." : "Lưu hồ sơ học tập"}
                        </button>
                    </section>
                </div>
            )}
        </>
    );
}

export default CoachMemoryPanel;
