module github.com/1rate/diplom/services/indexer

go 1.23

require (
	github.com/nats-io/nats.go v1.37.0
	github.com/1rate/diplom/pkg v0.0.0-00010101000000-000000000000
)

require (
	github.com/klauspost/compress v1.17.9 // indirect
	github.com/nats-io/nkeys v0.4.7 // indirect
	github.com/nats-io/nuid v1.0.1 // indirect
	golang.org/x/crypto v0.31.0 // indirect
	golang.org/x/sys v0.28.0 // indirect
	golang.org/x/text v0.21.0 // indirect
)

replace github.com/1rate/diplom/pkg => ../../pkg
