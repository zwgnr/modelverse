import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { DarkModeProvider } from "./components/dark-mode-provider";
import { routeTree } from './routeTree.gen'

import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <DarkModeProvider>
      <RouterProvider router={router} />
    </DarkModeProvider>
  </ConvexAuthProvider>,
);
