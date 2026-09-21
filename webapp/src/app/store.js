import { configureStore } from "@reduxjs/toolkit";
import languageReducer from "@/store/language/languageSlice.js";
import grammarReducer from "@/store/grammar/grammarSlice.js";
import grammardetailReducer from "@/store/grammardetail/grammardetailSlice.js";

export const store = configureStore({
    reducer: {
        language: languageReducer,
        grammar: grammarReducer,
        grammardetail: grammardetailReducer,
    },
    devTools: import.meta.env.MODE !== "production",
});