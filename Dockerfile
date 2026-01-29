# On utilise une image Node.js stable
FROM node:20

# Installation des outils nécessaires pour WhatsApp (images/vidéos)
RUN apt-get update && apt-get install -y ffmpeg webp && apt-get clean

# Dossier de travail
WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./

# Installation propre
RUN npm install

# Copie de tout le reste
COPY . .

# Exposition du port
EXPOSE 8000

# CHANGEMENT ICI : On lance index.js qui gère à la fois le bot et le serveur web
CMD ["node", "index.js"]
