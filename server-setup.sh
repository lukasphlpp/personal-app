#!/bin/bash

###############################################################################
# Hetzner Server Setup Script für Next.js + PostgreSQL
# Automatische Installation aller benötigten Komponenten
###############################################################################

set -e  # Exit on error

echo "=================================="
echo "🚀 Server Setup wird gestartet..."
echo "=================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion für farbige Ausgabe
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

###############################################################################
# 1. System Update
###############################################################################
print_info "System wird aktualisiert..."
apt-get update -y
apt-get upgrade -y
print_success "System aktualisiert"

###############################################################################
# 2. Basis-Pakete installieren
###############################################################################
print_info "Basis-Pakete werden installiert..."
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ufw \
    fail2ban \
    unzip \
    software-properties-common
print_success "Basis-Pakete installiert"

###############################################################################
# 3. Node.js 20 installieren
###############################################################################
print_info "Node.js 20 wird installiert..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version
print_success "Node.js installiert: $(node --version)"

###############################################################################
# 4. PostgreSQL 16 installieren
###############################################################################
print_info "PostgreSQL 16 wird installiert..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update -y
apt-get install -y postgresql-16 postgresql-contrib-16
systemctl enable postgresql
systemctl start postgresql
print_success "PostgreSQL installiert"

###############################################################################
# 5. Nginx installieren
###############################################################################
print_info "Nginx wird installiert..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx installiert"

###############################################################################
# 6. PM2 installieren (Process Manager)
###############################################################################
print_info "PM2 wird installiert..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
print_success "PM2 installiert"

###############################################################################
# 7. Certbot für SSL-Zertifikate
###############################################################################
print_info "Certbot wird installiert..."
apt-get install -y certbot python3-certbot-nginx
print_success "Certbot installiert"

###############################################################################
# 8. Firewall konfigurieren
###############################################################################
print_info "Firewall wird konfiguriert..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80/tcp
ufw allow 443/tcp
print_success "Firewall konfiguriert"

###############################################################################
# 9. Fail2Ban konfigurieren
###############################################################################
print_info "Fail2Ban wird konfiguriert..."
systemctl enable fail2ban
systemctl start fail2ban
print_success "Fail2Ban aktiviert"

###############################################################################
# 10. Verzeichnisse erstellen
###############################################################################
print_info "Projekt-Verzeichnisse werden erstellt..."
mkdir -p /var/www
mkdir -p /var/log/apps
print_success "Verzeichnisse erstellt"

###############################################################################
# 11. PostgreSQL Benutzer erstellen
###############################################################################
print_info "PostgreSQL Benutzer wird erstellt..."
sudo -u postgres psql -c "CREATE USER webuser WITH PASSWORD 'change_this_password_123';"
sudo -u postgres psql -c "ALTER USER webuser CREATEDB;"
print_success "PostgreSQL Benutzer 'webuser' erstellt"

###############################################################################
# 12. Automatische Updates konfigurieren
###############################################################################
print_info "Automatische Updates werden konfiguriert..."
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
print_success "Automatische Updates aktiviert"

###############################################################################
# FERTIG!
###############################################################################
echo ""
echo "=================================="
print_success "Server Setup abgeschlossen! 🎉"
echo "=================================="
echo ""
echo "📋 Installierte Software:"
echo "   - Node.js: $(node --version)"
echo "   - npm: $(npm --version)"
echo "   - PostgreSQL: $(sudo -u postgres psql --version | head -n1)"
echo "   - Nginx: $(nginx -v 2>&1)"
echo "   - PM2: $(pm2 --version)"
echo ""
echo "🔐 PostgreSQL Zugangsdaten:"
echo "   Benutzer: webuser"
echo "   Passwort: change_this_password_123"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""
echo "⚠️  WICHTIG: Ändere das PostgreSQL Passwort!"
echo "   sudo -u postgres psql"
echo "   ALTER USER webuser WITH PASSWORD 'dein_sicheres_passwort';"
echo ""
echo "📁 Projekt-Verzeichnisse:"
echo "   /var/www/ - Hier kommen deine Apps hin"
echo "   /var/log/apps/ - Logs deiner Apps"
echo ""
echo "🔥 Firewall Status:"
ufw status
echo ""
echo "🚀 Nächste Schritte:"
echo "   1. PostgreSQL Passwort ändern"
echo "   2. Domain konfigurieren"
echo "   3. Erste App deployen"
echo ""
