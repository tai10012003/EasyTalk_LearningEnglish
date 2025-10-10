import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import UserRoute from "@/routes/UserRoute";
import AdminRoute from "@/routes/AdminRoute";
// import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import UserLayout from "@/layouts/UserLayout.jsx";
import AdminLayout from "@/layouts/AdminLayout.jsx";
import Login from "@/views/Login.jsx";
import Register from "@/views/Register.jsx";

function AppRoutes() {
  // const location = useLocation();
  // const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   setLoading(true);
  //   const timer = setTimeout(() => {
  //     setLoading(false);
  //   }, 800);
  //   return () => clearTimeout(timer);
  // }, [location]);

  const authRoutes = [
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> }
  ];
  // if (loading) return <LoadingScreen />;
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