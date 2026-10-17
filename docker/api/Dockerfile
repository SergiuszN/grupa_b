# syntax=docker/dockerfile:1

FROM golang:1.27-alpine
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

# Kod montowany jako wolumen w docker-compose, uruchamiany przez go run
COPY . .
ENV PORT=8080
EXPOSE 8080
CMD ["go", "run", "./cmd/api"]
