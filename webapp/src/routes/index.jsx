import Home from "../views/user/Home";
import About from "../views/user/About";
import Journey from "../views/user/Journey";
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
    path: "*",
    element: <NotFound />,
  },
];

export default routes;