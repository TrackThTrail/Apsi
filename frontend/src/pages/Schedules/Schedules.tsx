import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import './Schedules.css';

export default function Schedules() {
    // Base API URL: set VITE_API_URL in your frontend host (Vercel/Render) to point to the backend
    const API_BASE = (import.meta && import.meta.env && (import.meta.env.VITE_API_URL as string)) || 'http://localhost:8000';
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

    // react-select options and styles for patient select
    const patientOptions = patients.map(p => ({ value: String(p.id), label: `${p.first_name} ${p.last_name || ''}`.trim() }));
    const filterOptions = [
        { value: 'any', label: 'Todos' },
        { value: 'patient', label: 'Paciente' },
        { value: 'intern', label: 'Estagiário' },
    ];
    const customSelectStyles: any = {
        control: (provided: any, state: any) => ({
            ...provided,
            background: '#0f172a',
            borderColor: state.isFocused ? 'rgba(10,132,255,0.6)' : 'rgba(255,255,255,0.06)',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(10,132,255,0.06)' : 'none',
            minWidth: 200,
            color: '#f8fafc'
        }),
        singleValue: (provided: any) => ({ ...provided, color: '#f8fafc' }),
        option: (provided: any, state: any) => ({
            ...provided,
            background: state.isSelected ? 'rgba(14,165,233,0.12)' : (state.isFocused ? 'rgba(14,165,233,0.06)' : 'transparent'),
            color: '#f8fafc',
            padding: '8px 12px'
        }),
        menu: (provided: any) => ({ ...provided, background: '#0f172a', color: '#f8fafc', borderRadius: 8, overflow: 'hidden' }),
        placeholder: (provided: any) => ({ ...provided, color: 'rgba(248,250,252,0.6)' }),
        dropdownIndicator: (provided: any) => ({ ...provided, color: 'rgba(248,250,252,0.6)' }),
        indicatorSeparator: (provided: any) => ({ ...provided, background: 'transparent' }),
    };

    const fetchSchedules = async (params?: { q?: string; start?: string; end?: string; filterBy?: string }) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const parts: string[] = [];
            if (params?.q) parts.push(`q=${encodeURIComponent(params.q)}`);
            if (params?.start) parts.push(`start=${encodeURIComponent(params.start)}`);
            if (params?.end) parts.push(`end=${encodeURIComponent(params.end)}`);
            if (params?.filterBy && params.filterBy !== 'any') parts.push(`filter_by=${encodeURIComponent(params.filterBy)}`);
            const url = `${API_BASE}/api/schedules/${parts.length ? '?' + parts.join('&') : ''}`;
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
            const resp = await fetch(`${API_BASE}/api/availabilities/`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setAvailabilities(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchInterns = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/estagiarios/`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setInterns(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchPatients = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/patients/`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setPatients(await resp.json());
        }catch(e){ console.error(e); }
    };

    const fetchPatientAvailabilities = async () => {
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/patientavailabilities/`, { headers: { Authorization: `Bearer ${token}` } });
            if(resp.ok) setPatientAvailabilities(await resp.json());
        }catch(e){ console.error(e); }
    };

    useEffect(() => { fetchSchedules(); fetchAvailabilities(); fetchPatientAvailabilities(); fetchInterns(); fetchPatients(); }, []);

    // debounce search queries to avoid firing on every keystroke
    useEffect(() => {
        const id = setTimeout(() => {
            fetchSchedules({ q, start, end, filterBy });
        }, 300);
        return () => clearTimeout(id);
    }, [q, start, end, filterBy]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchSchedules({ q, start, end, filterBy });
    };

    const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); };
    const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); };
    const prevWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); };
    const nextWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); };

    const schedulesByDate = schedules.reduce((acc: Record<string, any[]>, s) => { try{ const d = new Date(s.start_time).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(s); }catch(e){} return acc; }, {} as Record<string, any[]>);
    const patientAvailByDate = patientAvailabilities.reduce((acc: Record<string, any[]>, a) => { try{ const d = new Date(a.start_date).toISOString().slice(0,10); if (!acc[d]) acc[d] = []; acc[d].push(a); }catch(e){} return acc; }, {} as Record<string, any[]>);

    const getSchedulesForDate = (d: Date) => { const key = d.toISOString().slice(0,10); return (schedulesByDate[key] || []).slice().sort((a,b)=> new Date(a.start_time).getTime() - new Date(b.start_time).getTime()); };
    const getPatientAvailForDate = (d: Date) => { const key = d.toISOString().slice(0,10); return (patientAvailByDate[key] || []).slice().sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime()); };

    const pad = (n: number) => n.toString().padStart(2,'0');
    const formatDateTimeLocal = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    const getInternAvailabilitiesForDate = (d: Date) => {
        const key = d.toISOString().slice(0,10);
        return availabilities.filter(a => {
            try{ return new Date(a.start_date).toISOString().slice(0,10) === key; }catch(e){ return false; }
        }).sort((a,b)=> new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    };

    // helper to get patient availabilities grouped by date is available via `getPatientAvailForDate` and
    // further filtering by patient id can be done inline where needed.

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

    // build 1-hour slots for patient availabilities (same rounding logic as intern slots)
    const buildHourlyPatientSlotsForDate = (d: Date) => {
        const pats = getPatientAvailForDate(d);
        const slots: Array<{patientId:any, patientName:string, start: Date, end: Date, parentId:any}> = [];
        pats.forEach(pa => {
            const s = new Date(pa.start_date);
            const e = new Date(pa.end_date);
            let cur = new Date(s);
            if (cur.getMinutes() !== 0 || cur.getSeconds() !== 0) { cur.setMinutes(0,0,0); cur.setHours(cur.getHours()+1); }
            while (cur.getTime() + 3600*1000 <= e.getTime()) {
                const slotEnd = new Date(cur.getTime() + 3600*1000);
                const patientId = pa.patient ?? pa.patient_id ?? pa.patientId ?? null;
                const pt = patients.find(p => p.id === patientId) || patients.find(p => String(p.id) === String(patientId));
                slots.push({ patientId, patientName: pt ? `${pt.first_name} ${pt.last_name}` : findPersonName(patients, patientId), start: new Date(cur), end: slotEnd, parentId: pa.id });
                cur = slotEnd;
            }
        });
        return slots;
    };
    
    const findPersonName = (list: any[], value: any) => {
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
    const findPersonShortName = (list: any[], value: any) => {
        // prefer resolving from list
        if (value == null) return '';
        const id = (typeof value === 'object' && value !== null) ? (value.id ?? value.patient_id ?? value.intern_id ?? null) : value;
        let found = null;
        if (id != null) found = list.find(u => String(u.id) === String(id));
        if (!found && typeof value === 'object' && value !== null) found = value;
        const name = found ? (`${found.first_name || ''}`.trim() + (found.last_name ? ` ${String(found.last_name).split(' ')[0].slice(0,1)}.` : '')) : null;
        if (name) return name;
        // fallback: if value is a string full name, abbreviate last name
        if (typeof value === 'string') {
            const parts = value.split(' ');
            if (parts.length === 1) return parts[0];
            return `${parts[0]} ${parts[1].slice(0,1)}.`;
        }
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

    // getScheduleForSlot removed (unused). Use `schedules` array directly or `slotIsOccupied` where needed.

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
            const resp = await fetch(`${API_BASE}/api/schedules/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ intern: form.intern, patient: form.patient, room_id: form.room_id || null, start_time: new Date(form.start_time).toISOString(), end_time: new Date(form.end_time).toISOString() })
            });
            if(resp.ok){ setForm({ patient: '', intern: '', room_id: '', start_time: '', end_time: '' }); fetchSchedules(); setShowSchedulePanel(false); }
            else console.error('create failed', await resp.text());
        }catch(err){ console.error(err); }
    };

    const handleDeleteSchedule = async (id: any) => {
        if (!confirm('Excluir agendamento? Essa ação não pode ser desfeita.')) return;
        try{
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`${API_BASE}/api/schedules/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (resp.ok || resp.status === 204) {
                // refresh data
                fetchSchedules();
                fetchAvailabilities();
                fetchPatientAvailabilities();
            } else {
                console.error('delete failed', await resp.text());
            }
        }catch(e){ console.error(e); }
    };

    

    return (
        <div className="schedules-page">
            <div className="schedules-grid">
                <div className="schedules-filter">
                    <h2>Agendamentos</h2>
                    <form onSubmit={handleSearch} className="schedules-search-form">
                        <div className="search-left" style={{display:'flex', gap:8, alignItems:'center'}}>
                            <div className="search-input-container">
                                <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                                    <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zM10 14a4 4 0 110-8 4 4 0 010 8z"/>
                                </svg>
                                <input className="search-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Pesquisar por paciente/estagiário/room" />
                            </div>
                            <div style={{minWidth:140}}>
                                <Select
                                    styles={customSelectStyles}
                                    options={filterOptions}
                                    value={filterOptions.find(o => o.value === filterBy) || filterOptions[0]}
                                    onChange={(opt:any) => setFilterBy(opt ? (opt.value as 'any'|'patient'|'intern') : 'any')}
                                    isSearchable={false}
                                />
                            </div>
                            <div className="date-range">
                                <label>De</label>
                                <input type="date" value={start} onChange={e => setStart(e.target.value)} />
                                <label>Até</label>
                                <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-search">Buscar</button>
                        </div>
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
                                    <div style={{minWidth:220}}>
                                        <Select
                                            styles={customSelectStyles}
                                            options={patientOptions}
                                            value={patientOptions.find(o => o.value === String(form.patient)) || null}
                                            onChange={(opt:any) => setForm({...form, patient: opt ? String(opt.value) : ''})}
                                            placeholder="-- selecione paciente --"
                                            isClearable
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        {viewMode === 'day' ? (
                            <>
                            <div className="day-view">
                                {(() => {
                                    // If not in booking mode, show existing schedules only
                                    if (!bookingMode) {
                                        const scheds = getSchedulesForDate(selectedDate);
                                        if (!scheds || scheds.length === 0) return <div className="empty">Nenhum agendamento neste dia.</div>;
                                        // group schedules by hour
                                        const keyFor = (dt: Date) => {
                                            const y = dt.getFullYear();
                                            const m = String(dt.getMonth()+1).padStart(2,'0');
                                            const day = String(dt.getDate()).padStart(2,'0');
                                            const hh = String(dt.getHours()).padStart(2,'0');
                                            const mm = String(dt.getMinutes()).padStart(2,'0');
                                            return `${y}-${m}-${day}T${hh}:${mm}`;
                                        };
                                        const map = new Map<string, any[]>();
                                        scheds.forEach(s => {
                                            try{
                                                const k = keyFor(new Date(s.start_time));
                                                if (!map.has(k)) map.set(k, []);
                                                map.get(k)!.push(s);
                                            }catch(e){}
                                        });
                                        const entries = Array.from(map.entries()).sort((a,b)=> new Date(a[0]).getTime() - new Date(b[0]).getTime());
                                        return (
                                            <div className="day-schedule-list">
                                                {entries.map(([k, list]) => {
                                                            return (
                                                                <div key={`srow-${k}`} className="time-row">
                                                                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                                                                        {list.map((s: any) => (
                                                                            <div key={`s-${s.id}`} className="day-availability-item calendar-schedule" title={`${findPersonName(patients, s.patient)} — ${findPersonName(interns, s.intern)}`}>
                                                                                <div className="event-time">{new Date(s.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(s.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                                <div className="event-main">{findPersonShortName(patients, s.patient)} — {findPersonShortName(interns, s.intern)}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                            </div>
                                        );
                                    }
                                    // bookingMode: show availabilities (existing behavior)
                                    const internSlots = buildHourlySlotsForDate(selectedDate);
                                    const patientSlots = buildHourlyPatientSlotsForDate(selectedDate);
                                    // group by local hour:minute key to avoid timezone/ms mismatch
                                    const timeMap = new Map<string, { time: Date, intern: any[], patients: any[] }>();
                                    const keyFor = (dt: Date) => {
                                        const y = dt.getFullYear();
                                        const m = String(dt.getMonth()+1).padStart(2,'0');
                                        const day = String(dt.getDate()).padStart(2,'0');
                                        const hh = String(dt.getHours()).padStart(2,'0');
                                        const mm = String(dt.getMinutes()).padStart(2,'0');
                                        return `${y}-${m}-${day}T${hh}:${mm}`;
                                    };
                                    internSlots.forEach(s => {
                                        const k = keyFor(s.start);
                                        if (!timeMap.has(k)) timeMap.set(k, { time: s.start, intern: [], patients: [] });
                                        timeMap.get(k)!.intern.push(s);
                                    });
                                    patientSlots.forEach(s => {
                                        const k = keyFor(s.start);
                                        if (!timeMap.has(k)) timeMap.set(k, { time: s.start, intern: [], patients: [] });
                                        timeMap.get(k)!.patients.push(s);
                                    });
                                    const entries = Array.from(timeMap.entries()).sort((a,b)=> new Date(a[0]).getTime() - new Date(b[0]).getTime());
                                    if (entries.length === 0) return <div className="empty">Nenhum horário disponível neste dia.</div>;
                                    // Only render time-rows for intern slots (and potential matches). Patient-only times are shown below in the patient-only list to avoid duplicated time labels.
                                    const internEntries = entries.filter(([_k, group]) => group.intern.length > 0);
                                    return (
                                        <div className="day-schedule-list">
                                            {internEntries.map(([k, group]) => {
                                                const t = group.time;
                                                const isPotentialMatch = group.intern.length > 0 && group.patients.length > 0;
                                                    return (
                                                    <div key={`row-${k}`} className={`time-row${isPotentialMatch ? ' time-row-match' : ''}`}>
                                                        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                                                            {group.intern.map(slot => (
                                                                        <div key={`i-${slot.internId}-${slot.start.toISOString()}`} title={slot.internName} className={`day-availability-item availability-intern${isPotentialMatch ? ' slot-potential-match' : ''}`} style={{cursor: bookingMode ? (form.patient ? 'pointer' : 'default') : 'default'}} onClick={()=> (bookingMode && form.patient) ? handleSlotClick(slot as any) : undefined}>
                                                                            <div className="event-time">{t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(t.getTime()+3600*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                            <div className="event-main">{findPersonShortName(interns, slot.internId)}</div>
                                                                        </div>
                                                                    ))}
                                                            {isPotentialMatch ? group.patients.map(ps => (
                                                                <div key={`p-${ps.parentId}-${ps.start.toISOString()}`} className={`day-availability-item availability-patient${bookingMode && form.patient && String(ps.patientId) === String(form.patient) ? ' slot-match' : ''}${isPotentialMatch ? ' slot-potential-match' : ''}`} title={ps.patientName}>
                                                                    <div className="event-time">{t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(t.getTime()+3600*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                    <div className="event-main">{findPersonShortName(patients, ps.patientId)}</div>
                                                                </div>
                                                            )) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                            {/* show patient availabilities for the day (only in booking mode) */}
                            {bookingMode && (() => {
                                // only show patient-only slots here (exclude those times where an intern is present to avoid duplicates)
                                const internSlotsForDay = buildHourlySlotsForDate(selectedDate).map(s => s.start.getTime());
                                let pSlots = buildHourlyPatientSlotsForDate(selectedDate) || [];
                                pSlots = pSlots.filter(ps => !internSlotsForDay.includes(ps.start.getTime()));
                                if (!pSlots || pSlots.length === 0) return null;
                                return (
                                    <div style={{marginTop:12}}>
                                        <h4 style={{margin:0, marginBottom:6}}>Disponibilidades dos pacientes (1h)</h4>
                                        <div className="day-schedule-list">
                                            {pSlots.map(ps => (
                                                <div key={`pav-${ps.parentId}-${ps.start.toISOString()}`} className={`day-availability-item availability-patient compact${bookingMode && form.patient && String(ps.patientId) === String(form.patient) ? ' slot-match' : ''}`} title={ps.patientName}>
                                                    <div className="event-time">{ps.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {ps.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                    <div className="event-main">{findPersonShortName(patients, ps.patientId)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                            </>
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
                                                    // If not in booking mode, show existing schedules for this day
                                                    if (!bookingMode) {
                                                        const scheds = getSchedulesForDate(d);
                                                        if (!scheds || scheds.length === 0) return <div className="empty">Nenhum agendamento neste dia.</div>;
                                                        const keyFor = (dt: Date) => {
                                                            const y = dt.getFullYear();
                                                            const m = String(dt.getMonth()+1).padStart(2,'0');
                                                            const day = String(dt.getDate()).padStart(2,'0');
                                                            const hh = String(dt.getHours()).padStart(2,'0');
                                                            const mm = String(dt.getMinutes()).padStart(2,'0');
                                                            return `${y}-${m}-${day}T${hh}:${mm}`;
                                                        };
                                                        const map = new Map<string, any[]>();
                                                        scheds.forEach(s => {
                                                            try{ const k = keyFor(new Date(s.start_time)); if (!map.has(k)) map.set(k, []); map.get(k)!.push(s); }catch(e){}
                                                        });
                                                        const entries = Array.from(map.entries()).sort((a,b)=> new Date(a[0]).getTime() - new Date(b[0]).getTime());
                                                        return entries.map(([k, list]) => (
                                                            <div key={`srow-${k}`} className="time-row">
                                                                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                                                                    {list.map((s: any) => (
                                                                        <div key={`s-${s.id}`} className="day-availability-item calendar-schedule" title={`${findPersonName(patients, s.patient)} — ${findPersonName(interns, s.intern)}`}>
                                                                            <div className="event-time">{new Date(s.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(s.end_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                            <div className="event-main">{findPersonShortName(patients, s.patient)} — {findPersonShortName(interns, s.intern)}</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ));
                                                    }
                                                    // bookingMode: render availabilities (existing behavior)
                                                    const internSlots = buildHourlySlotsForDate(d);
                                                    const patientSlots = buildHourlyPatientSlotsForDate(d);
                                                    // group by local hour:minute key to avoid timezone/ms mismatch
                                                    const timeMap = new Map<string, { time: Date, intern: any[], patients: any[] }>();
                                                    const keyFor = (dt: Date) => {
                                                        const y = dt.getFullYear();
                                                        const m = String(dt.getMonth()+1).padStart(2,'0');
                                                        const day = String(dt.getDate()).padStart(2,'0');
                                                        const hh = String(dt.getHours()).padStart(2,'0');
                                                        const mm = String(dt.getMinutes()).padStart(2,'0');
                                                        return `${y}-${m}-${day}T${hh}:${mm}`;
                                                    };
                                                    internSlots.forEach(s => {
                                                        const k = keyFor(s.start);
                                                        if (!timeMap.has(k)) timeMap.set(k, { time: s.start, intern: [], patients: [] });
                                                        timeMap.get(k)!.intern.push(s);
                                                    });
                                                    patientSlots.forEach(s => {
                                                        const k = keyFor(s.start);
                                                        if (!timeMap.has(k)) timeMap.set(k, { time: s.start, intern: [], patients: [] });
                                                        timeMap.get(k)!.patients.push(s);
                                                    });
                                                    const entries = Array.from(timeMap.entries()).sort((a,b)=> new Date(a[0]).getTime() - new Date(b[0]).getTime());
                                                    if (entries.length === 0) return <div className="empty">Nenhum horário disponível neste dia.</div>;
                                                    // Only render time-rows for intern slots (and potential matches). Patient-only times are shown below to avoid duplicated time labels.
                                                    const internEntries = entries.filter(([_k, group]) => group.intern.length > 0);
                                                    return internEntries.map(([k, group]) => {
                                                        const t = group.time;
                                                        const isPotentialMatch = group.intern.length > 0 && group.patients.length > 0;
                                                        return (
                                                            <div key={`row-${k}`} className={`time-row${isPotentialMatch ? ' time-row-match' : ''}`}>
                                                                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                                                                    {group.intern.map(slot => (
                                                                        <div key={`i-${slot.internId}-${slot.start.toISOString()}`} title={slot.internName} className={`day-availability-item availability-intern${isPotentialMatch ? ' slot-potential-match' : ''}`} style={{cursor: bookingMode ? (form.patient ? 'pointer' : 'default') : 'default'}} onClick={()=> (bookingMode && form.patient) ? handleSlotClick(slot as any) : undefined}>
                                                                            <div className="event-time">{t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(t.getTime()+3600*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                            <div className="event-main">{findPersonShortName(interns, slot.internId)}</div>
                                                                        </div>
                                                                    ))}
                                                                    {isPotentialMatch ? group.patients.map(ps => (
                                                                        <div key={`p-${ps.parentId}-${ps.start.toISOString()}`} className={`day-availability-item availability-patient${bookingMode && form.patient && String(ps.patientId) === String(form.patient) ? ' slot-match' : ''}${isPotentialMatch ? ' slot-potential-match' : ''}`} title={ps.patientName}>
                                                                            <div className="event-time">{t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(t.getTime()+3600*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                                            <div className="event-main">{findPersonShortName(patients, ps.patientId)}</div>
                                                                        </div>
                                                                    )) : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                                {/* show patient availabilities for this week-day (hourly) - only in booking mode */}
                                                {bookingMode && (() => {
                                                    // only render patient-only slots (exclude times already shown with interns in this day column)
                                                    const internSlotsForDay = buildHourlySlotsForDate(d).map(s => s.start.getTime());
                                                    let pSlots = buildHourlyPatientSlotsForDate(d) || [];
                                                    pSlots = pSlots.filter(ps => !internSlotsForDay.includes(ps.start.getTime()));
                                                    if (!pSlots || pSlots.length === 0) return null;
                                                    return pSlots.map(ps => (
                                                        <div key={`pavw-${ps.parentId}-${ps.start.toISOString()}`} className={`day-availability-item availability-patient compact${bookingMode && form.patient && String(ps.patientId) === String(form.patient) ? ' slot-match' : ''}`} title={ps.patientName} style={{marginTop:6}}>
                                                            <div className="event-time">{ps.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {ps.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                                            <div className="event-main">{findPersonShortName(patients, ps.patientId)}</div>
                                                        </div>
                                                    ));
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
                                        <Select
                                            styles={customSelectStyles}
                                            options={patientOptions}
                                            value={patientOptions.find(o => o.value === String(form.patient)) || null}
                                            onChange={(opt:any) => setForm({...form, patient: opt ? String(opt.value) : ''})}
                                            placeholder="Selecione"
                                            isClearable
                                        />
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
                                        <th>Ações</th>
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
                                                <td>
                                                    <button className="btn btn-danger" onClick={async (e)=>{ e.stopPropagation(); if(!confirm('Excluir agendamento?')) return; await handleDeleteSchedule(s.id); }}>Excluir</button>
                                                </td>
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
