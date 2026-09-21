import { createSlice } from "@reduxjs/toolkit";
import {
    fetchGrammarDetail,
    completeGrammar,
}   from "./grammardetailThunks.js";

const initialState = {
    grammar: null,
    displayContent: "",
    showQuiz: false,
    isComplete: false,
    grammarCompleted: false,
    currentStep: 0,
    totalSteps: 1,
    isLoading: false,
    error: null,
};

const grammardetailSlice = createSlice({
    name: "grammardetail",
    initialState,
    reducers: {
        setDisplayContent: (state, action) => {
            state.displayContent = action.payload;
        },
        nextStep: (state) => {
            if (state.currentStep < state.totalSteps) {
                state.currentStep += 1;
            }
        },
        setSteps: (state, action) => {
            state.totalSteps = action.payload;
            state.currentStep = 1;
        },
        showQuiz: (state) => {
            state.showQuiz = true;
        },
        completeQuiz: (state) => {
            state.isComplete = true;
        },
        resetGrammarDetail: () => initialState,
    },
    extraReducers: (builder) => {
        builder
        .addCase(fetchGrammarDetail.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
        .addCase(fetchGrammarDetail.fulfilled, (state, action) => {
            state.isLoading = false;
            state.grammar = action.payload;
            state.displayContent = action.payload.content || "";
        })
        .addCase(fetchGrammarDetail.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })
        .addCase(completeGrammar.fulfilled, (state) => {
            state.grammarCompleted = true;
        })
        .addCase(completeGrammar.rejected, (state) => {
            state.grammarCompleted = false;
        });
    },
});

export const {
    setDisplayContent,
    nextStep,
    setSteps,
    showQuiz,
    completeQuiz,
    resetGrammarDetail,
} = grammardetailSlice.actions;

export default grammardetailSlice.reducer;