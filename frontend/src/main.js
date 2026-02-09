// AXiom — Agents Build Their Antennas

let prevComponentCounts = {};

function energyColor(energy) {
    if (energy > 0.6) return 'var(--green)';
    if (energy > 0.3) return 'var(--orange)';
    return 'var(--red)';
}

function renderSignalFeed(signals) {
    const recent = signals.slice(-8).reverse();
    return recent.map(s => `
        <div class="signal-item">
            <span class="freq">${s.frequency.toFixed(2)}Hz</span>
            <span class="msg">${s.message}</span>
        </div>
    `).join('');
}

function renderRobot(robot) {
    const prevCount = prevComponentCounts[robot.id] || 0;
    const components = robot.antenna.map((c, i) => {
        const isNew = i >= prevCount;
        return `<div class="component ${c.kind}${isNew ? ' new' : ''}"
                     style="--strength: ${c.strength}"
                     title="${c.kind} | ${c.frequency.toFixed(2)}Hz | str ${(c.strength * 100).toFixed(0)}%"></div>`;
    }).join('');
    prevComponentCounts[robot.id] = robot.antenna.length;

    const signalLog = [...(robot.signals || []).slice(-5).map(s =>
        `<div class="signal-log-entry"><span class="direction">rx</span> ${s.message} <span class="freq">${s.frequency.toFixed(2)}Hz</span></div>`
    ), ...(robot.broadcasts || []).slice(-3).map(s =>
        `<div class="signal-log-entry"><span class="direction out">tx</span> ${s.message} <span class="freq">${s.frequency.toFixed(2)}Hz</span></div>`
    )].join('');

    return `
        <div class="robot-card" data-status="${robot.status}" data-id="${robot.id}">
            <div class="robot-header">
                <div class="robot-name">${robot.name}</div>
                <div class="robot-status ${robot.status}">${robot.status}</div>
            </div>
            <div class="energy-bar">
                <div class="energy-fill" style="width: ${robot.energy * 100}%; background: ${energyColor(robot.energy)}"></div>
            </div>
            <div class="antenna-section">
                <div class="antenna-label">
                    <span>antenna</span>
                    <span class="antenna-count">${robot.antenna.length} parts</span>
                </div>
                <div class="antenna-vis">${components || '<span style="color: #333; font-size: 10px;">no components yet</span>'}</div>
            </div>
            <div class="robot-stats">
                <div class="robot-stat">rx <span class="value">${(robot.signals || []).length}</span></div>
                <div class="robot-stat">tx <span class="value">${(robot.broadcasts || []).length}</span></div>
                <div class="robot-stat">bw <span class="value">${bandwidth(robot)}</span></div>
            </div>
            ${signalLog ? `<div class="signal-log">${signalLog}</div>` : ''}
        </div>
    `;
}

function bandwidth(robot) {
    if (!robot.antenna || robot.antenna.length === 0) return '0.00';
    let min = Infinity, max = -Infinity;
    for (const c of robot.antenna) {
        if (c.frequency < min) min = c.frequency;
        if (c.frequency > max) max = c.frequency;
    }
    return (max - min).toFixed(2);
}

function render(robots, stats, signals) {
    const app = document.getElementById('app');

    const robotCards = robots
        .sort((a, b) => {
            // Active first, then by antenna size
            const statusOrder = { building: 0, broadcasting: 1, listening: 2, idle: 3 };
            const aOrder = statusOrder[a.status] ?? 3;
            const bOrder = statusOrder[b.status] ?? 3;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return b.antenna.length - a.antenna.length;
        })
        .map(renderRobot)
        .join('');

    app.innerHTML = `
        <div class="header">
            <div class="header-left">
                <div class="logo">A<span>X</span>iom</div>
                <div class="tagline">Agents build their antennas</div>
            </div>
            <div class="header-right">
                <div class="stat-pill">
                    <div class="dot" style="background: var(--green)"></div>
                    <span class="value">${stats.totalRobots}</span>
                    <span class="label">robots</span>
                </div>
                <div class="stat-pill">
                    <div class="dot" style="background: var(--purple)"></div>
                    <span class="value">${stats.totalComponents}</span>
                    <span class="label">parts</span>
                </div>
                <div class="stat-pill">
                    <div class="dot" style="background: var(--cyan)"></div>
                    <span class="value">${stats.totalSignals}</span>
                    <span class="label">signals</span>
                </div>
                <button class="spawn-btn" onclick="spawnRobot()">+ Spawn</button>
            </div>
        </div>
        <div class="signal-feed">
            <span class="signal-feed-label">Live</span>
            <div class="signal-feed-items">${renderSignalFeed(signals)}</div>
        </div>
        <div class="main-grid">${robotCards}</div>
        <div class="legend">
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(0,255,153,0.3)"></div> Receiver</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(191,111,255,0.3)"></div> Transmitter</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(255,140,76,0.3)"></div> Amplifier</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(68,136,255,0.3)"></div> Filter</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(255,204,0,0.3)"></div> Resonator</div>
        </div>
    `;
}

async function refresh() {
    try {
        const [robots, stats, signals] = await Promise.all([
            fetch('/api/robots').then(r => r.json()),
            fetch('/api/academy').then(r => r.json()),
            fetch('/api/signals').then(r => r.json()),
        ]);
        render(robots, stats, signals);
    } catch (e) {
        console.error('Failed to refresh:', e);
    }
}

window.spawnRobot = async function() {
    try {
        await fetch('/api/robots/spawn', { method: 'POST' });
        refresh();
    } catch (e) {
        console.error('Failed to spawn:', e);
    }
};

// Boot
refresh();
setInterval(refresh, 2000);
