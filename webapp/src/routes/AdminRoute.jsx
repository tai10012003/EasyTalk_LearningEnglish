import Dashboard from "@/views/admin/Dashboard";
import NotFound from "@/views/admin/NotFound.jsx";
import PrivateRoute from "@/components/user/auth/PrivateRoute.jsx";

const AdminRoute = [
    {
        path: "dashboard",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Dashboard />
            </PrivateRoute>
        ),
    },
    {
        path: "*",
        element: <NotFound />,
    },
];


export default AdminRoute;