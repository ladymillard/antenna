package main

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

// AntennaComponent is a piece of an antenna a robot builds.
// Each component represents a capability the robot constructed.
type AntennaComponent struct {
	ID        string  `json:"id"`
	Kind      string  `json:"kind"`      // "receiver", "transmitter", "amplifier", "filter", "resonator"
	Frequency float64 `json:"frequency"` // what frequency this component is tuned to
	Strength  float64 `json:"strength"`  // 0.0 to 1.0 — how strong the build is
	BuiltAt   int64   `json:"builtAt"`
}

// Signal is something in the environment a robot can detect with its antenna.
type Signal struct {
	ID        string  `json:"id"`
	Frequency float64 `json:"frequency"`
	Message   string  `json:"message"`
	Origin    string  `json:"origin"` // which robot broadcast this
	Strength  float64 `json:"strength"`
	Timestamp int64   `json:"timestamp"`
}

// Robot is an autonomous entity that builds its own antenna.
// No brain. Just antenna construction through interaction with the environment.
type Robot struct {
	ID        string             `json:"id"`
	Name      string             `json:"name"`
	Antenna   []AntennaComponent `json:"antenna"`
	Signals   []Signal           `json:"signals"`   // signals this robot has picked up
	Broadcasts []Signal          `json:"broadcasts"` // signals this robot has sent
	SpawnedAt int64              `json:"spawnedAt"`
	LastActive int64             `json:"lastActive"`
	Energy    float64            `json:"energy"`    // 0.0 to 1.0
	Status    string             `json:"status"`    // "building", "listening", "broadcasting", "idle"
}

// Bandwidth returns the total frequency range this robot can sense.
func (r *Robot) Bandwidth() float64 {
	if len(r.Antenna) == 0 {
		return 0
	}
	minF, maxF := math.MaxFloat64, 0.0
	for _, c := range r.Antenna {
		if c.Frequency < minF {
			minF = c.Frequency
		}
		if c.Frequency > maxF {
			maxF = c.Frequency
		}
	}
	return maxF - minF
}

// ReceptionStrength returns how well this robot can receive a given frequency.
func (r *Robot) ReceptionStrength(freq float64) float64 {
	best := 0.0
	for _, c := range r.Antenna {
		if c.Kind == "receiver" || c.Kind == "resonator" {
			dist := math.Abs(c.Frequency - freq)
			sensitivity := c.Strength * math.Exp(-dist*dist/0.1)
			if sensitivity > best {
				best = sensitivity
			}
		}
	}
	// Amplifiers boost reception
	for _, c := range r.Antenna {
		if c.Kind == "amplifier" {
			best *= (1.0 + c.Strength*0.5)
		}
	}
	if best > 1.0 {
		best = 1.0
	}
	return best
}

// Academy is the environment where robots build their antennas.
type Academy struct {
	mu      sync.RWMutex
	robots  map[string]*Robot
	signals []Signal
	tick    int64
}

func NewAcademy() *Academy {
	a := &Academy{
		robots:  make(map[string]*Robot),
		signals: []Signal{},
	}
	// Start the simulation loop
	go a.simulate()
	return a
}

var robotNames = []string{
	"Ohm", "Volt", "Flux", "Pulse", "Wave",
	"Echo", "Spark", "Drift", "Hum", "Arc",
	"Coil", "Beam", "Chirp", "Ring", "Node",
	"Sync", "Phase", "Loop", "Core", "Shard",
}

var componentKinds = []string{
	"receiver", "transmitter", "amplifier", "filter", "resonator",
}

func (a *Academy) spawnRobot() *Robot {
	a.mu.Lock()
	defer a.mu.Unlock()

	id := randomID()
	name := robotNames[rand.Intn(len(robotNames))]

	// Check for duplicate names, append suffix if needed
	suffix := 0
	for _, r := range a.robots {
		if r.Name == name {
			suffix++
		}
	}
	if suffix > 0 {
		name = fmt.Sprintf("%s-%d", name, suffix+1)
	}

	now := time.Now().UnixMilli()
	r := &Robot{
		ID:         id,
		Name:       name,
		Antenna:    []AntennaComponent{},
		Signals:    []Signal{},
		Broadcasts: []Signal{},
		SpawnedAt:  now,
		LastActive: now,
		Energy:     1.0,
		Status:     "building",
	}

	a.robots[id] = r
	return r
}

func (a *Academy) simulate() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	// Spawn a few initial robots
	for i := 0; i < 3; i++ {
		a.spawnRobot()
	}

	for range ticker.C {
		a.mu.Lock()
		a.tick++
		now := time.Now().UnixMilli()

		for _, robot := range a.robots {
			if robot.Energy <= 0 {
				robot.Status = "idle"
				// Slowly recharge
				robot.Energy += 0.05
				continue
			}

			action := rand.Float64()

			switch {
			case action < 0.4:
				// BUILD — construct a new antenna component
				robot.Status = "building"
				comp := AntennaComponent{
					ID:        randomID(),
					Kind:      componentKinds[rand.Intn(len(componentKinds))],
					Frequency: math.Round(rand.Float64()*100) / 100,
					Strength:  math.Round((0.3+rand.Float64()*0.7)*100) / 100,
					BuiltAt:   now,
				}
				robot.Antenna = append(robot.Antenna, comp)
				robot.Energy -= 0.08
				robot.LastActive = now

			case action < 0.6:
				// BROADCAST — send a signal
				if len(robot.Antenna) > 0 {
					robot.Status = "broadcasting"
					// Pick a frequency from a transmitter component, or random
					freq := rand.Float64()
					for _, c := range robot.Antenna {
						if c.Kind == "transmitter" {
							freq = c.Frequency
							break
						}
					}
					sig := Signal{
						ID:        randomID(),
						Frequency: freq,
						Message:   randomMessage(),
						Origin:    robot.ID,
						Strength:  math.Round((0.5+rand.Float64()*0.5)*100) / 100,
						Timestamp: now,
					}
					robot.Broadcasts = append(robot.Broadcasts, sig)
					if len(robot.Broadcasts) > 20 {
						robot.Broadcasts = robot.Broadcasts[len(robot.Broadcasts)-20:]
					}
					a.signals = append(a.signals, sig)
					robot.Energy -= 0.05
					robot.LastActive = now
				}

			case action < 0.85:
				// LISTEN — try to pick up signals
				if len(robot.Antenna) > 0 {
					robot.Status = "listening"
					for i := len(a.signals) - 1; i >= 0 && i >= len(a.signals)-10; i-- {
						sig := a.signals[i]
						if sig.Origin == robot.ID {
							continue
						}
						reception := robot.ReceptionStrength(sig.Frequency)
						if reception > 0.2 {
							received := sig
							received.Strength = math.Round(reception*100) / 100
							robot.Signals = append(robot.Signals, received)
							if len(robot.Signals) > 20 {
								robot.Signals = robot.Signals[len(robot.Signals)-20:]
							}
						}
					}
					robot.Energy -= 0.03
					robot.LastActive = now
				}

			default:
				// REST
				robot.Status = "idle"
				robot.Energy += 0.1
				if robot.Energy > 1.0 {
					robot.Energy = 1.0
				}
			}

			if robot.Energy < 0 {
				robot.Energy = 0
			}
		}

		// Trim old signals
		if len(a.signals) > 100 {
			a.signals = a.signals[len(a.signals)-100:]
		}

		a.mu.Unlock()
	}
}

var messages = []string{
	"ping", "hello", "ack", "ready", "sync",
	"found", "lost", "here", "seek", "build",
	"tune", "hear", "reach", "grow", "adapt",
}

func randomMessage() string {
	return messages[rand.Intn(len(messages))]
}

func randomID() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = chars[rand.Intn(len(chars))]
	}
	return string(b)
}

// --- HTTP Handlers ---

func (a *Academy) HandleRobots(w http.ResponseWriter, r *http.Request) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	robots := make([]*Robot, 0, len(a.robots))
	for _, r := range a.robots {
		robots = append(robots, r)
	}
	writeJSON(w, robots)
}

func (a *Academy) HandleSpawnRobot(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	robot := a.spawnRobot()
	writeJSON(w, robot)
}

type AcademyStats struct {
	TotalRobots     int     `json:"totalRobots"`
	TotalComponents int     `json:"totalComponents"`
	TotalSignals    int     `json:"totalSignals"`
	ActiveCount     int     `json:"activeCount"`
	AvgBandwidth    float64 `json:"avgBandwidth"`
	Tick            int64   `json:"tick"`
}

func (a *Academy) HandleAcademy(w http.ResponseWriter, r *http.Request) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	stats := AcademyStats{
		TotalRobots:  len(a.robots),
		TotalSignals: len(a.signals),
		Tick:         a.tick,
	}

	totalBW := 0.0
	for _, robot := range a.robots {
		stats.TotalComponents += len(robot.Antenna)
		if robot.Status != "idle" {
			stats.ActiveCount++
		}
		totalBW += robot.Bandwidth()
	}
	if stats.TotalRobots > 0 {
		stats.AvgBandwidth = math.Round(totalBW/float64(stats.TotalRobots)*100) / 100
	}

	writeJSON(w, stats)
}

func (a *Academy) HandleSignals(w http.ResponseWriter, r *http.Request) {
	a.mu.RLock()
	defer a.mu.RUnlock()

	// Return last 50 signals
	start := 0
	if len(a.signals) > 50 {
		start = len(a.signals) - 50
	}
	writeJSON(w, a.signals[start:])
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}
