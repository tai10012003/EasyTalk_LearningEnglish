import React from "react";
import { useTranslation } from "react-i18next";
import Menu from "@/components/user/Menu";
import Footer from "@/components/user/Footer";
import CoachCompanion from "@/components/user/coach/CoachCompanion";
import { Outlet } from "react-router-dom";

function UserLayout() {
  const { t } = useTranslation();

  return (
    <div>
      <Menu />
      <main aria-label={t("mainContent")}>
        <Outlet />
      </main>
      <CoachCompanion />
      <Footer />
    </div>
  );
}

export default UserLayout;
