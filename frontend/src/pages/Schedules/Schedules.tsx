import React, { useEffect, useState } from 'react';
import './Schedules.css';

export default function Schedules() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    const fetchSchedules = async (params?: { q?: string; start?: string; end?: string }) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const parts: string[] = [];
            if (params?.q) parts.push(`q=${encodeURIComponent(params.q)}`);
            if (params?.start) parts.push(`start=${encodeURIComponent(params.start)}`);
            if (params?.end) parts.push(`end=${encodeURIComponent(params.end)}`);
            const url = `http://localhost:8000/api/schedules/${parts.length ? '?' + parts.join('&') : ''}`;
            const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (resp.ok) setSchedules(await resp.json());
            else console.error(await resp.text());
        } catch (err) {
            console.error(err);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchSchedules(); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSchedules({ q, start, end });
    };

    return (
        <div className="schedules-page">
            <div className="schedules-grid">
                <div className="schedules-filter">
                    <h2>Agendamentos</h2>
                    <form onSubmit={handleSearch} className="schedules-search-form">
                        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar por paciente/estagiário/room" />
                        <div className="date-range">
                            <label>De</label>
                            <input type="date" value={start} onChange={e => setStart(e.target.value)} />
                            <label>Até</label>
                            <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
                        </div>
                        <button type="submit">Buscar</button>
                    </form>
                </div>

                <div className="schedules-list">
                    {loading && <div>Carregando...</div>}
                    {!loading && (
                        <div className="table-wrap">
                            <table className="schedules-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Paciente</th>
                                        <th>Estagiário</th>
                                        <th>Room</th>
                                        <th>Start</th>
                                        <th>End</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map(s => (
                                        <tr key={s.id}>
                                            <td>{s.id}</td>
                                            <td>{s.patient}</td>
                                            <td>{s.intern}</td>
                                            <td>{s.room_id ?? '-'}</td>
                                            <td>{new Date(s.start_time).toLocaleString()}</td>
                                            <td>{new Date(s.end_time).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
