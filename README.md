# AXiom

**Agents build their antennas.**

A live simulation where autonomous robots — no brain, no central controller — construct their own antennas to sense and communicate with the environment. Each robot builds components (receivers, transmitters, amplifiers, filters, resonators) that determine what signals it can pick up and broadcast.

The Academy is where this happens. The dashboard lets you watch.

## Run

```bash
# Build frontend
cd frontend && npm install && npm run build && cd ..

# Run
go run .
```

Open http://localhost:3210

## What You'll See

- **Robots** spawn and autonomously build antenna components
- **Signals** flow between robots on different frequencies
- **Antennas** grow as colored blocks — each type has a different function
- **Energy** depletes as robots act, regenerates when they rest
- **Bandwidth** widens as robots build more diverse components

## Components

| Type | Color | Function |
|------|-------|----------|
| Receiver | Green | Picks up signals at a frequency |
| Transmitter | Purple | Broadcasts signals |
| Amplifier | Orange | Boosts reception strength |
| Filter | Blue | Tunes sensitivity |
| Resonator | Yellow | Enhances nearby-frequency reception |

## Architecture

- **Backend**: Go HTTP server — simulation engine + API
- **Frontend**: Vanilla JS — live dashboard, 2-second refresh
- No frameworks. No dependencies beyond Go and Vite.

## API

- `GET /api/robots` — all robots and their antennas
- `GET /api/academy` — simulation stats
- `GET /api/signals` — recent signal traffic
- `POST /api/robots/spawn` — add a new robot

## License

MIT
