import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Header from "./components/Header/Header";
import Users from "./pages/Users/Users";
import Turmas from "./pages/Turmas/Turmas";

function App() {
    return (
        <BrowserRouter>
            <Header />
            <div className="app-content">
                <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/turmas" element={<Turmas />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
