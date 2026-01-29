# On utilise une image Node.js stable
FROM node:20

# Dossier de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de configuration
COPY package*.json ./

# Installation des dépendances (Koyeb le fera proprement ici)
RUN npm install

# Copie de tout le reste du code (y compris le dossier web)
COPY . .

# Exposition du port (le port 8000 que tu as choisi)
EXPOSE 8000

# Commande pour lancer ton bot
CMD ["node", "web/server.js"]
