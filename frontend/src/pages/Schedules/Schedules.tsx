import React, { useEffect, useState } from 'react';
import './Schedules.css';

export default function Schedules() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [availabilities, setAvailabilities] = useState<any[]>([]); // intern availabilities
    const [interns, setInterns] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [patientAvailabilities, setPatientAvailabilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');
    const [filterBy, setFilterBy] = useState<'any'|'patient'|'intern'>('any');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [viewMode, setViewMode] = useState<'day'|'week'|'month'>('week');
    const [selectedDate, setSelectedDate] = useState<Date>(()=>new Date());
    const [bookingMode, setBookingMode] = useState(false);
    const [showSchedulePanel, setShowSchedulePanel] = useState(false);
    const [form, setForm] = useState({ patient: '', intern: '', room_id: '', start_time: '', end_time: '' });

    const fetchSchedules = async (params?: { q?: string; start?: string; end?: string; filterBy?: string }) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const parts: string[] = [];
            if (params?.q) parts.push(`q=${encodeURIComponent(params.q)}`);
            if (params?.start) parts.push(`start=${encodeURIComponent(params.start)}`);
            if (params?.end) parts.push(`end=${encodeURIComponent(params.end)}`);
            if (params?.filterBy && params.filterBy !== 'any') parts.push(`filter_by=${encodeURIComponent(params.filterBy)}`);
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

    const fetchInterns = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/estagiarios/', { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setInterns(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchPatients = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/patients/', { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setPatients(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchPatientAvailabilities = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/patientavailabilities/', { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setPatientAvailabilities(await resp.json());
        }catch(e){ console.error(e); }
    };

    useEffect(() => { fetchSchedules(); fetchAvailabilities(); fetchPatientAvailabilities(); fetchInterns(); fetchPatients(); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSchedules({ q, start, end, filterBy });
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

    const pad = (n: number) => n.toString().padStart(2,'0');
    const formatDateTimeLocal = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    const getInternAvailabilitiesForDate = (d: Date) => {
        const key = d.toISOString().slice(0,10);
        return availabilities.filter(a => {
            try{ return new Date(a.start_date).toISOString().slice(0,10) === key; }catch(e){ return false; }
        }).sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    };

    const getPatientAvailabilitiesForPatientAndDate = (patientId: any, d: Date) => {
        const key = d.toISOString().slice(0,10);
        return patientAvailabilities.filter(a => {
            try{ return (String(a.patient) === String(patientId) || String(a.patient_id) === String(patientId)) && new Date(a.start_date).toISOString().slice(0,10) === key; }catch(e){ return false; }
        }).sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    };

    const buildHourlySlotsForDate = (d: Date) => {
        const avail = getInternAvailabilitiesForDate(d);
        const slots: Array<{internId:number, internName:string, start: Date, end: Date}> = [];
        avail.forEach(a => {
            const s = new Date(a.start_date);
            const e = new Date(a.end_date);
            let cur = new Date(s);
            if (cur.getMinutes() !== 0 || cur.getSeconds() !== 0) { cur.setMinutes(0,0,0); cur.setHours(cur.getHours()+1); }
            while (cur.getTime() + 3600*1000 <= e.getTime()) {
                const slotEnd = new Date(cur.getTime() + 3600*1000);
                const internId = a.intern ?? a.intern_id ?? a.internId ?? null;
                const it = interns.find(i => i.id === internId) || interns.find(i => String(i.id) === String(internId));
                slots.push({ internId: internId, internName: it ? `${it.first_name} ${it.last_name}` : 'Estagiário', start: new Date(cur), end: slotEnd });
                cur = slotEnd;
            }
        });
        return slots;
    };
    
    const findPersonName = (list: any[], value: any, roleLabel = '') => {
        if (value == null) return '';
        // value might be an id number/string or an object
        const id = (typeof value === 'object' && value !== null) ? (value.id ?? value.patient_id ?? value.intern_id ?? null) : value;
        if (id != null) {
            const found = list.find(u => String(u.id) === String(id));
            if (found) return `${found.first_name || ''} ${found.last_name || ''}`.trim();
        }
        // if value is already an object with name fields
        if (typeof value === 'object' && value !== null) {
            if (value.first_name || value.last_name) return `${value.first_name || ''} ${value.last_name || ''}`.trim();
            if (value.name) return value.name;
            if (value.patient_name) return value.patient_name;
            if (value.intern_name) return value.intern_name;
        }
        // fallback to string
        return String(value);
    };
    const slotIsOccupied = (internId: any, start: Date, end: Date) => {
        return schedules.some(s => {
            try{
                const sid = s.intern ?? s.intern_id ?? s.internId ?? null;
                if (String(sid) !== String(internId)) return false;
                const ss = new Date(s.start_time);
                const se = new Date(s.end_time);
                // overlap if ss < end && se > start
                return ss.getTime() < end.getTime() && se.getTime() > start.getTime();
            }catch(e){ return false; }
        });
    };

    const getScheduleForSlot = (internId: any, start: Date, end: Date) => {
        return schedules.find(s => {
            try{
                const sid = s.intern ?? s.intern_id ?? s.internId ?? null;
                if (String(sid) !== String(internId)) return false;
                const ss = new Date(s.start_time);
                const se = new Date(s.end_time);
                return ss.getTime() < end.getTime() && se.getTime() > start.getTime();
            }catch(e){ return false; }
        }) || null;
    };

    const handleSlotClick = (slot: {internId:any, start:Date, end:Date}) => {
        if (slotIsOccupied(slot.internId, slot.start, slot.end)) return; // ignore occupied
        if (!form.patient) { alert('Selecione um paciente antes de escolher um horário.'); return; }
        setForm({ ...form, intern: String(slot.internId), start_time: formatDateTimeLocal(slot.start), end_time: formatDateTimeLocal(slot.end) });
        setShowSchedulePanel(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreateSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch('http://localhost:8000/api/schedules/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ intern: form.intern, patient: form.patient, room_id: form.room_id || null, start_time: new Date(form.start_time).toISOString(), end_time: new Date(form.end_time).toISOString() })
            });
            if(resp.ok){ setForm({ patient: '', intern: '', room_id: '', start_time: '', end_time: '' }); fetchSchedules(); setShowSchedulePanel(false); }
            else console.error('create failed', await resp.text());
        }catch(err){ console.error(err); }
    };

    

    return (
        <div className="schedules-page">
            <div className="schedules-grid">
                <div className="schedules-filter">
                    <h2>Agendamentos</h2>
                    <form onSubmit={handleSearch} className="schedules-search-form">
                        <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar por paciente/estagiário/room" />
                            <select value={filterBy} onChange={e => setFilterBy(e.target.value as any)}>
                                <option value="any">Todos</option>
                                <option value="patient">Paciente</option>
                                <option value="intern">Estagiário</option>
                            </select>
                        </div>
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
                        <div style={{marginBottom:12, display:'flex', gap:8, alignItems:'center'}}>
                            <button className="btn" onClick={()=>{ setBookingMode(b=>!b); setShowSchedulePanel(false); if(bookingMode) setForm({ ...form, patient: '' }); }}>
                                {bookingMode ? 'Cancelar agendamento' : 'Realizar agendamento'}
                            </button>
                            {/* when bookingMode is active show patient selector so user must pick a patient before selecting a slot */}
                            {bookingMode && (
                                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                                    <label style={{color:'#cfe8ff', fontWeight:600}}>Paciente</label>
                                    <select name="patient" value={form.patient} onChange={(e)=> setForm({...form, patient: e.target.value})}>
                                        <option value="">-- selecione paciente --</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        {viewMode === 'day' ? (
                            <div className="day-view">
                                {( (()=>{
                                    const slots = buildHourlySlotsForDate(selectedDate);
                                    if(slots.length === 0) return <div className="empty">Nenhum horário disponível neste dia.</div>;
                                    return (
                                        <div className="day-schedule-list">
                                            {slots.map(slot => {
                                            const occupied = slotIsOccupied(slot.internId, slot.start, slot.end);
                                            // determine if slot matches selected patient's availability
                                            const patientId = form.patient;
                                            let isMatch = false;
                                            if (patientId) {
                                                const pats = getPatientAvailabilitiesForPatientAndDate(patientId, selectedDate);
                                                isMatch = pats.some(pa => { const ps = new Date(pa.start_date); const pe = new Date(pa.end_date); return ps.getTime() < slot.end.getTime() && pe.getTime() > slot.start.getTime(); });
                                            }

                                            // show intern name always now
                                            const showInternName = true;

                                            if (occupied) {
                                                const sched = getScheduleForSlot(slot.internId, slot.start, slot.end);
                                                const patientName = sched ? (sched.patient_name || sched.patient || sched.patientId || sched.patient_id || '') : '';
                                                return (
                                                    <div key={`occ-${slot.internId}-${slot.start.toISOString()}`} className={"day-schedule-item calendar-schedule" + (isMatch ? ' slot-match' : '')}>
                                                        <div className="event-time">{slot.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {slot.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                        <div className="event-main">{showInternName ? `${slot.internName}${patientName ? ' / ' + patientName : ' — Ocupado'}` : 'Ocupado'}</div>
                                                    </div>
                                                );
                                            }

                                            // free slot — show intern name always
                                            return (
                                                <div key={`slot-${slot.internId}-${slot.start.toISOString()}`} className={"day-availability-item availability-intern" + (isMatch ? ' slot-match' : '')} style={{cursor: bookingMode ? (form.patient ? 'pointer' : 'default') : 'default'}} onClick={()=> (bookingMode && form.patient) ? handleSlotClick(slot as any) : undefined}>
                                                    <div className="event-time">{slot.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {slot.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                    <div className="event-main">{slot.internName}</div>
                                                </div>
                                            );
                                        })}
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
                                                {(() => {
                                                    const slots = buildHourlySlotsForDate(d);
                                                    if (slots.length === 0) return <div className="empty">Nenhum horário disponível neste dia.</div>;
                                                    return slots.map(slot => {
                                                        const occupied = slotIsOccupied(slot.internId, slot.start, slot.end);
                                                        // determine if slot matches selected patient's availability
                                                        const patientId = form.patient;
                                                        let isMatch = false;
                                                        if (patientId) {
                                                            const pats = getPatientAvailabilitiesForPatientAndDate(patientId, d);
                                                            isMatch = pats.some(pa => { const ps = new Date(pa.start_date); const pe = new Date(pa.end_date); return ps.getTime() < slot.end.getTime() && pe.getTime() > slot.start.getTime(); });
                                                        }
                                                        const showInternName = true; // always reveal intern names

                                                        if (occupied) {
                                                            const sched = getScheduleForSlot(slot.internId, slot.start, slot.end);
                                                            const patientName = sched ? (sched.patient_name || sched.patient || sched.patientId || sched.patient_id || '') : '';
                                                            return (
                                                                <div key={`occ-${slot.internId}-${slot.start.toISOString()}`} className={"calendar-schedule" + (isMatch ? ' slot-match' : '')} style={{padding:6, borderRadius:6, marginBottom:6}}>
                                                                    <div className="event-time">{slot.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {slot.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                    <div className="event-main">{showInternName ? `${slot.internName}${patientName ? ' / ' + patientName : ' — Ocupado'}` : 'Ocupado'}</div>
                                                                </div>
                                                            );
                                                        }

                                                        // free slot
                                                        return (
                                                            <div key={`slot-${slot.internId}-${slot.start.toISOString()}`} className={("calendar-availability availability-intern") + (isMatch ? ' slot-match' : '')} style={{padding:6, borderRadius:6, marginBottom:6, cursor: (bookingMode && form.patient) ? 'pointer' : 'default'}} onClick={()=> (bookingMode && form.patient) ? handleSlotClick(slot as any) : undefined}>
                                                                <div className="event-time">{slot.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {slot.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                <div className="event-main">{slot.internName}</div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        )}

                        {showSchedulePanel && (
                            <div className="fullscreen-panel">
                                <div className="panel-inner">
                                    <button className="panel-close" onClick={()=>setShowSchedulePanel(false)}>Fechar ×</button>
                                    <h2>Criar agendamento</h2>
                                    <form onSubmit={handleCreateSchedule} className="panel-form">
                                        <label>Paciente</label>
                                        <select name="patient" value={form.patient} onChange={handleFormChange} required>
                                            <option value="">Selecione</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                                        </select>
                                        <label>Estagiário</label>
                                        <select name="intern" value={form.intern} onChange={handleFormChange} required>
                                            <option value="">Selecione</option>
                                            {interns.map(i => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>)}
                                        </select>
                                        <label>Room id</label>
                                        <input name="room_id" value={form.room_id} onChange={handleFormChange} placeholder="Room id" />
                                        <label>Start</label>
                                        <input name="start_time" type="datetime-local" value={form.start_time} onChange={handleFormChange} required />
                                        <label>End</label>
                                        <input name="end_time" type="datetime-local" value={form.end_time} onChange={handleFormChange} required />
                                        <button type="submit" className="btn">Criar</button>
                                    </form>
                                </div>
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
                                                <td>{findPersonName(patients, s.patient)}</td>
                                                <td>{findPersonName(interns, s.intern)}</td>
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
