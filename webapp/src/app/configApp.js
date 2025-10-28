import i18n from "@/i18n";
import { setLanguage } from "@/store/language/languageSlice";

export const initializeAppConfig = (store) => {
    const savedLang = localStorage.getItem("language") || "vi";
    store.dispatch(setLanguage(savedLang));
    i18n.changeLanguage(savedLang);
    // 👉 Sau này có thể mở rộng:
    // - Load theme (light/dark)
    // - Load date format
    // - Load timezone
    // - Load user preferences
};