import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import { Toaster } from "@/components/ui/toaster";
import "./index.css"; 

const App = () => (
  <>
    <BrowserRouter>
      <Routes>
        {/* 1. THIS MUST BE FIRST: The Landing Page */}
        <Route path="/" element={<Index />} />
        
        {/* 2. The Auth Page */}
        <Route path="/auth" element={<Auth />} />

        {/* Support & Privacy Pages */}
        <Route path="/support" element={<Support />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* 3. Catch-all for 404s */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </>
);

export default App;
