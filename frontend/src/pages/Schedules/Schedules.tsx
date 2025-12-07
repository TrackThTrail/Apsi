import React, { useEffect, useState } from 'react';
import './Schedules.css';

export default function Schedules() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [availabilities, setAvailabilities] = useState<any[]>([]); // intern availabilities
    const [patientAvailabilities, setPatientAvailabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [viewMode, setViewMode] = useState<'day'|'week'|'month'>('week');
    const [selectedDate, setSelectedDate] = useState<Date>(()=>new Date());

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

    const fetchAvailabilities = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/availabilities/', { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setAvailabilities(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchPatientAvailabilities = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/patientavailabilities/', { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setPatientAvailabilities(await resp.json());
        }catch(e){ console.error(e); }
    };

    useEffect(() => { fetchSchedules(); fetchAvailabilities(); fetchPatientAvailabilities(); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSchedules({ q, start, end });
    };

    const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
    const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
    const prevWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); };
    const nextWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); };

    const schedulesByDate = schedules.reduce((acc: Record<string, any[]>, s) => { try{ const d = new Date(s.start_time).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(s); }catch(e){} return acc; }, {} as Record<string, any[]>);
    const availByDate = availabilities.reduce((acc: Record<string, any[]>, a) => { try{ const d = new Date(a.start_date).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(a); }catch(e){} return acc; }, {} as Record<string, any[]>);
    const patientAvailByDate = patientAvailabilities.reduce((acc: Record<string, any[]>, a) => { try{ const d = new Date(a.start_date).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(a); }catch(e){} return acc; }, {} as Record<string, any[]>);

    const getSchedulesForDate = (d: Date) => { const key = d.toISOString().slice(0,10); return (schedulesByDate[key] || []).slice().sort((a,b)=> new Date(a.start_time).getTime() - new Date(b.start_time).getTime()); };
    const getAvailForDate = (d: Date) => { const key = d.toISOString().slice(0,10); return (availByDate[key] || []).slice().sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime()); };
    const getPatientAvailForDate = (d: Date) => { const key = d.toISOString().slice(0,10); return (patientAvailByDate[key] || []).slice().sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime()); };

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
                    <div className="calendar-header controls">
                        <div style={{display:'flex',gap:8, alignItems:'center'}}>
                            <button className={"btn"} onClick={()=>{ setViewMode('day'); }}>Dia</button>
                            <button className={"btn"} onClick={()=>{ setViewMode('week'); }}>Semana</button>
                            <button className={"btn"} disabled>Mês</button>
                        </div>
                        <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            {viewMode === 'day' ? (
                                <>
                                    <button className="btn" onClick={prevDay}>&lt;</button>
                                    <div className="calendar-title">{selectedDate.toLocaleDateString()}</div>
                                    <button className="btn" onClick={nextDay}>&gt;</button>
                                </>
                            ) : (
                                <>
                                    <button className="btn" onClick={prevWeek}>&lt;</button>
                                    <div className="calendar-title">{(() => { const s = new Date(selectedDate); s.setDate(selectedDate.getDate()-selectedDate.getDay()); const e = new Date(s); e.setDate(s.getDate()+6); return `${s.toLocaleDateString()} — ${e.toLocaleDateString()}` })()}</div>
                                    <button className="btn" onClick={nextWeek}>&gt;</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="calendar-area">
                        {viewMode === 'day' ? (
                            <div className="day-view">
                                {( (()=>{
                                    const avs = getAvailForDate(selectedDate);
                                    const pavs = getPatientAvailForDate(selectedDate);
                                    const evs = getSchedulesForDate(selectedDate);
                                    if(avs.length===0 && pavs.length===0 && evs.length===0) return <div className="empty">Nenhum item neste dia.</div>;
                                    return (
                                        <div className="day-schedule-list">
                                            {avs.map(a=> <div key={`iav-${a.id}`} className="day-availability-item availability-intern"><div className="event-time">{new Date(a.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(a.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div><div className="event-main">Estagiário disponível</div></div>)}
                                            {pavs.map(a=> <div key={`pav-${a.id}`} className="day-availability-item availability-patient"><div className="event-time">{new Date(a.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(a.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div><div className="event-main">Paciente disponível</div></div>)}
                                            {evs.map(ev=> <div key={`ev-${ev.id}`} className="day-schedule-item"><div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(ev.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div><div className="event-main">{ev.patient} — {ev.intern}</div></div>)}
                                        </div>
                                    );
                                })() )}
                            </div>
                        ) : (
                            <div className="week-grid">
                                {(() => {
                                    const startOfWeek = new Date(selectedDate);
                                    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
                                    const days = Array.from({length:7}).map((_,i)=>{ const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate()+i); return d; });
                                    return days.map(d => (
                                        <div key={d.toISOString()} className="week-day">
                                            <div className="week-day-header">{d.toLocaleDateString(undefined,{ weekday: 'short', day:'numeric' })}</div>
                                            <div className="week-day-body">
                                                {getAvailForDate(d).map(a => (
                                                    <div key={`av-${a.id}`} className="calendar-availability availability-intern" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                        <div className="event-time">{new Date(a.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(a.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                        <div className="event-main">Estagiário disponível</div>
                                                    </div>
                                                ))}
                                                {getPatientAvailForDate(d).map(a => (
                                                    <div key={`pav-${a.id}`} className="calendar-availability availability-patient" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                        <div className="event-time">{new Date(a.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(a.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                        <div className="event-main">Paciente disponível</div>
                                                    </div>
                                                ))}
                                                {getSchedulesForDate(d).map(ev => (
                                                    <div key={ev.id} className="calendar-schedule" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                        <div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                        <div className="event-main">{ev.patient} — {ev.intern}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
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
