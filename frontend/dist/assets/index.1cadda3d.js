(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const l of t.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function i(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerpolicy&&(t.referrerPolicy=e.referrerpolicy),e.crossorigin==="use-credentials"?t.credentials="include":e.crossorigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(e){if(e.ep)return;e.ep=!0;const t=i(e);fetch(e.href,t)}})();let u={};function g(s){return s>.6?"var(--green)":s>.3?"var(--orange)":"var(--red)"}function f(s){return s.slice(-8).reverse().map(i=>`
        <div class="signal-item">
            <span class="freq">${i.frequency.toFixed(2)}Hz</span>
            <span class="msg">${i.message}</span>
        </div>
    `).join("")}function m(s){const a=u[s.id]||0,i=s.antenna.map((e,t)=>{const l=t>=a;return`<div class="component ${e.kind}${l?" new":""}"
                     style="--strength: ${e.strength}"
                     title="${e.kind} | ${e.frequency.toFixed(2)}Hz | str ${(e.strength*100).toFixed(0)}%"></div>`}).join("");u[s.id]=s.antenna.length;const n=[...(s.signals||[]).slice(-5).map(e=>`<div class="signal-log-entry"><span class="direction">rx</span> ${e.message} <span class="freq">${e.frequency.toFixed(2)}Hz</span></div>`),...(s.broadcasts||[]).slice(-3).map(e=>`<div class="signal-log-entry"><span class="direction out">tx</span> ${e.message} <span class="freq">${e.frequency.toFixed(2)}Hz</span></div>`)].join("");return`
        <div class="robot-card" data-status="${s.status}" data-id="${s.id}">
            <div class="robot-header">
                <div class="robot-name">${s.name}</div>
                <div class="robot-status ${s.status}">${s.status}</div>
            </div>
            <div class="energy-bar">
                <div class="energy-fill" style="width: ${s.energy*100}%; background: ${g(s.energy)}"></div>
            </div>
            <div class="antenna-section">
                <div class="antenna-label">
                    <span>antenna</span>
                    <span class="antenna-count">${s.antenna.length} parts</span>
                </div>
                <div class="antenna-vis">${i||'<span style="color: #333; font-size: 10px;">no components yet</span>'}</div>
            </div>
            <div class="robot-stats">
                <div class="robot-stat">rx <span class="value">${(s.signals||[]).length}</span></div>
                <div class="robot-stat">tx <span class="value">${(s.broadcasts||[]).length}</span></div>
                <div class="robot-stat">bw <span class="value">${y(s)}</span></div>
            </div>
            ${n?`<div class="signal-log">${n}</div>`:""}
        </div>
    `}function y(s){if(!s.antenna||s.antenna.length===0)return"0.00";let a=1/0,i=-1/0;for(const n of s.antenna)n.frequency<a&&(a=n.frequency),n.frequency>i&&(i=n.frequency);return(i-a).toFixed(2)}function h(s,a,i){const n=document.getElementById("app"),e=s.sort((t,l)=>{var v,p;const r={building:0,broadcasting:1,listening:2,idle:3},c=(v=r[t.status])!=null?v:3,o=(p=r[l.status])!=null?p:3;return c!==o?c-o:l.antenna.length-t.antenna.length}).map(m).join("");n.innerHTML=`
        <div class="header">
            <div class="header-left">
                <div class="logo">A<span>X</span>iom</div>
                <div class="tagline">Agents build their antennas</div>
            </div>
            <div class="header-right">
                <div class="stat-pill">
                    <div class="dot" style="background: var(--green)"></div>
                    <span class="value">${a.totalRobots}</span>
                    <span class="label">robots</span>
                </div>
                <div class="stat-pill">
                    <div class="dot" style="background: var(--purple)"></div>
                    <span class="value">${a.totalComponents}</span>
                    <span class="label">parts</span>
                </div>
                <div class="stat-pill">
                    <div class="dot" style="background: var(--cyan)"></div>
                    <span class="value">${a.totalSignals}</span>
                    <span class="label">signals</span>
                </div>
                <button class="spawn-btn" onclick="spawnRobot()">+ Spawn</button>
            </div>
        </div>
        <div class="signal-feed">
            <span class="signal-feed-label">Live</span>
            <div class="signal-feed-items">${f(i)}</div>
        </div>
        <div class="main-grid">${e}</div>
        <div class="legend">
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(0,255,153,0.3)"></div> Receiver</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(191,111,255,0.3)"></div> Transmitter</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(255,140,76,0.3)"></div> Amplifier</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(68,136,255,0.3)"></div> Filter</div>
            <div class="legend-item"><div class="legend-swatch" style="background: rgba(255,204,0,0.3)"></div> Resonator</div>
        </div>
    `}async function d(){try{const[s,a,i]=await Promise.all([fetch("/api/robots").then(n=>n.json()),fetch("/api/academy").then(n=>n.json()),fetch("/api/signals").then(n=>n.json())]);h(s,a,i)}catch(s){console.error("Failed to refresh:",s)}}window.spawnRobot=async function(){try{await fetch("/api/robots/spawn",{method:"POST"}),d()}catch(s){console.error("Failed to spawn:",s)}};d();setInterval(d,2e3);
