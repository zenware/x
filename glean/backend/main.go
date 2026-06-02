package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	addr := os.Getenv("ADDR")
	if addr == "" {
		port := os.Getenv("GLEAN_BACKEND_PORT")
		if port == "" {
			port = "8088"
		}
		addr = ":" + port
	}

	store := NewStore()
	server := NewServer(store)

	log.Printf("glean backend listening on %s", addr)
	if err := http.ListenAndServe(addr, server.Routes()); err != nil {
		log.Fatal(err)
	}
}
