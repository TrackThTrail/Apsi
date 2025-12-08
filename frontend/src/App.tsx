import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from 'react';
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Header from "./components/Header/Header";
import Users from "./pages/Users/Users";
import Turmas from "./pages/Turmas/Turmas";
import Patients from "./pages/Patients/Patients";
import PatientDetail from "./pages/PatientDetail/PatientDetail";
import Schedules from "./pages/Schedules/Schedules";
import UserDetail from "./pages/UserDetail/UserDetail";

function App() {
    useEffect(()=>{
        // API base (use VITE_API_URL in hosting environment)
        const API_BASE = (import.meta && import.meta.env && (import.meta.env.VITE_API_URL as string)) || 'http://localhost:8000';
        // wrap global fetch to transparently refresh tokens on 401 and retry
        const originalFetch = window.fetch.bind(window);
        let refreshing = false;
        let refreshPromise: Promise<string | null> | null = null;

                const doRefresh = async (): Promise<string | null> => {
            const refresh = localStorage.getItem('refresh_token');
            if (!refresh) return null;
            try {
                // call backend refresh endpoint (explicit host)
                const resp = await originalFetch(`${API_BASE}/api/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh })
                });
                if (!resp.ok) return null;
                const data = await resp.json();
                if (data.access) {
                    localStorage.setItem('access_token', data.access);
                    window.dispatchEvent(new Event('authChange'));
                    return data.access as string;
                }
                return null;
            } catch (e) {
                return null;
            }
        };

        (window as any).__logoutInProgress = false;

        const wrapperFetch = async (input: RequestInfo, init?: RequestInit) => {
            // if logout already in progress, force redirect and short-circuit
            if ((window as any).__logoutInProgress) {
                try { window.location.href = '/login'; } catch(e){}
                return new Response(null, { status: 401, statusText: 'Unauthorized' });
            }

            // don't attempt refresh for token endpoints themselves
            const urlStr = typeof input === 'string' ? input : (input as Request).url;
            if (urlStr.includes('/api/token/')) {
                return originalFetch(input, init);
            }

            // helper to attach Authorization header
            const attachAuth = (inputArg: RequestInfo, initArg: RequestInit | undefined, token: string | null) => {
                const newInit: RequestInit = Object.assign({}, initArg || {});
                const headers = new Headers(newInit.headers || {});
                if (token) headers.set('Authorization', `Bearer ${token}`);
                newInit.headers = headers;
                return { inputArg, newInit };
            };

            // perform request with current access token
            const access = localStorage.getItem('access_token');
            const { inputArg, newInit } = attachAuth(input, init, access);
            let res = await originalFetch(inputArg, newInit);
            if (res.status !== 401) return res;

            // got 401 — try refresh
            if (!refreshing) {
                refreshing = true;
                refreshPromise = doRefresh();
            }

            const newAccess = await refreshPromise;
            refreshing = false;
            refreshPromise = null;

            if (!newAccess) {
                // refresh failed — mark logout in progress, clear and redirect to login
                (window as any).__logoutInProgress = true;
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.dispatchEvent(new Event('authChange'));
                try { window.location.href = '/login'; } catch(e){}
                return res; // still return original 401
            }

            // retry original request with new access token
            const { inputArg: input2, newInit: init2 } = attachAuth(input, init, newAccess as string);
            return originalFetch(input2, init2);
        };

        (window as any).fetch = wrapperFetch;
        return () => { (window as any).fetch = originalFetch; };
    }, []);
    const isAuthenticated = () => !!localStorage.getItem('access_token');

    return (
        <BrowserRouter>
            <Header />
            <div className="app-content">
                <Routes>
                        <Route path="/" element={isAuthenticated() ? <Schedules /> : <Navigate to="/login" replace />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<Users />} />
                        <Route path="/turmas" element={<Turmas />} />
                        <Route path="/patients" element={<Patients />} />
                        <Route path="/patients/:id" element={<PatientDetail />} />
                        <Route path="/users/:id" element={<UserDetail />} />
                        <Route path="/schedules" element={isAuthenticated() ? <Schedules /> : <Navigate to="/login" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
