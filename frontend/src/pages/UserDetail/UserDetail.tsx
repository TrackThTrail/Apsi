import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../PatientDetail/PatientDetail.css';

export default function UserDetail(){
    const API_BASE = (import.meta && import.meta.env && (import.meta.env.VITE_API_URL as string)) || 'http://localhost:8000';
    const { id } = useParams();
    const [intern, setIntern] = useState<any>(null);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [availabilities, setAvailabilities] = useState<any[]>([]);
    const [form, setForm] = useState({ av_date: '', av_start_time: '', av_end_time: '' });
    const [showPanel, setShowPanel] = useState(false);
    const [viewMode, setViewMode] = useState<'day'|'week'|'month'>('week');
    const [selectedDate, setSelectedDate] = useState<Date>(()=>new Date());

    const fetchIntern = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/estagiarios/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setIntern(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchSchedules = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/schedules/?intern=${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setSchedules(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchAvailabilities = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/availabilities/?intern=${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setAvailabilities(await resp.json());
        }catch(e){ console.error(e); }
    };

    useEffect(()=>{ fetchIntern(); fetchSchedules(); fetchAvailabilities(); }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreateAvailability = async (e: React.FormEvent) => {
        e.preventDefault();
        try{
            const token = localStorage.getItem('access_token');
            // build ISO datetimes from selected day + time
            const startIso = new Date(`${form.av_date}T${form.av_start_time}`).toISOString();
            const endIso = new Date(`${form.av_date}T${form.av_end_time}`).toISOString();
            const resp = await fetch(`${API_BASE}/api/availabilities/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ intern: id, start_date: startIso, end_date: endIso })
            });
            if(resp.ok){ setForm({ av_date: '', av_start_time: '', av_end_time: '' }); fetchAvailabilities(); setShowPanel(false); }
            else console.error('create failed', await resp.text());
        }catch(err){ console.error(err); }
    };

    const schedulesByDate = schedules.reduce((acc: Record<string, any[]>, s) => { try{ const d = new Date(s.start_time).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(s); }catch(e){} return acc; }, {} as Record<string, any[]>);

    const availByDate = availabilities.reduce((acc: Record<string, any[]>, a) => {
        try{
            // Availability now stores datetimes; group by date portion
            const start = new Date(a.start_date).toISOString().slice(0,10);
            if (!acc[start]) acc[start] = [];
            acc[start].push(a);
        }catch(e){}
        return acc;
    }, {} as Record<string, any[]>);

    const getSchedulesForDate = (d: Date) => {
        const key = d.toISOString().slice(0,10);
        const list = (schedulesByDate[key] || []).slice();
        list.sort((a,b)=> new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        return list;
    };

    const getAvailForDate = (d: Date) => {
        const key = d.toISOString().slice(0,10);
        return (availByDate[key] || []).slice();
    };

    const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
    const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
    const prevWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); };
    const nextWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); };

    return (
        <div className="patient-page">
            <div className="patient-grid">
                <div className="patient-info">
                    <div className="patient-header">
                        <h2>Estagiário</h2>
                        <div className="patient-actions">
                            <button className="btn" onClick={()=>setShowPanel(true)}>Adicionar disponibilidade</button>
                        </div>
                    </div>

                    {intern ? (
                        <div className="patient-summary">
                            <p><strong>Nome:</strong> {intern.first_name} {intern.last_name}</p>
                            <p><strong>Email:</strong> {intern.email}</p>
                        </div>
                    ) : <div>Carregando...</div>}

                    <div className="calendar">
                        <div className="calendar-header">
                            <div style={{display:'flex',gap:8}}>
                                <button className={"btn" + (viewMode==='day' ? ' active' : '')} onClick={()=>setViewMode('day')}>Dia</button>
                                <button className={"btn" + (viewMode==='week' ? ' active' : '')} onClick={()=>setViewMode('week')}>Semana</button>
                                <button className={"btn"} disabled>Mês</button>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                                {viewMode==='day' ? (
                                    <>
                                        <button className="btn" onClick={prevDay}>&lt;</button>
                                        <div className="calendar-title">{selectedDate.toLocaleDateString()}</div>
                                        <button className="btn" onClick={nextDay}>&gt;</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn" onClick={prevWeek}>&lt;</button>
                                        <div className="calendar-title">{selectedDate.toLocaleDateString()}</div>
                                        <button className="btn" onClick={nextWeek}>&gt;</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {viewMode==='day' ? (
                            <div className="day-view">
                                <div className="day-schedule-list">
                                    {(() => {
                                        const avs = getAvailForDate(selectedDate);
                                        const evs = getSchedulesForDate(selectedDate);
                                        return (
                                            <>
                                                {avs.map(a => (
                                                    <div key={`av-${a.id}`} className="day-availability-item">
                                                        <div className="event-time">{new Date(a.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(a.end_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                        <div className="event-main">Disponível</div>
                                                    </div>
                                                ))}
                                                {evs.length === 0 && avs.length === 0 ? (
                                                    <div className="empty">Nenhum agendamento neste dia.</div>
                                                ) : (
                                                    evs.map(ev => (
                                                        <div key={ev.id} className="day-schedule-item">
                                                            <div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(ev.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                            <div className="event-main">{ev.patient} — Sala {ev.room_id ?? '-'}</div>
                                                        </div>
                                                    ))
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
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
                                                    <div key={`av-${a.id}`} className="calendar-availability" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                        <div className="event-time">{new Date(a.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(a.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                        <div className="event-main">Disponível</div>
                                                    </div>
                                                ))}
                                                {getSchedulesForDate(d).map(ev => (
                                                    <div key={ev.id} className="calendar-schedule" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                        <div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                        <div className="event-main">{ev.patient} — Sala {ev.room_id ?? '-'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPanel && (
                <div className="fullscreen-panel">
                    <div className="panel-inner">
                        <button className="panel-close" onClick={()=>setShowPanel(false)}>Fechar ×</button>
                        <h2>Adicionar disponibilidade do estagiário</h2>
                        <form onSubmit={handleCreateAvailability} className="panel-form">
                            <label>Dia</label>
                            <input name="av_date" type="date" value={form.av_date} onChange={handleChange} required />
                            <label>Hora início</label>
                            <input name="av_start_time" type="time" value={form.av_start_time} onChange={handleChange} required />
                            <label>Hora fim</label>
                            <input name="av_end_time" type="time" value={form.av_end_time} onChange={handleChange} required />
                            <button type="submit" className="btn">Salvar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
