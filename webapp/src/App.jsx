import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Menu from './components/user/Menu';
import Footer from './components/user/Footer';
import routes from "./routes";

function App() {
  return (
    <Router>
      <Menu />
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;