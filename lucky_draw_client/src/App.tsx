import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Spinner } from "@phosphor-icons/react";

const Register = lazy(() => import("./pages/register/Register"));
const Ticket = lazy(() => import("./pages/Ticket"));
const Draw = lazy(() => import("./pages/Draw"));

const queryClient = new QueryClient();

function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-muted-foreground">
      <Spinner className="w-8 h-8 animate-spin text-primary mb-3" />
      <p className="text-xs uppercase tracking-widest font-semibold">Memuat...</p>
    </div>
  );
}

function DrawLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0C100B] text-[#F8F5EF]">
      <Spinner className="w-10 h-10 animate-spin text-[#C09A5B] mb-4" />
      <p className="font-heading tracking-widest text-sm uppercase text-[#C09A5B]/80">
        Memuat Panggung Undian...
      </p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background">
          {/* Decorative Top Border */}
          <div
            className="h-3 sm:h-4 w-full shrink-0 shadow-sm z-50 relative"
            style={{
              backgroundImage: "url('/cilugam.png')",
              backgroundRepeat: "repeat-x",
              backgroundSize: "contain",
            }}
          />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col relative overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/register" replace />} />
              <Route
                path="/register"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Register />
                  </Suspense>
                }
              />
              <Route
                path="/ticket/:id"
                element={
                  <Suspense fallback={<PageLoading />}>
                    <Ticket />
                  </Suspense>
                }
              />
              <Route
                path="/draw"
                element={
                  <Suspense fallback={<DrawLoading />}>
                    <Draw />
                  </Suspense>
                }
              />
            </Routes>
          </main>

          {/* Decorative Bottom Border */}
          <div
            className="h-3 sm:h-4 w-full shrink-0 shadow-sm z-50 relative"
            style={{
              backgroundImage: "url('/cilugam.png')",
              backgroundRepeat: "repeat-x",
              backgroundSize: "contain",
            }}
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
