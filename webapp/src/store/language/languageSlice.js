import { createSlice } from "@reduxjs/toolkit";
import i18n from "@/i18n";

const initialLanguage = localStorage.getItem("language") || "vi";

const languageSlice = createSlice({
    name: "language",
    initialState: {
        current: initialLanguage,
    },
    reducers: {
        setLanguage: (state, action) => {
            const lang = action.payload;
            state.current = lang;
            localStorage.setItem("language", lang);
            i18n.changeLanguage(lang);
        },
        resetLanguage: (state) => {
            state.current = "vi";
            localStorage.setItem("language", "vi");
            i18n.changeLanguage("vi");
        },
    },
});

export const { setLanguage, resetLanguage } = languageSlice.actions;
export default languageSlice.reducer;