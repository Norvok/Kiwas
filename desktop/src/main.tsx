import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { create } from 'zustand'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import './style.css'

// Simple global store for auth and settings
interface AppState {
  serverUrl: string
  token: string | null
  username: string | null
  panels: string[]
  setServerUrl: (url: string) => void
  setAuth: (token: string, username: string) => void
  clearAuth: () => void
  setPanels: (panels: string[]) => void
}

const useAppStore = create<AppState>((set) => ({
  serverUrl: 'http://api.vamare.pl',
  token: null,
  username: null,
  panels: [],
  setServerUrl: (serverUrl) => set({ serverUrl }),
  setAuth: (token, username) => set({ token, username }),
  clearAuth: () => set({ token: null, username: null }),
  setPanels: (panels) => set({ panels }),
}))

// Minimal role representation for UI; real ACL should be served by API
const PANEL_OPTIONS = ['praca', 'dom']
const PERM_TYPES = ['kalendarz', 'notatki']

function App() {
  const { serverUrl, setServerUrl, token, username, setAuth, clearAuth } = useAppStore()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'notes' | 'calendar' | 'settings'>('notes')
  const [notes, setNotes] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [noteForm, setNoteForm] = useState({ title: '', content: '' })
  const [eventForm, setEventForm] = useState({ title: '', description: '', start_time: '', end_time: '' })
  const [panelsState, setPanelsState] = useState<Record<string, Record<string, { view: boolean; edit: boolean }>>>(() => ({
    praca: {
      kalendarz: { view: true, edit: true },
      notatki: { view: true, edit: true },
    },
    dom: {
      kalendarz: { view: true, edit: false },
      notatki: { view: true, edit: false },
    },
  }))

  useEffect(() => {
    // restore last server URL
    const saved = localStorage.getItem('serverUrl')
    if (saved) setServerUrl(saved)
  }, [setServerUrl])

  useEffect(() => {
    localStorage.setItem('serverUrl', serverUrl)
  }, [serverUrl])

  useEffect(() => {
    if (token) {
      fetchNotes()
      fetchEvents()
    }
  }, [token])

  async function fetchNotes() {
    try {
      const res = await axios.get(`${serverUrl}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotes(res.data)
    } catch (err) {
      console.error('Błąd pobierania notatek:', err)
    }
  }

  async function fetchEvents() {
    try {
      const res = await axios.get(`${serverUrl}/calendar`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEvents(res.data)
    } catch (err) {
      console.error('Błąd pobierania wydarzeń:', err)
    }
  }

  async function createNote() {
    if (!noteForm.title) return
    try {
      await axios.post(`${serverUrl}/notes`, noteForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNoteForm({ title: '', content: '' })
      fetchNotes()
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  async function createEvent() {
    if (!eventForm.title || !eventForm.start_time || !eventForm.end_time) return
    try {
      await axios.post(`${serverUrl}/calendar`, eventForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEventForm({ title: '', description: '', start_time: '', end_time: '' })
      fetchEvents()
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  async function deleteNote(id: string) {
    try {
      await axios.delete(`${serverUrl}/notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchNotes()
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  async function deleteEvent(id: string) {
    try {
      await axios.delete(`${serverUrl}/calendar/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchEvents()
    } catch (err: any) {
      setStatus(`Błąd: ${err.message}`)
    }
  }

  // Check for updates on app start
  useEffect(() => {
    async function checkForUpdates() {
      try {
        const update = await check()
        if (update) {
          console.log('Nowa wersja dostępna:', update.version)
          setStatus(`Dostępna aktualizacja v${update.version}. Pobieranie...`)
          await update.downloadAndInstall()
          await relaunch()
        }
      } catch (err) {
        console.warn('Błąd przy sprawdzaniu aktualizacji:', err)
      }
    }
    checkForUpdates()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Logowanie...')
    try {
      const form = new URLSearchParams()
      form.set('username', loginForm.username)
      form.set('password', loginForm.password)
      console.log('Wysyłam logowanie do:', `${serverUrl}/auth/login`)
      const res = await axios.post(`${serverUrl}/auth/login`, form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      console.log('Odebrano odpowiedź:', res.data)
      setAuth(res.data.access_token, loginForm.username)
      setStatus('Zalogowano')
      console.log('Stan zaktualizowany, token powinien być ustawiony')
    } catch (err: any) {
      console.error('Błąd logowania:', err)
      setStatus(`Błąd logowania: ${err.message}`)
    }
  }

  async function handleRegister() {
    setStatus('Rejestracja...')
    try {
      await axios.post(`${serverUrl}/auth/register`, {
        username: loginForm.username,
        password: loginForm.password,
      })
      setStatus('Konto utworzone. Zaloguj się.')
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err.message
      setStatus(`Błąd rejestracji: ${detail}`)
    }
  }

  function toggle(panel: string, perm: string, field: 'view' | 'edit') {
    setPanelsState((prev) => ({
      ...prev,
      [panel]: {
        ...prev[panel],
        [perm]: { ...prev[panel][perm], [field]: !prev[panel][perm][field] },
      },
    }))
  }

  return (
    <div className="app">
      <header>
        <div>
          <h1>Notes & Calendar Desktop</h1>
          <p>Połącz z serwerem, zarządzaj dostępami, otrzymuj powiadomienia.</p>
        </div>
        <div className="server">
          <label>Adres API</label>
          <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
        </div>
      </header>

      {!token && (
        <section className="card">
          <h2>Logowanie</h2>
          <form className="form" onSubmit={handleLogin}>
            <label>
              Login
              <input
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              />
            </label>
            <label>
              Hasło
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              />
            </label>
            <div className="actions">
              <button type="submit">Zaloguj</button>
              <button type="button" className="ghost" onClick={handleRegister}>
                Zarejestruj
              </button>
            </div>
            <div className="status">{status}</div>
          </form>
        </section>
      )}

      {token && (
        <>
          <nav className="tabs">
            <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>Notatki</button>
            <button className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>Kalendarz</button>
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Ustawienia</button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge">{username}</span>
              <button onClick={clearAuth}>Wyloguj</button>
            </div>
          </nav>

          {activeTab === 'notes' && (
            <section className="card">
              <h2>Notatki</h2>
              <div className="form">
                <input
                  placeholder="Tytuł"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                />
                <textarea
                  placeholder="Treść notatki"
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #334155', background: '#0f172a', color: '#e5e7eb' }}
                />
                <button onClick={createNote}>Dodaj notatkę</button>
              </div>
              <div style={{ marginTop: '20px' }}>
                {notes.map((note) => (
                  <div key={note.id} className="card soft" style={{ marginBottom: '12px' }}>
                    <div className="row space-between">
                      <h3>{note.title}</h3>
                      <button className="ghost" onClick={() => deleteNote(note.id)}>Usuń</button>
                    </div>
                    <p style={{ color: '#9ca3af', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                    <small style={{ color: '#6b7280' }}>{new Date(note.updated_at).toLocaleString('pl-PL')}</small>
                  </div>
                ))}
                {notes.length === 0 && <p style={{ color: '#6b7280' }}>Brak notatek</p>}
              </div>
            </section>
          )}

          {activeTab === 'calendar' && (
            <section className="card">
              <h2>Kalendarz</h2>
              <div className="form">
                <input
                  placeholder="Tytuł wydarzenia"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                />
                <input
                  placeholder="Opis"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
                <input
                  type="datetime-local"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                />
                <input
                  type="datetime-local"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                />
                <button onClick={createEvent}>Dodaj wydarzenie</button>
              </div>
              <div style={{ marginTop: '20px' }}>
                {events.map((event) => (
                  <div key={event.id} className="card soft" style={{ marginBottom: '12px' }}>
                    <div className="row space-between">
                      <h3>{event.title}</h3>
                      <button className="ghost" onClick={() => deleteEvent(event.id)}>Usuń</button>
                    </div>
                    {event.description && <p style={{ color: '#9ca3af' }}>{event.description}</p>}
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      <div>Start: {new Date(event.start_time).toLocaleString('pl-PL')}</div>
                      <div>Koniec: {new Date(event.end_time).toLocaleString('pl-PL')}</div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && <p style={{ color: '#6b7280' }}>Brak wydarzeń</p>}
              </div>
            </section>
          )}

          {activeTab === 'settings' && (
            <>
          <section className="card">
            <div className="row space-between">
              <h2>Panel uprawnień</h2>
              <div>
                <span className="badge">{username}</span>
                <button onClick={clearAuth}>Wyloguj</button>
              </div>
            </div>
            <p>Przykładowa konfiguracja uprawnień na panelach (należy podłączyć do API ACL).</p>
            <div className="grid">
              {PANEL_OPTIONS.map((panel) => (
                <div className="card soft" key={panel}>
                  <h3>{panel}</h3>
                  {PERM_TYPES.map((perm) => (
                    <div key={perm} className="perm-row">
                      <div className="perm-title">{perm}</div>
                      <label>
                        <input
                          type="checkbox"
                          checked={panelsState[panel]?.[perm]?.view || false}
                          onChange={() => toggle(panel, perm, 'view')}
                        />
                        podgląd
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={panelsState[panel]?.[perm]?.edit || false}
                          onChange={() => toggle(panel, perm, 'edit')}
                        />
                        edycja
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="row end">
              <button className="ghost">Zapisz uprawnienia (TODO API)</button>
            </div>
          </section>

          <section className="card">
            <div className="row space-between">
              <h2>Powiadomienia</h2>
              <button className="ghost" onClick={requestNotify}>Sprawdź powiadomienie testowe</button>
            </div>
            <p>Powiadomienia będą wyzwalane z API (terminy wydarzeń), w aplikacji wyskakujące okno i dźwięk.</p>
          </section>
          </>
          )}
        </>
      )}
    </div>
  )
}

async function requestNotify() {
  try {
    // Tauri v2: notification API lives in the plugin package
    const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification')
    let allowed = await isPermissionGranted()
    if (!allowed) {
      const perm = await requestPermission()
      allowed = perm === 'granted'
    }
    if (allowed) {
      sendNotification({ title: 'Test', body: 'Powiadomienie działa 🎉' })
    }
  } catch (e) {
    console.error(e)
  }
}

createRoot(document.getElementById('root')!).render(<App />)
