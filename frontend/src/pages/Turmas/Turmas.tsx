import React, { useEffect, useState } from 'react';
import './Turmas.css';

export default function Turmas() {
    const API_BASE = (import.meta && import.meta.env && (import.meta.env.VITE_API_URL as string)) || 'http://localhost:8000';
    const [turmas, setTurmas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' });

    const fetchTurmas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/turmas/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.ok) {
                setTurmas(await resp.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTurmas(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/turmas/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description,
                    start_date: form.start_date || null,
                    end_date: form.end_date || null,
                }),
            });
            if (resp.ok) {
                setForm({ name: '', description: '', start_date: '', end_date: '' });
                fetchTurmas();
            } else {
                console.error('create failed', await resp.text());
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/turmas/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (resp.ok) fetchTurmas(); else console.error(await resp.text());
        } catch (err) { console.error(err); }
    };

    return (
        <div className="turmas-page">
            <div className="turmas-grid">
                <div className="turmas-list">
                    <h2>Turmas</h2>
                    {loading && <div>Carregando...</div>}
                    {!loading && (
                        <div className="table-wrap">
                            <table className="turmas-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Descrição</th>
                                        <th>Período</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {turmas.map(t => (
                                        <tr key={t.id}>
                                            <td>{t.id}</td>
                                            <td>{t.name}</td>
                                            <td>{t.description}</td>
                                            <td>{t.start_date || '-'} — {t.end_date || '-'}</td>
                                            <td><button onClick={() => handleDelete(t.id)} className="btn-del">Excluir</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="turmas-form">
                    <h2>Criar Turma</h2>
                    <form onSubmit={handleCreate}>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Nome" />
                        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descrição" />
                        <input name="start_date" type="date" value={form.start_date} onChange={handleChange} />
                        <input name="end_date" type="date" value={form.end_date} onChange={handleChange} />
                        <button type="submit">Criar</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
