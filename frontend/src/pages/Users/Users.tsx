import React, { useEffect, useState } from 'react';
import './Users.css';
import { Link } from 'react-router-dom';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/estagiarios/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.ok) {
                setUsers(await resp.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/estagiarios/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                }),
            });
            if (resp.ok) {
                setForm({ first_name: '', last_name: '', email: '' });
                fetchUsers();
            } else {
                console.error('create failed', await resp.text());
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="users-page">
            <div className="users-grid">
                <div className="users-list">
                        <h2>Estagiários</h2>
                    {loading && <div>Carregando...</div>}
                    {!loading && (
                        <div className="table-wrap">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Email</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td><Link to={`/users/${u.id}`}>{u.first_name} {u.last_name ? u.last_name : ''}</Link></td>
                                            <td>{u.email}</td>
                                            <td>
                                                <button className="btn btn-danger" onClick={async ()=>{
                                                    if (!confirm(`Inativar estagiário ${u.first_name} ${u.last_name || ''}? Isso removerá disponibilidades e agendamentos futuros.`)) return;
                                                    try{
                                                        const token = localStorage.getItem('access_token');
                                                        const resp = await fetch(`http://localhost:8000/api/estagiarios/${u.id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                                        if (resp.ok || resp.status === 204) fetchUsers();
                                                        else console.error('failed to inactivate', await resp.text());
                                                    }catch(e){ console.error(e); }
                                                }}>Inativar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="users-form users-form-below">
                    <h2>Adicionar estagiário</h2>
                    <form onSubmit={handleCreate}>
                        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" />
                        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" />
                        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
                        <button type="submit">Criar</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
