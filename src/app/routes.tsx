import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./pages/Root";

function PageLoader() {
  return (
    <div className="min-h-screen bg-stone-50 pt-32 text-center text-stone-500">
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
        path: "deal/:id",
        lazy: async () => ({
          Component: (await import("./pages/DealDetailPage")).DealDetailPage,
        }),
      },
      {
        path: "historical-deals",
        Component: () => <Navigate to="/deals" replace />,
      },
      {
        path: "explore",
        Component: () => <Navigate to="/deals" replace />,
      },
      {
        path: "search",
        lazy: async () => ({ Component: (await import("./pages/SearchPage")).SearchPage }),
      },
      {
        path: "alerts",
        Component: () => <Navigate to="/watch" replace />,
      },
      {
        path: "watch",
        lazy: async () => ({ Component: (await import("./pages/WatchPage")).WatchPage }),
      },
      {
        path: "saved",
        lazy: async () => ({ Component: (await import("./pages/SavedDealsPage")).SavedDealsPage }),
      },
      {
        path: "auth",
        lazy: async () => ({ Component: (await import("./pages/AuthPage")).AuthPage }),
      },
      {
        path: "advisor",
        Component: () => <Navigate to="/search" replace />,
      },
      {
        path: "privacy",
        lazy: async () => ({ Component: (await import("./pages/PrivacyPage")).PrivacyPage }),
      },
      {
        path: "terms",
        lazy: async () => ({ Component: (await import("./pages/TermsPage")).TermsPage }),
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
