import AdminRoute from "@/routes/AdminRoute";
import UserRoute from "@/routes/UserRoute";

const routes = [
  ...AdminRoute,
  ...UserRoute,
];

export default routes;