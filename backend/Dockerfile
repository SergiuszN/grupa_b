# syntax=docker/dockerfile:1
# Build context: backend/ (Railway service root directory).

FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /out/api ./cmd/api

FROM alpine:3.22
RUN apk add --no-cache ca-certificates wget \
 && mkdir -p /data \
 && wget -qO /data/filharmonia.sqlite https://raw.githubusercontent.com/SergiuszN/grupa_b/main/data/filharmonia.sqlite
COPY --from=build /out/api /api
ENV DB_PATH=/data/filharmonia.sqlite
ENV PORT=8080
EXPOSE 8080
CMD ["/api"]
