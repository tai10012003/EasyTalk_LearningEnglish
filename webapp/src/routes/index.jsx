import Home from "../views/user/Home";
import About from "../views/user/About";
import Journey from "../views/user/Journey";
import Gate from "../views/user/Gate";
import Login from "../views/user/Login";
import Register from "../views/user/Register";
import Story from "../views/user/Story";
import NotFound from "../views/user/NotFound";

const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/journey",
    element: <Journey />,
  },
  {
    path: "/gate",
    element: <Gate />,
  },
  {
    path: "/story",
    element: <Story />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;