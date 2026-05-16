import { createAsyncThunk } from "@reduxjs/toolkit";
import { GrammarService } from "@/services/GrammarService.jsx";

export const fetchGrammars = createAsyncThunk(
    "grammar/fetchGrammars",
    async ({ page = 1, limit = 12, search = "" }, { rejectWithValue }) => {
        try {
            const data = await GrammarService.fetchGrammars(page, limit, { search });
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

export const fetchGrammarDetail = createAsyncThunk(
    "grammar/fetchGrammarDetail",
    async (id, { rejectWithValue }) => {
        try {
            const data = await GrammarService.getGrammarDetail(id);
            return data;
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);