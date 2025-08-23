import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Menu from './components/user/Menu';
import Footer from './components/user/Footer';
import routes from "./routes";
import LoadingScreen from './components/user/LoadingScreen';

function Layout({ children }) {
  return (
    <>
      <Menu />
      {children}
      <Footer />
    </>
  );
}

function AppRoutes() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [location]);

  const authRoutes = ["/login", "/register", "/forgot-password"];
  if (loading) return <LoadingScreen />;
  return (
    <Routes>
      {routes.map((route, index) =>
        authRoutes.includes(route.path) ? (
          <Route key={index} path={route.path} element={route.element} />
        ) : (
          <Route
            key={index}
            path={route.path}
            element={<Layout>{route.element}</Layout>}
          />
        )
      )}
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