FROM node:14

WORKDIR /app

COPY package*.json ./
COPY . .

# https://burnedikt.com/docker-node-install-npm-packages-from-github/
RUN npm ci --only=production --unsafe-perm

CMD [ "scripts/start.sh" ]
