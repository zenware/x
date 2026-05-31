.PHONY: dev build test run clean

dev:
	air

build:
	go build -o bin/forge ./cmd/forge

test:
	go test ./...

run:
	go run ./cmd/forge

clean:
	rm -rf bin/ data/
