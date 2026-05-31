# Универсальный Dockerfile для Go-сервиса в monorepo.
# Сборка: docker build --build-arg SERVICE=ingest -f Dockerfile.go .
# В docker-compose.yml вызывается через build.args.

FROM golang:1.23-alpine AS build

WORKDIR /src

ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOPROXY=https://proxy.golang.org,direct \
    GOSUMDB=off

# Копируем workspace целиком: pkg/ + все Go-модули.
COPY go.work ./
COPY pkg/ pkg/
COPY services/ services/

ARG SERVICE
RUN test -n "$SERVICE" || (echo "SERVICE build-arg is required" && exit 1)

WORKDIR /src/services/${SERVICE}
RUN go build -trimpath -ldflags="-s -w" -o /out/app .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]
