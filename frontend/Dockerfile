FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy rest of the source code
COPY . .

# Build production assets
RUN npm run build

# Use a smaller web server image to serve the built files
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]