import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { HomePage } from "./pages/HomePage";
import { DealsPage } from "./pages/DealsPage";
import { DealDetailPage } from "./pages/DealDetailPage";
import { SearchPage } from "./pages/SearchPage";
import { AlertsPage } from "./pages/AlertsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "deals", Component: DealsPage },
      { path: "deals/:id", Component: DealDetailPage },
      { path: "search", Component: SearchPage },
      { path: "alerts", Component: AlertsPage },
    ],
  },
]);
