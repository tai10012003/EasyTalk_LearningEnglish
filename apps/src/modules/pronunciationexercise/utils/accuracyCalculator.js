function calculateAccuracy(transcription, correctAnswer) {
    const transWords = transcription.toLowerCase().split(/\s+/);
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);
    const totalWords = correctWords.length;
    let matchedWords = 0;
    let detailedResult = [];
    correctWords.forEach((word, i) => {
        if(transWords[i] == word) {
            matchedWords++;
            detailedResult.push({ word: word, correct: true });
        } else {
            detailedResult.push({ word: word, correct: false, userSaid: transWords[i] || '(không phát hiện)' });
        }
    });
    const accuracy = ((matchedWords / totalWords) * 100).toFixed(2);
    return { 
        accuracy: parseFloat(accuracy), 
        detailedResult,
        matchedWords,
        totalWords
    };
}

module.exports = { calculateAccuracy };