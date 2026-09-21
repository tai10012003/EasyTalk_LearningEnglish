import { createAsyncThunk } from "@reduxjs/toolkit";
import { GrammarService } from "@/services/GrammarService.jsx";

export const fetchGrammarDetail = createAsyncThunk(
    "grammardetail/fetchGrammarDetail",
    async (slug, { rejectWithValue }) => {
        try {
            const res = await GrammarService.getGrammarBySlug(slug);
            if (!res?.grammar) throw new Error("Không tìm thấy bài học");
            return res.grammar;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const completeGrammar = createAsyncThunk(
    "grammardetail/completeGrammar",
    async (grammarId, { rejectWithValue }) => {
        try {
            await GrammarService.completeGrammar(grammarId);
            return true;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);