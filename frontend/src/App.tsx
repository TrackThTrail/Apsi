import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Header from "./components/Header/Header";
import Users from "./pages/Users/Users";
import Turmas from "./pages/Turmas/Turmas";
import Patients from "./pages/Patients/Patients";
import PatientDetail from "./pages/PatientDetail/PatientDetail";
import Schedules from "./pages/Schedules/Schedules";

function App() {
    return (
        <BrowserRouter>
            <Header />
            <div className="app-content">
                <Routes>
                        <Route path="/" element={<Schedules />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/turmas" element={<Turmas />} />
                        <Route path="/patients" element={<Patients />} />
                        <Route path="/patients/:id" element={<PatientDetail />} />
                        <Route path="/schedules" element={<Schedules />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
