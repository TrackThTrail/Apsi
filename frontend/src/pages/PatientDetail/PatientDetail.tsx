import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './PatientDetail.css';

export default function PatientDetail(){
    const { id } = useParams();
    const [patient, setPatient] = useState<any>(null);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [interns, setInterns] = useState<any[]>([]);
    const [internAvailabilities, setInternAvailabilities] = useState<any[]>([]);
    const [form, setForm] = useState({ intern: '', room_id: '', start_time: '', end_time: '', av_date: '', av_start_time: '', av_end_time: '' });
    const [showAvailabilityPanel, setShowAvailabilityPanel] = useState(false);
    const [showSchedulePanel, setShowSchedulePanel] = useState(false);
    const [activeTab, setActiveTab] = useState<'disponibilidades'|'agendamentos'>('disponibilidades');
    const [bookingMode, setBookingMode] = useState(false);
    const [patientAvailabilities, setPatientAvailabilities] = useState<any[]>([]);
    const [monthStart, setMonthStart] = useState(() => { const d = new Date(); d.setDate(1); return d; });
    const [viewMode, setViewMode] = useState<'day'|'week'|'month'>('week');
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

    const fetchPatient = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`http://localhost:8000/api/patients/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setPatient(await resp.json());
        }catch(err){ console.error(err); }
    };

    const fetchSchedules = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`http://localhost:8000/api/schedules/?patient=${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setSchedules(await resp.json());
        }catch(err){ console.error(err); }
    };

    const fetchPatientAvailabilities = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`http://localhost:8000/api/patientavailabilities/?patient=${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setPatientAvailabilities(await resp.json());
        }catch(err){ console.error(err); }
    };

    const fetchInterns = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/estagiarios/', { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setInterns(await resp.json());
        }catch(err){ console.error(err); }
    };

    const fetchInternAvailabilities = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/availabilities/', { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setInternAvailabilities(await resp.json());
        }catch(err){ console.error(err); }
    };

    useEffect(()=>{ fetchPatient(); fetchSchedules(); fetchInterns(); fetchPatientAvailabilities(); fetchInternAvailabilities(); }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

    // create schedule (booking) for this patient
    const handleCreateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        try{
            const token = localStorage.getItem('access_token');
            const startIso = new Date(form.start_time).toISOString();
            const endIso = new Date(form.end_time).toISOString();
            const resp = await fetch('http://localhost:8000/api/schedules/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ intern: form.intern, patient: id, room_id: form.room_id || null, start_time: startIso, end_time: endIso })
            });
            if(resp.ok){ setForm({ intern: '', room_id: '', start_time: '', end_time: '', av_date: '', av_start_time: '', av_end_time: '' }); fetchSchedules(); setShowSchedulePanel(false); }
            else console.error('create failed', await resp.text());
        }catch(err){ console.error(err); }
    };

    // create patient availability (date range)
    const handleCreateAvailability = async (e: React.FormEvent) => {
        e.preventDefault();
        try{
            const token = localStorage.getItem('access_token');
            // build ISO datetimes from selected day + time inputs
            const startIso = new Date(`${form.av_date}T${form.av_start_time}`).toISOString();
            const endIso = new Date(`${form.av_date}T${form.av_end_time}`).toISOString();
            const resp = await fetch('http://localhost:8000/api/patientavailabilities/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ patient: id, start_date: startIso, end_date: endIso })
            });
            if(resp.ok){ setForm({ intern: '', room_id: '', start_time: '', end_time: '', av_date: '', av_start_time: '', av_end_time: '' }); fetchPatientAvailabilities(); setShowAvailabilityPanel(false); }
            else console.error('create failed', await resp.text());
        }catch(err){ console.error(err); }
    };

    // (schedule delete handled from Schedules list; not used here)

    const handleDeletePatientAvailability = async (idToDelete: number) => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`http://localhost:8000/api/patientavailabilities/${idToDelete}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) fetchPatientAvailabilities(); else console.error(await resp.text());
        }catch(err){ console.error(err); }
    };

    // calendar helpers
    const prevMonth = () => { const d = new Date(monthStart); d.setMonth(d.getMonth() - 1); setMonthStart(d); };
    const nextMonth = () => { const d = new Date(monthStart); d.setMonth(d.getMonth() + 1); setMonthStart(d); };
    const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
    const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
    const prevWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); };
    const nextWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); };

    const buildCalendar = () => {
        const start = new Date(monthStart);
        const year = start.getFullYear();
        const month = start.getMonth();
        const firstDay = new Date(year, month, 1);
        const startWeekDay = firstDay.getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const weeks: Array<Array<Date | null>> = [];
        let week: Array<Date | null> = new Array(7).fill(null);
        let dayCounter = 1;
        for (let i = startWeekDay; i < 7; i++) { week[i] = new Date(year, month, dayCounter++); }
        weeks.push(week);
        while (dayCounter <= daysInMonth) {
            week = new Array(7).fill(null);
            for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) { week[i] = new Date(year, month, dayCounter++); }
            weeks.push(week);
        }
        return weeks;
    };

    const schedulesByDate = schedules.reduce((acc: Record<string, any[]>, s) => { try{ const d = new Date(s.start_time).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(s); }catch(e){} return acc; }, {} as Record<string, any[]>);

    const availabilitiesByDate = patientAvailabilities.reduce((acc: Record<string, any[]>, a) => { try{ const d = new Date(a.start_date).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(a); }catch(e){} return acc; }, {} as Record<string, any[]>);

    const getSchedulesForDate = (d: Date) => {
        const key = d.toISOString().slice(0,10);
        const list = (schedulesByDate[key] || []).slice();
        list.sort((a,b)=> new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        return list;
    };

    const getAvailabilitiesForDate = (d: Date) => {
        const key = d.toISOString().slice(0,10);
        const list = (availabilitiesByDate[key] || []).slice();
        list.sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
        return list;
    };

    // helpers for booking: build 1-hour slots from intern availabilities for a given day
    const formatDateTimeLocal = (dt: Date) => {
        const pad = (n: number) => n.toString().padStart(2,'0');
        return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };

    const getInternAvailabilitiesForDate = (d: Date) => {
        const key = d.toISOString().slice(0,10);
        // filter internAvailabilities by same day
        return internAvailabilities.filter(a => {
            try{
                return new Date(a.start_date).toISOString().slice(0,10) === key;
            }catch(e){ return false; }
        }).sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    };

    const buildHourlySlotsForDate = (d: Date) => {
        const avail = getInternAvailabilitiesForDate(d);
        const slots: Array<{internId:number, internName:string, start: Date, end: Date, availId:number}> = [];
        avail.forEach(a => {
            const s = new Date(a.start_date);
            const e = new Date(a.end_date);
            // round start up to next hour if minutes > 0
            let cur = new Date(s);
            if (cur.getMinutes() !== 0 || cur.getSeconds() !== 0) { cur.setMinutes(0,0,0); cur.setHours(cur.getHours()+1); }
            while (cur.getTime() + 3600*1000 <= e.getTime()) {
                const slotEnd = new Date(cur.getTime() + 3600*1000);
                slots.push({ internId: a.intern || a.intern_id || a.internId, internName: (function(){ const it = interns.find(i => i.id === (a.intern || a.intern_id || a.internId)); return it ? `${it.first_name} ${it.last_name}` : 'Estagiário'; })(), start: new Date(cur), end: slotEnd, availId: a.id });
                cur = slotEnd;
            }
        });
        return slots;
    };

    return (
        <div className="patient-page">
            <div className="patient-grid">
                <div className="patient-info">
                    <div className="patient-header">
                        <h2>Paciente</h2>
                        <div className="patient-actions">
                            <div className="tabs">
                                <button className={"tab-btn" + (activeTab==='disponibilidades' ? ' active' : '')} onClick={()=>{ setActiveTab('disponibilidades'); setBookingMode(false); }}>Disponibilidades</button>
                                <button className={"tab-btn" + (activeTab==='agendamentos' ? ' active' : '')} onClick={()=>{ setActiveTab('agendamentos'); }}>Agendamentos</button>
                            </div>
                        </div>
                    </div>

                    {patient ? (
                        <div className="patient-summary">
                            <p><strong>Nome:</strong> {patient.first_name} {patient.last_name}</p>
                            <p><strong>Email:</strong> {patient.email}</p>
                            <p><strong>Telefone:</strong> {patient.phone}</p>
                        </div>
                    ) : <div>Carregando...</div>}

                    <div className="calendar">
                        {/* If in agendamentos tab, show booking controls */}
                        {activeTab === 'agendamentos' && (
                            <div style={{marginBottom:12}}>
                                <button className="btn" onClick={()=>{ setBookingMode(b => !b); setShowSchedulePanel(false); }}>
                                    {bookingMode ? 'Cancelar agendamento' : 'Realizar agendamento'}
                                </button>
                            </div>
                        )}
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
                                ) : viewMode === 'week' ? (
                                    <>
                                        <button className="btn" onClick={prevWeek}>&lt;</button>
                                        {/* show week range */}
                                        <div className="calendar-title">{(() => {
                                            const startOfWeek = new Date(selectedDate);
                                            startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
                                            const endOfWeek = new Date(startOfWeek);
                                            endOfWeek.setDate(startOfWeek.getDate() + 6);
                                            return `${startOfWeek.toLocaleDateString()} — ${endOfWeek.toLocaleDateString()}`;
                                        })()}</div>
                                        <button className="btn" onClick={nextWeek}>&gt;</button>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn" onClick={prevMonth}>&lt;</button>
                                        <div className="calendar-title">{monthStart.toLocaleString(undefined,{ month: 'long', year: 'numeric'})}</div>
                                        <button className="btn" onClick={nextMonth}>&gt;</button>
                                    </>
                                )}
                            </div>
                        </div>
                        {viewMode === 'day' ? (
                            <div className="day-view">
                                <div className="day-schedule-list">
                                    {(() => {
                                        if (activeTab === 'disponibilidades') {
                                            const avs = getAvailabilitiesForDate(selectedDate);
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
                                                                <div className="event-main">{ev.intern} — Sala {ev.room_id ?? '-'}</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </>
                                            );
                                        }

                                        // agendamentos booking mode: show hourly slots for selectedDate
                                        const slots = buildHourlySlotsForDate(selectedDate);
                                        if (!bookingMode) {
                                            // show existing schedules
                                            const evs = getSchedulesForDate(selectedDate);
                                            return evs.length === 0 ? <div className="empty">Nenhum agendamento neste dia.</div> : evs.map(ev => (
                                                <div key={ev.id} className="day-schedule-item">
                                                    <div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(ev.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                    <div className="event-main">{ev.intern} — Sala {ev.room_id ?? '-'}</div>
                                                </div>
                                            ));
                                        }

                                        // render slots grouped by intern
                                        if (slots.length === 0) return <div className="empty">Nenhum horário disponível neste dia.</div>;
                                        return slots.map(slot => (
                                            <div key={`slot-${slot.internId}-${slot.start.toISOString()}`} className="day-availability-item availability-intern" style={{cursor:'pointer'}} onClick={() => {
                                                // on click, prefill form and open schedule panel
                                                setForm({ ...form, intern: String(slot.internId), start_time: formatDateTimeLocal(slot.start), end_time: formatDateTimeLocal(slot.end) });
                                                setShowSchedulePanel(true);
                                            }}>
                                                <div className="event-time">{slot.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {slot.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                <div className="event-main">{slot.internName}</div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        ) : viewMode === 'week' ? (
                            <div className="week-grid">
                                {(() => {
                                    const startOfWeek = new Date(selectedDate);
                                    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
                                    const days = Array.from({length:7}).map((_,i)=>{ const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate()+i); return d; });
                                    return days.map(d => (
                                        <div key={d.toISOString()} className="week-day">
                                            <div className="week-day-header">{d.toLocaleDateString(undefined,{ weekday: 'short', day:'numeric' })}</div>
                                            <div className="week-day-body">
                                                {activeTab === 'disponibilidades' ? (
                                                    <>
                                                        {getAvailabilitiesForDate(d).map(a => (
                                                            <div key={`av-${a.id}`} className="calendar-availability" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                                <div className="event-time">{new Date(a.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(a.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                <div className="event-main">Disponível</div>
                                                            </div>
                                                        ))}
                                                        {getSchedulesForDate(d).map(ev => (
                                                            <div key={ev.id} className="calendar-schedule" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                                <div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                <div className="event-main">{ev.intern} — Sala {ev.room_id ?? '-'}</div>
                                                            </div>
                                                        ))}
                                                    </>
                                                ) : (
                                                    // agendamentos tab: if bookingMode show intern hourly slots per day
                                                    (() => {
                                                        if (!bookingMode) return getSchedulesForDate(d).map(ev => (
                                                            <div key={ev.id} className="calendar-schedule" style={{padding:'6px', borderRadius:6, marginBottom:6}}>
                                                                <div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                <div className="event-main">{ev.intern} — Sala {ev.room_id ?? '-'}</div>
                                                            </div>
                                                        ));
                                                        const slots = buildHourlySlotsForDate(d);
                                                        if (slots.length === 0) return <div className="empty">Nenhum horário disponível neste dia.</div>;
                                                        return slots.map(slot => (
                                                            <div key={`slot-${slot.internId}-${slot.start.toISOString()}`} className="calendar-availability availability-intern" style={{padding:6, borderRadius:6, marginBottom:6, cursor:'pointer'}} onClick={() => { setForm({ ...form, intern: String(slot.internId), start_time: formatDateTimeLocal(slot.start), end_time: formatDateTimeLocal(slot.end) }); setShowSchedulePanel(true); }}>
                                                                <div className="event-time">{slot.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {slot.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                <div className="event-main">{slot.internName}</div>
                                                            </div>
                                                        ));
                                                    })()
                                                )}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <div className="calendar-grid">
                                <div className="weekday">Dom</div>
                                <div className="weekday">Seg</div>
                                <div className="weekday">Ter</div>
                                <div className="weekday">Qua</div>
                                <div className="weekday">Qui</div>
                                <div className="weekday">Sex</div>
                                <div className="weekday">Sáb</div>
                                {buildCalendar().map((week, wi) => (
                                    <React.Fragment key={wi}>
                                        {week.map((d, di) => (
                                            <div className={"calendar-cell"} key={di}>
                                                {d && (
                                                    <div>
                                                        <div className="calendar-day-number">{d.getDate()}</div>
                                                        <div className="calendar-events">
                                                            {(schedulesByDate[d.toISOString().slice(0,10)] || []).map(ev => (
                                                                <div key={ev.id} className="calendar-event">
                                                                    <div className="event-time">{new Date(ev.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                                                    <div className="event-label">{ev.intern} — {ev.room_id ?? '-'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showAvailabilityPanel && (
                <div className="fullscreen-panel">
                    <div className="panel-inner">
                        <button className="panel-close" onClick={()=>setShowAvailabilityPanel(false)}>Fechar ×</button>
                        <h2>Editar disponibilidades do paciente</h2>
                        <div className="table-wrap">
                            <table className="patient-availability-table">
                                <thead><tr><th>ID</th><th>Start</th><th>End</th><th>Ações</th></tr></thead>
                                        <tbody>
                                            {patientAvailabilities.map(a => (
                                                <tr key={a.id}>
                                                    <td>{a.id}</td>
                                                    <td>{new Date(a.start_date).toLocaleString()}</td>
                                                    <td>{new Date(a.end_date).toLocaleString()}</td>
                                                    <td><button className="btn-del" onClick={()=>handleDeletePatientAvailability(a.id)}>Excluir</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                            </table>
                        </div>
                        <h3>Adicionar disponibilidade</h3>
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

            {showSchedulePanel && (
                <div className="fullscreen-panel">
                    <div className="panel-inner">
                        <button className="panel-close" onClick={()=>setShowSchedulePanel(false)}>Fechar ×</button>
                        <h2>Criar agendamento</h2>
                        <form onSubmit={handleCreateSchedule} className="panel-form">
                            <label>Estagiário</label>
                            <select name="intern" value={form.intern} onChange={handleChange} required>
                                <option value="">Selecione</option>
                                {interns.map(i => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>)}
                            </select>
                            <label>Room id</label>
                            <input name="room_id" value={form.room_id} onChange={handleChange} placeholder="Room id" />
                            <label>Start</label>
                            <input name="start_time" type="datetime-local" value={form.start_time} onChange={handleChange} required />
                            <label>End</label>
                            <input name="end_time" type="datetime-local" value={form.end_time} onChange={handleChange} required />
                            <button type="submit" className="btn">Criar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
