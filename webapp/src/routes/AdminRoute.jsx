import Dashboard from "@/views/admin/Dashboard";
import Grammar from "@/views/admin/Grammar";
import AddGrammar from "@/views/admin/AddGrammar";
import UpdateGrammar from "@/views/admin/UpdateGrammar"
import Pronunciation from "@/views/admin/Pronunciation";
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
        path: "grammar",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Grammar />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddGrammar />
            </PrivateRoute>
        ),
    },
    {
        path: "grammar/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateGrammar />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Pronunciation />
            </PrivateRoute>
        ),
    },
    {
        path: "*",
        element: <NotFound />,
    },
];


export default AdminRoute;