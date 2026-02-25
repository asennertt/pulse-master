import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

// IMPORT YOUR ACTUAL DASHBOARDS HERE
import PostDashboard from "./pages/PostDashboard"; 
import ValueDashboard from "./pages/ValueDashboard"; 

import "./index.css"; 

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />

      {/* ONLY Pulse Post users can enter here */}
      <Route path="/post-dashboard" element={
        <ProtectedRoute requiredModule="post">
          <PostDashboard />
        </ProtectedRoute>
      } />

      {/* ONLY Pulse Value users can enter here */}
      <Route path="/value-dashboard" element={
        <ProtectedRoute requiredModule="value">
          <ValueDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;