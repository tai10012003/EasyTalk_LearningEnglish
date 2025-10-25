import React from "react";
import { useTranslation } from "react-i18next";
import Menu from "@/components/user/Menu";
import Footer from "@/components/user/Footer";
import { Outlet } from "react-router-dom";

function UserLayout() {
  const { t } = useTranslation();

  return (
    <div>
      <Menu />
      <main aria-label={t("mainContent")}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default UserLayout;