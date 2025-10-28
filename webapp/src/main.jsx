import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import "@/admin.css";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { initializeAppConfig } from "@/app/configApp";

initializeAppConfig(store);
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);