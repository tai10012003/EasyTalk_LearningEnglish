import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserRoute from "@/routes/UserRoute";
import AdminRoute from "@/routes/AdminRoute";
import UserLayout from "@/layouts/UserLayout.jsx";
import AdminLayout from "@/layouts/AdminLayout.jsx";
import Login from "@/views/Login.jsx";
import Register from "@/views/Register.jsx";

function AppRoutes() {
  const authRoutes = [
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> }
  ];

  return (
    <Routes>
      {authRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="/" element={<UserLayout />}>
        {UserRoute.map((route, index) => (
          <Route
            key={index}
            path={route.path}
            element={route.element}
            index={route.index || false}
          />
        ))}
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        {AdminRoute.map((route, index) => (
          <Route
            key={index}
            path={route.path.replace("/admin", "")}
            element={route.element}
            index={route.index || false}
          />
        ))}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;