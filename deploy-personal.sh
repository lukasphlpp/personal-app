#!/bin/bash

###############################################################################
# Personal App Deployment Script
# Deployt die Next.js Personal-App auf personal.philipp-dev.app
###############################################################################

set -e

DOMAIN="personal.philipp-dev.app"
APP_NAME="personal"
APP_DIR="/var/www/$APP_NAME"
DB_NAME="personal_db"
DB_USER="webuser"
DB_PASSWORD="change_this_password_123"  # WICHTIG: Ändern!

echo "=================================="
echo "🚀 Deploying Personal App"
echo "=================================="

# 1. PostgreSQL Datenbank erstellen
echo "📦 Erstelle Datenbank..."
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || echo "Datenbank existiert bereits"

# 2. App-Verzeichnis erstellen
echo "📁 Erstelle App-Verzeichnis..."
mkdir -p $APP_DIR
cd $APP_DIR

# 3. Git Repository klonen (falls noch nicht vorhanden)
if [ ! -d ".git" ]; then
    echo "📥 Klone Repository..."
    # Placeholder - wird später durch echtes Repo ersetzt
    echo "Repository wird manuell hochgeladen..."
fi

# 4. .env Datei erstellen
echo "🔐 Erstelle .env Datei..."
cat > $APP_DIR/.env << EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://$DOMAIN"
NODE_ENV="production"
EOF

# 5. Dependencies installieren (wird später gemacht wenn Code da ist)
echo "📦 Dependencies werden installiert sobald Code hochgeladen ist..."

# 6. Nginx Konfiguration
echo "🌐 Konfiguriere Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name personal.philipp-dev.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# Nginx Site aktivieren
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

# 7. SSL-Zertifikat einrichten
echo "🔒 Richte SSL-Zertifikat ein..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo ""
echo "=================================="
echo "✅ Deployment-Vorbereitung abgeschlossen!"
echo "=================================="
echo ""
echo "📋 Nächste Schritte:"
echo "1. Code nach $APP_DIR hochladen"
echo "2. npm install ausführen"
echo "3. npm run build ausführen"
echo "4. npx prisma db push ausführen"
echo "5. PM2 starten: pm2 start npm --name $APP_NAME -- start"
echo ""
echo "🌐 Domain: https://$DOMAIN"
echo "📁 App-Verzeichnis: $APP_DIR"
echo "🗄️  Datenbank: $DB_NAME"
echo ""
