import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { CommunityFeed } from "./pages/CommunityFeed";
import { AIChat } from "./pages/AIChat";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: CommunityFeed },
      { path: "chat", Component: AIChat },
    ],
  },
]);
