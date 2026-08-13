# nginx static host for the app under test (app/index.html).
FROM nginx:alpine

WORKDIR /usr/share/nginx/html
COPY app/ ./
