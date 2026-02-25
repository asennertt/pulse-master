import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import "./index.css"; 

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* The main Lobby/Enrollment page */}
      <Route path="/" element={<Index />} />
      
      {/* The unified login page */}
      <Route path="/auth" element={<Auth />} />

      {/* Note: Post and Value dashboards are separate Railway apps.
        Users will be redirected to their respective URLs via 
        window.location.href after login/signup logic.
      */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;