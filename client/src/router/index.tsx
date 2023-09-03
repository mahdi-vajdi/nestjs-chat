import { createBrowserRouter } from "react-router-dom";

//  components
import App from "../App";
import Login from "../pages/login";
import Signup from "pages/signup";
import Home from "pages/chats";

const router = createBrowserRouter([
  {
    path: "login",
    element: <Login />,
  },
  {
    path: "signup",
    element: <Signup />,
  },
  {
    path: "/chats",
    element: <Home />,
  },
]);

export default router;
