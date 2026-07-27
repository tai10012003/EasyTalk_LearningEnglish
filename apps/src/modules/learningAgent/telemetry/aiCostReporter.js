class AICostReporter {
    estimate({ isMock, inputTokens = 0, outputTokens = 0, inputPricePerMillion = 0, outputPricePerMillion = 0 }) {
        if (isMock) return 0;
        const inputCost = (inputTokens / 1000000) * inputPricePerMillion;
        const outputCost = (outputTokens / 1000000) * outputPricePerMillion;
        return Number((inputCost + outputCost).toFixed(8));
    }
}

module.exports = AICostReporter;
