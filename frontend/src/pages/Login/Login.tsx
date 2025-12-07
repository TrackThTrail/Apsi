import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // call backend JWT token endpoint
        (async () => {
            try {
                const resp = await fetch('http://localhost:8000/api/token/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (!resp.ok) {
                    const text = await resp.text();
                    console.error('Login failed', resp.status, text);
                    alert('Falha no login: verifique suas credenciais');
                    return;
                }

                const data = await resp.json();
                // store tokens (access + refresh)
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);

                // notify other components in this tab that auth changed
                window.dispatchEvent(new Event('authChange'));

                // navigate to schedules (default page)
                // use a full navigation to avoid possible routing/refresh races
                try { window.location.href = '/schedules'; } catch(e) { navigate('/schedules', { replace: true }); }
            } catch (err) {
                console.error('Login error', err);
                alert('Erro ao conectar com o servidor');
            }
        })();
    };

    return (
        <div className="login-container">

            {/* LOGO */}
            <img src="/logo.png" alt="Logo A-Psi" className="login-logo" />

            <h2 className="login-title">A-Psi</h2>
            <p className="hero-subtitle">
                Organize salas, turmas, alunos e professores com facilidade.
            </p>

            <form onSubmit={handleSubmit} className="login-form">

                <div className="input-group">
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Senha</label>
                    <input
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button type="submit" className="login-button">
                    Entrar
                </button>

            </form>
        </div>
    );
}
