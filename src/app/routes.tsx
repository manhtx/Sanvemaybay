import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 pt-32 text-center text-slate-400">
      Đang tải…
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    HydrateFallback: PageLoader,
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("./pages/HomePage")).HomePage }),
      },
      {
        path: "deals",
        lazy: async () => ({ Component: (await import("./pages/DealsPage")).DealsPage }),
      },
      {
        path: "deals/:id",
        lazy: async () => ({
          Component: (await import("./pages/DealDetailPage")).DealDetailPage,
        }),
      },
      {
        path: "explore",
        lazy: async () => ({ Component: (await import("./pages/ExplorePage")).ExplorePage }),
      },
      {
        path: "search",
        lazy: async () => ({ Component: (await import("./pages/SearchPage")).SearchPage }),
      },
      {
        path: "alerts",
        lazy: async () => ({ Component: (await import("./pages/AlertsPage")).AlertsPage }),
      },
      {
        path: "alerts/confirm",
        lazy: async () => {
          const { AlertActionPage } = await import("./pages/AlertActionPage");
          return { Component: () => <AlertActionPage action="confirm" /> };
        },
      },
      {
        path: "alerts/unsubscribe",
        lazy: async () => {
          const { AlertActionPage } = await import("./pages/AlertActionPage");
          return { Component: () => <AlertActionPage action="unsubscribe" /> };
        },
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("./pages/NotFoundPage")).NotFoundPage }),
      },
    ],
  },
]);
