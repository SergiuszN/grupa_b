# syntax=docker/dockerfile:1
# Build context: repo root (COPY references backend/ and data/).

FROM golang:1.27-alpine AS build
WORKDIR /src
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 go build -trimpath -o /out/api ./cmd/api

FROM alpine:3.22
COPY --from=build /out/api /api
COPY data/filharmonia.sqlite /data/filharmonia.sqlite
ENV DB_PATH=/data/filharmonia.sqlite
ENV PORT=8080
EXPOSE 8080
CMD ["/api"]
