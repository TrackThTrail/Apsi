import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

export default function Header() {
    
    const [isAuth, setIsAuth] = useState<boolean>(Boolean(localStorage.getItem('access_token')));
    const navigate = useNavigate();

    useEffect(() => {
        const onAuthChange = () => setIsAuth(Boolean(localStorage.getItem('access_token')));
        window.addEventListener('storage', onAuthChange);
        window.addEventListener('authChange', onAuthChange as EventListener);
        return () => {
            window.removeEventListener('storage', onAuthChange);
            window.removeEventListener('authChange', onAuthChange as EventListener);
        };
    }, []);

    const handleEquipe = () => {
        navigate('/users');
    };

    const handleTurmas = () => {
        navigate('/turmas');
    };

    // no modal: navigation to pages instead

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // notify other listeners in this tab (storage doesn't fire in same tab)
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
    };

    // If not authenticated, don't render the header
    if (!isAuth) return null;

    return (
        <header className="app-header">
            <div className="header-inner">
                <div className="header-left">
                    <div className="brand">A-Psi</div>
                </div>

                <div className="header-right">
                    <button className="btn" onClick={handleEquipe}>
                        Equipe
                    </button>
                    <button className="btn" onClick={handleTurmas}>
                        Turmas
                    </button>
                    <button className="btn btn-logout" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
