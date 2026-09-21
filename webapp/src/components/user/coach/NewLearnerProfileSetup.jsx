import React, { useMemo, useState } from "react";

const LABELS = {
    newbie: "Mới bắt đầu",
    beginner: "Beginner",
    elementary: "Elementary",
    intermediate: "Intermediate",
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
    pronunciation: "Phát âm",
    travel: "Travel",
    food: "Food",
    school: "School",
    business: "Business",
    "daily life": "Daily life"
};

const DEFAULT_FORM = {
    proficiencyLevel: "beginner",
    learningGoals: ["learning_journey", "ai_chat"],
    weakSkills: ["listening"],
    preferredTopics: ["travel"]
};

const FIELD_LIMITS = {
    learningGoals: 3,
    weakSkills: 2
};

function toggleValue(values, value, limit = Infinity) {
    const set = new Set(values);
    if (set.has(value)) set.delete(value);
    else if (set.size < limit) set.add(value);
    return [...set];
}

function NewLearnerProfileSetup({ isOpen, guideStep, isSaving, onSave, onSkip }) {
    const [form, setForm] = useState(DEFAULT_FORM);
    const fields = useMemo(() => Array.isArray(guideStep?.fields) ? guideStep.fields : [], [guideStep?.fields]);

    if (!isOpen) return null;

    const renderField = (field) => {
        const value = form[field.key];
        if (field.type === "single_select") {
            return (
                <div className="new-learner-field" key={field.key}>
                    <label>{field.label}</label>
                    <div className="new-learner-chip-row">
                        {field.options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={value === option ? "active" : ""}
                                onClick={() => setForm((current) => ({ ...current, [field.key]: option }))}
                            >
                                {LABELS[option] || option}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        const limit = field.maxSelections || FIELD_LIMITS[field.key] || Infinity;
        return (
            <div className="new-learner-field" key={field.key}>
                <label>
                    {field.label}
                    {Number.isFinite(limit) ? <span>Tối đa {limit}</span> : null}
                </label>
                <div className="new-learner-chip-row">
                    {field.options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={(value || []).includes(option) ? "active" : ""}
                            disabled={!(value || []).includes(option) && (value || []).length >= limit}
                            onClick={() => setForm((current) => ({
                                ...current,
                                [field.key]: toggleValue(current[field.key] || [], option, limit)
                            }))}
                        >
                            {LABELS[option] || option}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="new-learner-profile-root" data-coach-guide-target="new-learner-profile">
            <div className="new-learner-profile-dim"></div>
            <section className="new-learner-profile-card" aria-label="Thiết lập hồ sơ học tập">
                <div className="new-learner-profile-main">
                    <span className="new-learner-kicker">EasyTalk onboarding</span>
                    <h3>Thiết lập hồ sơ học tập</h3>
                    <p>Mình sẽ dùng thông tin này để chọn bài học, phần luyện tập và chủ đề phù hợp với bạn hơn.</p>

                    <div className="new-learner-fields">
                        {fields.map(renderField)}
                    </div>
                </div>

                <aside className="new-learner-coach-side">
                    <div className="new-learner-bot">
                        <i className="fas fa-robot"></i>
                    </div>
                    <strong>EasyTalk Companion</strong>
                    <p>{guideStep?.message || "Mình muốn hiểu bạn một chút để kèm bạn học đúng trọng tâm hơn."}</p>
                    <div className="new-learner-actions">
                        <button type="button" onClick={() => onSave?.(form)} disabled={isSaving}>
                            <i className={isSaving ? "fas fa-spinner fa-spin" : "fas fa-check-circle"}></i>
                            {isSaving ? "Đang lưu..." : "Lưu hồ sơ"}
                        </button>
                        <button type="button" className="secondary" onClick={onSkip} disabled={isSaving}>
                            Để sau
                        </button>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export default NewLearnerProfileSetup;
