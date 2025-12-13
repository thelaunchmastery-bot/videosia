FROM node:18-slim

# Instalar ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Crear directorio de la app
WORKDIR /app

# Copiar archivos
COPY package.json ./
RUN npm install

COPY . .

# Puerto
EXPOSE 3000

# Arrancar servidor
CMD ["npm", "start"]
