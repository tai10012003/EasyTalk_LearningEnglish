import { configureStore } from "@reduxjs/toolkit";
import languageReducer from "@/store/language/languageSlice.js";

export const store = configureStore({
    reducer: {
        language: languageReducer
    },
    devTools: import.meta.env.MODE !== "production",
});