#!/bin/bash
# Skrypt pomocniczy do przygotowania buildu na Windows

echo "=========================================="
echo " Przygotowanie projektu do buildu"
echo "=========================================="
echo ""

# Pobierz adres serwera od użytkownika
read -p "Podaj domyślny adres serwera API (np. http://192.168.1.100:4000): " SERVER_URL

if [ -z "$SERVER_URL" ]; then
    echo "Błąd: Nie podano adresu serwera"
    exit 1
fi

echo "Aktualizuję konfigurację..."

# Zaktualizuj adres w main.tsx
sed -i "s|serverUrl: '[^']*'|serverUrl: '$SERVER_URL'|" src/main.tsx

echo ""
echo "✓ Zaktualizowano adres serwera na: $SERVER_URL"
echo ""
echo "Teraz skopiuj folder 'desktop' na komputer Windows i uruchom:"
echo "  build-windows.bat"
echo ""
echo "Lub ręcznie:"
echo "  npm install"
echo "  npm run tauri:build"
echo ""
