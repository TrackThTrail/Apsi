import React, { useEffect, useState } from 'react';
import './Users.css';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/users/', {
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
            const resp = await fetch('http://localhost:8000/api/users/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    password: form.password,
                }),
            });
            if (resp.ok) {
                setForm({ first_name: '', last_name: '', email: '', password: '' });
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
                    <h2>Users</h2>
                    {loading && <div>Carregando...</div>}
                    {!loading && (
                        <div className="table-wrap">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td>{u.first_name || u.username} {u.last_name ? u.last_name : ''}</td>
                                            <td>{u.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="users-form users-form-below">
                    <h2>Criar usuário</h2>
                    <form onSubmit={handleCreate}>
                        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" />
                        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" />
                        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
                        <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" />
                        <button type="submit">Criar</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
