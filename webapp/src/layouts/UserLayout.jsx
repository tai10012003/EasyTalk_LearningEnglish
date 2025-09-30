import React from "react";
import Menu from "@/components/user/Menu";
import Footer from "@/components/user/Footer";
import { Outlet } from "react-router-dom";

function UserLayout() {
  return (
    <div>
        <Menu />
        <main>
            <Outlet />
        </main>
        <Footer />
    </div>
  );
}

export default UserLayout;