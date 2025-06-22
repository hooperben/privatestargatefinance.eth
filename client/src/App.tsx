import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Hero from "./components/Hero";
import { Navigation } from "./components/Navigation";
import { Account } from "./pages/Account";
import { Contacts } from "./pages/Contacts";
import { Readings } from "./pages/Readings";
import { TreeTest } from "./pages/TreeTest";

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
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/tree-test" element={<TreeTest />} />
      </Routes>
    </div>
  );
}

export default App;
