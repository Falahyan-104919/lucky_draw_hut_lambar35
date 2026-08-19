import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Register from "./pages/Register";
import Ticket from "./pages/Ticket";
import Draw from "./pages/Draw";

const queryClient = new QueryClient();

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
              backgroundSize: "contain"
            }} 
          />
          
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col relative overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/register" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/ticket/:id" element={<Ticket />} />
              <Route path="/draw" element={<Draw />} />
            </Routes>
          </main>

          {/* Decorative Bottom Border */}
          <div 
            className="h-3 sm:h-4 w-full shrink-0 shadow-sm z-50 relative" 
            style={{ 
              backgroundImage: "url('/cilugam.png')", 
              backgroundRepeat: "repeat-x",
              backgroundSize: "contain"
            }} 
          />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
