package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
)

//go:embed frontend/dist/*
var frontendDist embed.FS

func main() {
	academy := NewAcademy()

	// API routes
	http.HandleFunc("/api/robots", academy.HandleRobots)
	http.HandleFunc("/api/robots/spawn", academy.HandleSpawnRobot)
	http.HandleFunc("/api/academy", academy.HandleAcademy)
	http.HandleFunc("/api/signals", academy.HandleSignals)

	// Serve frontend
	distFS, err := fs.Sub(frontendDist, "frontend/dist")
	if err != nil {
		log.Fatal(err)
	}
	http.Handle("/", http.FileServer(http.FS(distFS)))

	port := 3210
	fmt.Printf("\n  ╔══════════════════════════════════════╗\n")
	fmt.Printf("  ║         A X i o m                    ║\n")
	fmt.Printf("  ║    Agents build their antennas.      ║\n")
	fmt.Printf("  ╠══════════════════════════════════════╣\n")
	fmt.Printf("  ║  → http://localhost:%d              ║\n", port)
	fmt.Printf("  ╚══════════════════════════════════════╝\n\n")

	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), nil))
}
