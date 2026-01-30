FROM node:20

# Installation des outils système pour le traitement média
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    && apt-get clean

WORKDIR /usr/src/app

# Copie et installation des dépendances
COPY package.json ./
RUN npm install

# Copie du reste du code source
COPY . .

# Lancement du bot
CMD ["node", "index.js"]
