import Dashboard from "@/views/admin/Dashboard";
import Grammar from "@/views/admin/Grammar";
import AddGrammar from "@/views/admin/AddGrammar";
import UpdateGrammar from "@/views/admin/UpdateGrammar"
import Pronunciation from "@/views/admin/Pronunciation";
import AddPronunciation from "@/views/admin/AddPronunciation";
import UpdatePronunciation from "@/views/admin/UpdatePronunciation"
import Story from "@/views/admin/Story";
import AddStory from "@/views/admin/AddStoryPage";
import UpdateStory from "@/views/admin/UpdateStoryPage"
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
        path: "pronunciation/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddPronunciation />
            </PrivateRoute>
        ),
    },
    {
        path: "pronunciation/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdatePronunciation />
            </PrivateRoute>
        ),
    },
    {
        path: "story",
        element: (
            <PrivateRoute roles={["admin"]}>
                <Story />
            </PrivateRoute>
        ),
    },
    {
        path: "story/add",
        element: (
            <PrivateRoute roles={["admin"]}>
                <AddStory />
            </PrivateRoute>
        ),
    },
    {
        path: "story/update/:id",
        element: (
            <PrivateRoute roles={["admin"]}>
                <UpdateStory />
            </PrivateRoute>
        ),
    },
    {
        path: "*",
        element: <NotFound />,
    },
];


export default AdminRoute;