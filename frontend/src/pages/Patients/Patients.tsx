import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Patients.css';

export default function Patients() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
    const navigate = useNavigate();

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/patients/', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.ok) setPatients(await resp.json());
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchPatients(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/patients/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (resp.ok) { setForm({ first_name: '', last_name: '', email: '', phone: '' }); fetchPatients(); }
            else console.error('create failed', await resp.text());
        } catch (err) { console.error(err); }
    };

    return (
        <div className="patients-page">
            <div className="patients-grid">
                <div className="patients-list">
                    <h2>Pacientes</h2>
                    {loading && <div>Carregando...</div>}
                    {!loading && (
                        <div className="table-wrap">
                            <table className="patients-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nome</th>
                                        <th>Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.map(p => (
                                        <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                                            <td>{p.id}</td>
                                            <td>{p.first_name} {p.last_name}</td>
                                            <td>{p.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="patients-form">
                    <h2>Criar paciente</h2>
                    <form onSubmit={handleCreate}>
                        <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" />
                        <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" />
                        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" />
                        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefone" />
                        <button type="submit">Criar</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
