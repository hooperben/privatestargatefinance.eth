import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";
import { Account } from "./pages/Account";
import { Readings } from "./pages/Readings";
import Hero from "./components/Hero";
import { Navigation } from "./components/Navigation";

function App() {
  const location = useLocation();
  const showNavigation = location.pathname !== "/";

  return (
    <div className="min-h-screen">
      {showNavigation && <Navigation />}
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/account" element={<Account />} />
        <Route path="/readings" element={<Readings />} />
      </Routes>
    </div>
  );
}

export default App;
