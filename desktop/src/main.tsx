import { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { create } from 'zustand'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { sendNotification } from '@tauri-apps/plugin-notification'
import { getVersion } from '@tauri-apps/api/app'
import './style.css'

interface AppState {
  serverUrl: string
  token: string | null
  username: string | null
  theme: 'light' | 'dark'
  setServerUrl: (url: string) => void
  setAuth: (token: string, username: string) => void
  clearAuth: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

const useAppStore = create<AppState>((set) => ({
  serverUrl: 'https://api.vamare.pl',
  token: null,
  username: null,
  theme: (typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null) as 'light' | 'dark' || 'light',
  setServerUrl: (serverUrl) => set({ serverUrl }),
  setAuth: (token, username) => set({ token, username }),
  clearAuth: () => set({ token: null, username: null }),
  setTheme: (theme) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('theme', theme)
    set({ theme })
  },
}))

const NOTE_COLORS = ['#f3e8ff', '#fce7f3', '#fef3c7', '#dcfce7', '#cffafe', '#e0e7ff', '#f5f3ff']
const NOTE_COLOR_NAMES = ['Purpura', 'Różowy', 'Żółty', 'Zielony', 'Cyjan', 'Indygo', 'Biały']

interface Note {
  id: string
  title: string
  content: string
  color?: string
  tags?: string
  archived?: boolean
  updated_at: string
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time?: string | null
  end_time?: string | null
  is_all_day?: boolean
  event_date?: string
  reminder_minutes?: string
  updated_at: string
}

function App() {
  const { serverUrl, setServerUrl, token, username, setAuth, clearAuth, theme, setTheme } = useAppStore()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'notes' | 'calendar' | 'settings'>('notes')
  const [notes, setNotes] = useState<Note[]>([])
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [calendarChoice, setCalendarChoice] = useState('praca')
  const [viewDate, setViewDate] = useState<Date>(() => new Date())
  const [appVersion, setAppVersion] = useState<string>('...')
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    isAllDay: false,
    eventDate: '',
    startTime: '',
    endTime: '',
    reminders: [] as number[]
  })
  const [latestVersion, setLatestVersion] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const selectedNote = notes.find(n => n.id === selectedNoteId)

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion('unknown'))
  }, [])

  useEffect(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('serverUrl') : null
    if (saved) setServerUrl(saved)
  }, [setServerUrl])

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('serverUrl', serverUrl)
  }, [serverUrl])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    // Sprawdzaj dostępną wersję co minutę
    const checkLatestVersion = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/version-info`)
        setLatestVersion(res.data.latest_version)
        setDownloadUrl(res.data.download_url)
      } catch (err) {
        console.error('Error checking latest version:', err)
      }
    }
    
    checkLatestVersion()
    const interval = setInterval(checkLatestVersion, 60000) // Co minutę
    return () => clearInterval(interval)
  }, [serverUrl])

  useEffect(() => {
    if (token) {
      fetchNotes()
      fetchArchivedNotes()
      fetchEvents()
    }
    return () => {
      wsRef.current?.close()
    }
  }, [token])

  useEffect(() => {
    if (token && selectedNoteId) {
      connectWebSocket()
    }
  }, [token, selectedNoteId])

  function connectWebSocket() {
    if (!token || !selectedNoteId) return
    
    const wsUrl = serverUrl.replace('https://', 'wss://').replace('http://', 'ws://')
    const ws = new WebSocket(`${wsUrl}/ws/notes/${selectedNoteId}?token=${token}`)
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'note_updated') {
          setNotes(prev => prev.map(n => 
            n.id === data.id ? { ...n, title: data.title, content: data.content, updated_at: data.updated_at } : n
          ))
        } else if (data.type === 'note_deleted') {
          setNotes(prev => prev.filter(n => n.id !== data.id))
          setSelectedNoteId(null)
        }
      } catch (err) {
        console.error('WS parse error:', err)
      }
    }
    
    ws.onerror = (err) => console.error('WS error:', err)
    wsRef.current = ws
  }

  useEffect(() => {
    if (activeTab === 'calendar' && events.length > 0) {
      const interval = setInterval(checkUpcomingReminders, 30000) // Check every 30 seconds
      return () => clearInterval(interval)
    }
  }, [activeTab, events])

  async function fetchNotes() {
    try {
      const res = await axios.get(`${serverUrl}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const sorted = (res.data as Note[]).sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      setNotes(sorted)
    } catch (err) {
      console.error('Błąd pobierania notatek:', err)
    }
  }

  async function fetchArchivedNotes() {
    try {
      const res = await axios.get(`${serverUrl}/notes/archived`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const sorted = (res.data as Note[]).sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      setArchivedNotes(sorted)
    } catch (err) {
      console.error('Błąd pobierania archiwizowanych notatek:', err)
    }
  }

  async function fetchEvents() {
    try {
      const res = await axios.get(`${serverUrl}/calendar`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEvents(res.data as CalendarEvent[])
    } catch (err) {
      console.error('Błąd pobierania wydarzeń:', err)
    }
  }

  function checkUpcomingReminders() {
    const now = new Date()
    events.forEach(event => {
      if (!event.reminder_minutes) return
      
      const reminders = event.reminder_minutes.split(',').map(r => parseInt(r.trim()))
      const eventTime = event.is_all_day 
        ? new Date(event.event_date + 'T09:00:00').getTime()
        : new Date(event.start_time || '').getTime()
      
      reminders.forEach(minutes => {
        const reminderTime = eventTime - (minutes * 60000)
        const timeDiff = reminderTime - now.getTime()
        
        // Show notification if within 30 seconds of reminder time
        if (timeDiff > 0 && timeDiff < 30000) {
          sendNotification({
            title: 'Przypomnienie',
            body: `Zbliża się: ${event.title}`,
          })
        }
      })
    })
  }

  async function updateNote(id: string, updates: Partial<Note>) {
    try {
      await axios.patch(`${serverUrl}/notes/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotes()
      fetchArchivedNotes()
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  async function createNote(title: string, content: string) {
    if (!title) return
    if (!token) {
      setStatus('Błąd: Nie jesteś zalogowany')
      return
    }
    try {
      const res = await axios.post(`${serverUrl}/notes`, { title, content }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotes([res.data, ...notes])
      setSelectedNoteId(res.data.id)
      setStatus('Notatka dodana')
      setTimeout(() => setStatus(''), 2000)
    } catch (err: any) {
      console.error('createNote error:', err)
      setStatus(`Błąd przy dodawaniu: ${err.response?.data?.detail || err.message}`)
    }
  }

  async function deleteNote(id: string) {
    try {
      await axios.delete(`${serverUrl}/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotes(notes.filter(n => n.id !== id))
      setSelectedNoteId(null)
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  async function duplicateNote(note: Note) {
    await createNote(`${note.title} (kopia)`, note.content)
  }

  async function createEvent() {
    if (!eventForm.title) return
    if (!eventForm.isAllDay && (!eventForm.startTime || !eventForm.endTime)) return
    if (eventForm.isAllDay && !eventForm.eventDate) return

    try {
      const payload: any = {
        title: eventForm.title,
        description: eventForm.description,
        is_all_day: eventForm.isAllDay,
      }

      if (eventForm.isAllDay) {
        payload.event_date = eventForm.eventDate
        payload.start_time = null
        payload.end_time = null
      } else {
        payload.start_time = eventForm.startTime
        payload.end_time = eventForm.endTime
        payload.event_date = null
      }

      if (eventForm.reminders.length > 0) {
        payload.reminder_minutes = eventForm.reminders.join(',')
      }

      const res = await axios.post(`${serverUrl}/calendar`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEvents([...events, res.data])
      setEventForm({
        title: '',
        description: '',
        isAllDay: false,
        eventDate: '',
        startTime: '',
        endTime: '',
        reminders: []
      })
      setStatus('Wydarzenie dodane!')
      setTimeout(() => setStatus(''), 2000)
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  async function deleteEvent(id: string) {
    try {
      await axios.delete(`${serverUrl}/calendar/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEvents(events.filter(e => e.id !== id))
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  const displayedNotes = showArchived ? archivedNotes : notes
  const filteredNotes = displayedNotes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedNotes = groupNotesByDate(filteredNotes)

  function groupNotesByDate(noteList: Note[]): { label: string; notes: Note[] }[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const groups: { [key: string]: Note[] } = {
      'Dziś': [],
      'Wczoraj': [],
      'Starsze': []
    }

    noteList.forEach(note => {
      const noteDate = new Date(note.updated_at)
      noteDate.setHours(0, 0, 0, 0)

      if (noteDate.getTime() === today.getTime()) {
        groups['Dziś'].push(note)
      } else if (noteDate.getTime() === yesterday.getTime()) {
        groups['Wczoraj'].push(note)
      } else {
        groups['Starsze'].push(note)
      }
    })

    return Object.entries(groups)
      .filter(([_, notes]) => notes.length > 0)
      .map(([label, notes]) => ({ label, notes }))
  }

  const weekdayLabels = ['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie']

  function buildCalendarDays(current: Date) {
    const year = current.getFullYear()
    const month = current.getMonth()
    const first = new Date(year, month, 1)
    const offset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

    const dayCells: { date: Date; inMonth: boolean; events: CalendarEvent[] }[] = []
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - offset + 1
      const date = new Date(year, month, dayNum)
      const inMonth = dayNum >= 1 && dayNum <= daysInMonth
      const key = date.toISOString().slice(0, 10)
      const dayEvents = events.filter((ev) => (ev.start_time || '').slice(0, 10) === key)
      dayCells.push({ date, inMonth, events: dayEvents })
    }
    return dayCells
  }

  const calendarDays = buildCalendarDays(viewDate)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Logowanie...')
    try {
      const form = new URLSearchParams()
      form.set('username', loginForm.username)
      form.set('password', loginForm.password)
      const res = await axios.post(`${serverUrl}/auth/login`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      setAuth(res.data.access_token, loginForm.username)
      setStatus('Zalogowano')
      setLoginForm({ username: '', password: '' })
    } catch (err: any) {
      setStatus(`Błąd logowania: ${err.response?.data?.detail || err.message}`)
    }
  }

  async function handleRegister() {
    if (!loginForm.username || !loginForm.password) {
      setStatus('Podaj login i hasło')
      return
    }
    setStatus('Rejestracja...')
    try {
      await axios.post(`${serverUrl}/auth/register`, {
        username: loginForm.username,
        password: loginForm.password,
      })
      setStatus('Konto utworzone. Zaloguj się.')
    } catch (err: any) {
      setStatus(`Błąd: ${err.response?.data?.detail || err.message}`)
    }
  }

  async function checkForUpdates() {
    setStatus('Sprawdzanie aktualizacji...')
    try {
      console.log('Checking for updates from Tauri plugin...')
      const update = await check()
      console.log('Update response:', update)
      if (update) {
        console.log(`Update available: ${update.version}`)
        setStatus(`Dostępna wersja ${update.version}. Pobieranie...`)
        console.log('Starting download and install...')
        await update.downloadAndInstall()
        console.log('Download complete, relaunching...')
        await relaunch()
      } else {
        console.log('No update available')
        setStatus('Masz najnowszą wersję!')
        setTimeout(() => setStatus(''), 3000)
      }
    } catch (err: any) {
      console.error('Update check error:', err)
      console.error('Error details:', {
        message: err.message,
        name: err.name,
        code: err.code,
        stack: err.stack
      })
      // Obsługa błędu pustego URL (gdy serwer zwraca "" dla aktualnej wersji)
      if (err.message && err.message.includes('relative URL without a base')) {
        setStatus('Masz najnowszą wersję!')
        setTimeout(() => setStatus(''), 3000)
      } else {
        const errorMsg = err.message || err.toString() || 'Nieznany błąd'
        setStatus(`Błąd aktualizacji: ${errorMsg}`)
        setTimeout(() => setStatus(''), 5000)
      }
    }
  }

  function downloadManually() {
    // Otwórz bezpośrednio najnowszy build
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    } else {
      window.open('https://api.vamare.pl/api/updates/download/notes-desktop_0.3.3_x86_64-pc-windows-msvc.msi.zip', '_blank')
    }
  }

  async function sendTestNotif() {
    try {
      sendNotification({
        title: 'Test powiadomienia',
        body: 'Powiadomienia działają poprawnie! 🎉',
      })
    } catch (err) {
      console.error('Notif error:', err)
    }
  }

  if (!token) {
    return (
      <div className="app" data-theme={theme}>
        <header className="header-login">
          <div>
            <h1>📋 Notes & Calendar</h1>
            <p>Zarządzaj notatkami i kalendarzem w jednym miejscu</p>
          </div>
        </header>

        <div className="login-container">
          <div className="login-card">
            <h2>Logowanie</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Login"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              />
              <input
                type="password"
                placeholder="Hasło"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
              <button type="submit">Zaloguj</button>
              <button type="button" className="btn-secondary" onClick={handleRegister}>
                Zarejestruj
              </button>
            </form>
            {status && <div className="status">{status}</div>}
          </div>

          <div className="config-card">
            <h3>Konfiguracja serwera</h3>
            <input
              type="text"
              placeholder="Adres API (https://api.vamare.pl)"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app" data-theme={theme}>
      <header className="header-main">
        <div className="header-title">
          <h1>📋 Notes & Calendar</h1>
        </div>
        <nav className="nav-tabs">
          <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>
            📝 Notatki
          </button>
          <button className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>
            📅 Kalendarz
          </button>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
            ⚙️ Ustawienia
          </button>
        </nav>
        <div className="header-actions">
          <button className="btn-theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span className="user-badge">{username}</span>
          <button className="btn-logout" onClick={clearAuth}>Wyloguj</button>
        </div>
      </header>

      {activeTab === 'notes' && (
        <div className="layout-split">
          <aside className="sidebar-notes">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Szukaj notatek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn-new" onClick={() => createNote('Nowa notatka', '')}>
                ➕ Dodaj
              </button>
              <button 
                className={`btn-toggle ${showArchived ? 'active' : ''}`}
                onClick={() => setShowArchived(!showArchived)}
                title={showArchived ? 'Pokaż aktywne' : 'Pokaż archiwizowane'}
              >
                {showArchived ? '📂 Archiwum' : '📝 Aktywne'}
              </button>
            </div>

            <div className="notes-list">
              {groupedNotes.map(({ label, notes: groupNotes }) => (
                <div key={label}>
                  <div className="notes-group-header">{label}</div>
                  {groupNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`note-item ${selectedNoteId === note.id ? 'selected' : ''}`}
                      style={{ borderLeftColor: note.color || '#e5e7eb' }}
                      onClick={() => setSelectedNoteId(note.id)}
                    >
                      <div className="note-title">{note.title}</div>
                      <div className="note-preview">{note.content.slice(0, 50)}...</div>
                      <div className="note-time">{new Date(note.updated_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <main className="content-notes">
            {selectedNote ? (
              <div className="note-editor">
                <div className="note-header">
                  <input
                    type="text"
                    className="note-title-input"
                    value={selectedNote.title}
                    onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                  />
                  <div className="note-actions">
                    <select
                      value={selectedNote.color || NOTE_COLORS[6]}
                      onChange={(e) => updateNote(selectedNote.id, { color: e.target.value })}
                      className="color-picker"
                    >
                      {NOTE_COLORS.map((color, i) => (
                        <option key={color} value={color}>{NOTE_COLOR_NAMES[i]}</option>
                      ))}
                    </select>
                    <button 
                      className="btn-icon" 
                      title={selectedNote.archived ? "Przywróć" : "Archiwizuj"} 
                      onClick={() => updateNote(selectedNote.id, { archived: !selectedNote.archived })}
                    >
                      {selectedNote.archived ? '📂' : '📦'}
                    </button>
                    <button className="btn-icon" onClick={() => duplicateNote(selectedNote)} title="Duplikuj">
                      📋
                    </button>
                    <button className="btn-icon btn-danger" onClick={() => deleteNote(selectedNote.id)} title="Usuń">
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="note-tags">
                  <input
                    type="text"
                    placeholder="Tagi (oddzielone przecinkami)"
                    value={selectedNote.tags || ''}
                    onChange={(e) => updateNote(selectedNote.id, { tags: e.target.value })}
                    className="tags-input"
                  />
                  {selectedNote.tags && selectedNote.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="tag-pill">{tag.trim()}</span>
                  ))}
                </div>
                <textarea
                  className="note-content-input"
                  value={selectedNote.content}
                  onChange={(e) => updateNote(selectedNote.id, { content: e.target.value })}
                  placeholder="Twoja notatka..."
                />
                <div className="note-meta">
                  Ostatnia edycja: {new Date(selectedNote.updated_at).toLocaleString('pl-PL')}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <p>Wybierz notatkę lub stwórz nową</p>
              </div>
            )}
          </main>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="layout-split">
          <aside className="sidebar-calendar">
            <div className="calendar-choice">
              <label>Kalendarz:</label>
              <select value={calendarChoice} onChange={(e) => setCalendarChoice(e.target.value)}>
                <option value="praca">Praca</option>
                <option value="dom">Dom</option>
              </select>
            </div>

            <div className="event-form">
              <h3>Dodaj wydarzenie</h3>
              <input 
                type="text" 
                placeholder="Tytuł" 
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Opis" 
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
              />
              
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={eventForm.isAllDay}
                  onChange={(e) => setEventForm({...eventForm, isAllDay: e.target.checked})}
                />
                Wydarzenie na cały dzień
              </label>

              {eventForm.isAllDay ? (
                <input 
                  type="date" 
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm({...eventForm, eventDate: e.target.value})}
                />
              ) : (
                <>
                  <input 
                    type="datetime-local" 
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({...eventForm, startTime: e.target.value})}
                    placeholder="Data i czas rozpoczęcia"
                  />
                  <input 
                    type="datetime-local" 
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({...eventForm, endTime: e.target.value})}
                    placeholder="Data i czas zakończenia"
                  />
                </>
              )}

              <label>Przypomnienia (w minutach):</label>
              <div className="reminder-checkboxes">
                {[15, 60, 1440].map(mins => (
                  <label key={mins} className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={eventForm.reminders.includes(mins)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEventForm({...eventForm, reminders: [...eventForm.reminders, mins]})
                        } else {
                          setEventForm({...eventForm, reminders: eventForm.reminders.filter(r => r !== mins)})
                        }
                      }}
                    />
                    {mins === 15 ? '15 minut' : mins === 60 ? '1 godzina' : '1 dzień'}
                  </label>
                ))}
              </div>

              <button onClick={createEvent}>Dodaj</button>
            </div>
          </aside>

          <main className="content-calendar">
            <div className="calendar-header">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                ◀ Poprzedni
              </button>
              <h2>{viewDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                Następny ▶
              </button>
              <button onClick={() => setViewDate(new Date())} style={{ marginLeft: 'auto' }}>
                Dziś
              </button>
            </div>

            <div className="calendar-grid-header">
              {weekdayLabels.map((day) => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarDays.map((cell, idx) => {
                const isToday = cell.date.toDateString() === new Date().toDateString()
                return (
                  <div
                    key={idx}
                    className={`calendar-day ${!cell.inMonth ? 'muted' : ''} ${isToday ? 'today' : ''}`}
                  >
                    <div className="day-num">{cell.date.getDate()}</div>
                    <div className="day-events">
                      {cell.events.map((ev) => (
                        <div key={ev.id} className="event-item">
                          <div className="event-time">
                            {new Date(ev.start_time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="event-title">{ev.title}</div>
                          <button className="event-delete" onClick={() => deleteEvent(ev.id)}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="settings-container">
          <section className="settings-card">
            <h2>Aplikacja</h2>
            <div className="setting-row">
              <span>Wersja: {appVersion}</span>
              <button onClick={checkForUpdates}>Sprawdź aktualizację</button>
            </div>
            {latestVersion && appVersion !== latestVersion && appVersion !== '...' && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
                <p style={{ marginBottom: '8px', fontSize: '13px' }}>📥 Dostępna jest nowa wersja {latestVersion}!</p>
                <button 
                  onClick={downloadManually}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#fbbf24', 
                    color: '#78350f',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ⬇️ Pobierz i zainstaluj teraz
                </button>
              </div>
            )}
            {status && <div className="status">{status}</div>}
          </section>

          <section className="settings-card">
            <h2>Powiadomienia</h2>
            <p>Powiadomienia będą wyskakiwać dla zbliżających się zdarzeń z kalendarza.</p>
            <button onClick={sendTestNotif}>📢 Test powiadomienia</button>
          </section>

          <section className="settings-card">
            <h2>Serwer</h2>
            <div className="setting-row">
              <label>Adres API:</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </section>

          <section className="settings-card">
            <h2>Konto</h2>
            <div className="setting-row">
              <span>Zalogowany jako: <strong>{username}</strong></span>
              <button className="btn-danger" onClick={clearAuth}>Wyloguj</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
