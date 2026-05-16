import { createSlice } from "@reduxjs/toolkit";
import { fetchGrammars, fetchGrammarDetail } from "./grammarThunks";

const grammarSlice = createSlice({
    name: "grammar",
    initialState: {
        allGrammars: [],
        grammars: [],
        unlockedGrammars: [],
        currentPage: 1,
        totalPages: 1,
        searchKeyword: "",
        isLoading: false,
        error: null,
    },
    reducers: {
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setSearchKeyword: (state, action) => {
            state.searchKeyword = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGrammars.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchGrammars.fulfilled, (state, action) => {
                state.isLoading = false;
                state.grammars = action.payload.grammars || [];
                state.totalPages = action.payload.totalPages || 1;
                state.allGrammars = action.payload.grammars || [];
            })
            .addCase(fetchGrammars.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(fetchGrammarDetail.fulfilled, (state, action) => {
                const userProg = action.payload?.userProgress || null;
                state.unlockedGrammars = Array.isArray(userProg?.unlockedGrammars)
                    ? userProg.unlockedGrammars.map((s) => s.toString())
                    : [];
            });
    },
});

export const { setCurrentPage, setSearchKeyword } = grammarSlice.actions;
export default grammarSlice.reducer;