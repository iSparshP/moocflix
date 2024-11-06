# Base image - using Node.js 18 LTS
FROM node:18.19-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY .npmrc ./

# Clean install dependencies and force resolution of peer dependencies
RUN npm install --legacy-peer-deps

# Bundle app source
COPY . .

# Expose port
EXPOSE 3007

# Start command
CMD ["npm", "start"]