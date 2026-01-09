# ✅ CHECKLIST - Budowanie i dystrybucja aplikacji .exe

Wydrukuj i zaznaczaj po kolei! ✓

---

## 📋 CZĘŚĆ 1: Przygotowanie środowiska Windows (jednorazowo)

- [ ] Zainstalowano Node.js (https://nodejs.org/)
- [ ] Zrestartowano CMD/PowerShell po instalacji Node.js
- [ ] Sprawdzono: `node --version` działa
- [ ] Zainstalowano Rust (https://rustup.rs/)
- [ ] Zrestartowano CMD/PowerShell po instalacji Rust
- [ ] Sprawdzono: `rustc --version` działa
- [ ] Zainstalowano Visual Studio Build Tools
- [ ] Sprawdzono czy Windows ma WebView2 (Windows 10/11 zwykle ma)

**💾 Środowisko gotowe! (to się robi tylko raz)**

---

## 📋 CZĘŚĆ 2: Konfiguracja projektu

- [ ] Skopiowano folder `/opt/notesapp/desktop` na Windows
- [ ] Otwarto folder w CMD/PowerShell
- [ ] Edytowano `src/main.tsx` - ustawiono adres serwera API (linia ~13)
- [ ] (Opcjonalnie) Edytowano `src-tauri/tauri.conf.json` - zmieniono nazwę
- [ ] (Opcjonalnie) Skonfigurowano auto-update w `tauri.conf.json`

**⚙️ Konfiguracja gotowa!**

---

## 📋 CZĘŚĆ 3: Budowanie instalatora

- [ ] Otwarto CMD/PowerShell w folderze projektu
- [ ] Uruchomiono: `build-windows.bat` (lub `npm install`)
- [ ] Poczekano na instalację zależności (~5 min)
- [ ] Uruchomiono build (jeśli nie używa się .bat): `npm run tauri:build`
- [ ] Poczekano na build (~10-20 min przy pierwszym razie)
- [ ] Build zakończył się sukcesem (brak błędów)
- [ ] Sprawdzono folder: `src-tauri\target\release\bundle\`
- [ ] Znaleziono pliki: `.msi` w folderze `msi\`
- [ ] Znaleziono pliki: `.exe` w folderze `nsis\`

**🎉 Instalator gotowy!**

---

## 📋 CZĘŚĆ 4: Testowanie

- [ ] Skopiowano instalator na komputer testowy (lub ten sam)
- [ ] Uruchomiono instalator
- [ ] Zainstalowano aplikację
- [ ] Uruchomiono aplikację z Menu Start
- [ ] Pokazał się interfejs logowania
- [ ] Wpisano adres serwera API (jeśli trzeba)
- [ ] Zalogowano się testowym kontem
- [ ] Sprawdzono czy notatki działają
- [ ] Sprawdzono czy kalendarz działa
- [ ] Sprawdzono panel uprawnień
- [ ] Przetestowano powiadomienia

**✅ Aplikacja działa!**

---

## 📋 CZĘŚĆ 5: Przygotowanie dla klientów

- [ ] Skopiowano plik instalatora (.msi lub .exe)
- [ ] Nazwano plik czytelnie (np. `NotesApp-Installer.exe`)
- [ ] Skopiowano `INSTRUKCJA_DLA_UZYTKOWNIKA.md`
- [ ] Przygotowano adres serwera dla klientów
- [ ] Przygotowano dane logowania dla klientów (lub sposób rejestracji)
- [ ] (Opcjonalnie) Spakowano wszystko do ZIP
- [ ] (Opcjonalnie) Przygotowano email/wiadomość dla klientów

**📤 Pakiet dystrybucyjny gotowy!**

---

## 📋 CZĘŚĆ 6: Wysyłka do klientów

- [ ] Wysłano instalator klientom (email/link/pendrive)
- [ ] Wysłano instrukcję użytkownika
- [ ] Przekazano adres serwera API
- [ ] Przekazano dane logowania
- [ ] Poinformowano jak zainstalować (podwójne kliknięcie)
- [ ] Poinformowano o ostrzeżeniu SmartScreen (jeśli wystąpi)
- [ ] Dostępny kontakt w razie problemów

**🚀 Dystrybucja zakończona!**

---

## 📋 CZĘŚĆ 7: Wsparcie (po wysłaniu)

- [ ] Klient odebrał instalator
- [ ] Klient zainstalował aplikację
- [ ] Klient uruchomił aplikację
- [ ] Klient zalogował się pomyślnie
- [ ] Klient przetestował podstawowe funkcje
- [ ] Rozwiązano ewentualne problemy
- [ ] Klient potwierdził że wszystko działa

**🎯 Sukces! Klient korzysta z aplikacji!**

---

## 🔄 PRZY NASTĘPNYCH WERSJACH (aktualizacje)

- [ ] Zwiększono numer wersji w `package.json`
- [ ] Zwiększono numer wersji w `tauri.conf.json`
- [ ] Zbudowano nową wersję (`npm run tauri:build`)
- [ ] (Jeśli auto-update) Skopiowano `.nsis.zip` i `.sig` na serwer
- [ ] (Jeśli auto-update) Zaktualizowano `/opt/notesapp/updates/latest.json`
- [ ] (Jeśli bez auto-update) Wysłano nowy instalator klientom

---

## 📞 W razie problemów:

**Błędy podczas instalacji wymagań?**
→ Zobacz BUILD_INSTRUCTIONS.md sekcja "Rozwiązywanie problemów"

**Błędy podczas buildu?**
→ Sprawdź czy wszystkie wymagania są zainstalowane
→ Zrestartuj CMD/PowerShell
→ Sprawdź logi błędów

**Klient ma problemy z instalacją?**
→ Zobacz DISTRIBUTION.md sekcja "Pomoc dla klientów"

**Problemy z połączeniem?**
→ Sprawdź adres serwera
→ Sprawdź firewall/port forwarding
→ Sprawdź czy backend działa

---

**Data buildu:** _______________
**Wersja:** _______________
**Uwagi:** _______________________________________________________________
