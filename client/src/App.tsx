import { Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import Hero from "./components/Hero";
import { Navigation } from "./components/Navigation";
import { Account } from "./pages/Account";
import { Contacts } from "./pages/Contacts";
import { Notes } from "./pages/Notes";
import { Readings } from "./pages/Readings";
import { TreeTest } from "./pages/TreeTest";
import { Proving } from "./pages/Proving";

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
        <Route path="/notes" element={<Notes />} />
        <Route path="/tree-test" element={<TreeTest />} />
        <Route path="/proving" element={<Proving />} />
      </Routes>
    </div>
  );
}

export default App;
