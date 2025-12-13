import "@/styles/global.css";

import { Toaster } from "@/shared/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/store/config/query-client";
import { useCurrentUser } from "@/store/server/auth-queries";
import { routes } from "@/routers/routes";


function AuthInitializer({ children }: { children: React.ReactNode }) {
  useCurrentUser();
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthInitializer>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {routes.map((route, index) => (
              <Route 
                key={route.path || `route-${index}`} 
                path={route.path}
                element={route.element}
              />
            ))}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthInitializer>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

