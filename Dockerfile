# 1. Utilisation de Node.js 20 (LTS) sur une base Debian stable
FROM node:20-bookworm

# 2. Installation des dépendances système (Multimédia & Stickers)
# On combine les commandes pour réduire la taille de l'image
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    git \
    python3 \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 3. Création du dossier de travail
WORKDIR /usr/src/app

# 4. Copie du package.json et du package-lock.json (si présent)
# On le fait avant pour utiliser le cache Docker (Build plus rapide)
COPY package.json ./

# 5. Installation des modules Node.js
# On utilise 'npm install' pour construire les dépendances
RUN npm install

# 6. Copie de l'intégralité du code source
COPY . .

# 7. Exposition du port (Utile pour le dashboard Express ou Koyeb)
EXPOSE 8000

# 8. Commande de lancement du bot
CMD ["node", "index.js"]
