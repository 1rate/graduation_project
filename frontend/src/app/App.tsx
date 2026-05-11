import "@/app/index.css";
import { Providers } from "@/app/providers";
import { router } from "@/app/router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

async function enableMocking() {
  const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

  if (useMocks) {
    const { worker } = await import("@/shared/mocks/browser");
    return worker.start({
      onUnhandledRequest: (req, print) => {
        const url = new URL(req.url);
        if (url.hostname === "localhost" && (url.port === "8080" || url.port === "8081")) {
          print.warning();
        }
      },
    });
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

enableMocking().then(() => {
  createRoot(root).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
});
