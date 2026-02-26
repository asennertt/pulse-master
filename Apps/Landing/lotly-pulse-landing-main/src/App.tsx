import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import "./index.css"; 

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* The main Enrollment / Brand page */}
      <Route path="/" element={<Index />} />
      
      {/* The shared authentication portal */}
      <Route path="/auth" element={<Auth />} />

      {/* Note: Post and Value dashboards are hosted on separate Railway services.
          Cross-app navigation is handled via window.location.href redirects 
          once the user's role/plan is verified in the Auth portal.
      */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;