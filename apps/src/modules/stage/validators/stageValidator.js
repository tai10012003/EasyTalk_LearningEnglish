function validateStageInput(body) {
    const errors = [];
    if(!body.title || body.title.trim() === '') {
        errors.push('Title is required');
    }
    if(!body.gateId) {
        errors.push('Gate is required');
    }
    if(!body.questions || !Array.isArray(body.questions) || body.questions.length === 0) {
        errors.push('At least one question is required');
    }
    if(body.questions && Array.isArray(body.questions)) {
        body.questions.forEach((q, index) => {
            if(!q.question || q.question.trim() === '') {
                errors.push(`Question ${index + 1}: Question text is required`);
            }
            if(!q.type) {
                errors.push(`Question ${index + 1}: Question type is required`);
            }
            const validTypes = ['multiple-choice', 'true-false', 'fill-in-blank'];
            if(q.type && !validTypes.includes(q.type)) {
                errors.push(`Question ${index + 1}: Type must be one of ${validTypes.join(', ')}`);
            }
            if(!q.correctAnswer) {
                errors.push(`Question ${index + 1}: Correct answer is required`);
            }
            if(q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) {
                errors.push(`Question ${index + 1}: Multiple choice must have at least 2 options`);
            }
        });
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateStageInput };