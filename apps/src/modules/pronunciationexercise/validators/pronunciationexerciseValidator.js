function validatePronunciationExerciseInput(body) {
    const errors = [];
    if(!body.title || body.title.trim() === '') {
        errors.push('Title is required');
    }
    if(body.sort !== undefined) {
        const sort = parseInt(body.sort);
        if(isNaN(sort) || sort < 0) {
            errors.push('Sort must be a non-negative number');
        }
    }
    if(body.questions && Array.isArray(body.questions)) {
        body.questions.forEach((q, index) => {
            if(!q.question || q.question.trim() === '') {
                errors.push(`Question ${index + 1}: Question text is required`);
            }
            if(!q.type) {
                errors.push(`Question ${index + 1}: Question type is required`);
            }
            const validTypes = ['pronunciation', 'multiple-choice', 'listening'];
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

module.exports = { validatePronunciationExerciseInput };