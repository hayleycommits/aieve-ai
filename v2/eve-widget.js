// Talk to EVE voice widget, shared by every page. Any [data-talk] button opens it and starts a call.
// The microphone is asked for before a Vapi call is created, so a blocked mic never starts a call.
import Vapi from 'https://esm.sh/@vapi-ai/web@3.0.0';

const VAPI_PUBLIC_KEY = '3d943765-7118-405d-b24e-505a7a79f07c';
const VAPI_ASSISTANT_ID = 'b24725a8-f5f5-4664-b292-185e2e4c0cd2';
const MAX_SECS = 300;
const CONNECT_TIMEOUT_MS = 20000;
const NOTE = 'Recorded AI demo. We record and transcribe this call to run the demo and follow up if you ask. Please don&rsquo;t share sensitive information. <a href="/privacy-policy.html">Privacy policy</a>';
const bars = '<span></span>'.repeat(10);

document.body.insertAdjacentHTML('beforeend', `
<button class="vw-pill" id="vwPill" type="button"><span class="vw-pill-dot">EVE</span><span>Talk to EVE</span></button>
<div class="vw" id="vw" role="dialog" aria-label="Talk to EVE">
  <button class="vw-close" id="vwClose" type="button" aria-label="Close">×</button>
  <div class="vw-header">
    <div class="vw-ava" id="vwAva">EVE</div>
    <div><div class="vw-name">Talk to EVE</div><div class="vw-sub" id="vwSub" role="status" aria-live="polite">Live AI voice demo</div></div>
  </div>
  <div class="vw-bars">
    <div class="vw-bar-row"><span class="vw-bar-label you">YOU</span><div class="vw-bar-track you" id="vwBarUser">${bars}</div></div>
    <div class="vw-bar-row"><span class="vw-bar-label eve">EVE</span><div class="vw-bar-track eve" id="vwBarEve">${bars}</div></div>
  </div>
  <div class="vw-transcript" id="vwTranscript"></div>
  <div class="vw-timer" id="vwTimer"></div>
  <button class="vw-btn vw-btn-start" id="vwStart" type="button"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>Start call</button>
  <button class="vw-btn vw-btn-end" id="vwEnd" type="button" style="display:none"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>End call</button>
  <p class="vw-note">${NOTE}</p>
</div>`);

const $ = (id) => document.getElementById(id);
const vwPill = $('vwPill'), vw = $('vw'), vwAva = $('vwAva'), vwSub = $('vwSub');
const vwBarUser = $('vwBarUser'), vwBarEve = $('vwBarEve'), vwTranscript = $('vwTranscript');
const vwTimer = $('vwTimer'), vwStart = $('vwStart'), vwEnd = $('vwEnd');
const vapi = new Vapi(VAPI_PUBLIC_KEY);

// The floating pill stays off the Book page and out of the way while the home page's own Talk box is on screen.
const page = document.body.dataset.page;
if (page === 'book') vwPill.style.display = 'none';
else document.body.classList.add('has-pill');
const hero = document.querySelector('.evebox');
if (hero && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => vwPill.classList.toggle('away', e.isIntersecting)).observe(hero);
}

let state = 'idle', timerInterval = null, connectTimer = null, secs = 0, endNote = '';
let audioCtx = null, micStream = null, rafId = null, partialLine = null;
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

function openWidget() { vwPill.classList.add('hidden'); vw.classList.add('open'); }
function closeWidget() { stopCall(); vw.classList.remove('open'); vwPill.classList.remove('hidden'); }

function resetBars() {
  vwBarUser.querySelectorAll('span').forEach((b) => (b.style.height = '3px'));
  vwBarEve.querySelectorAll('span').forEach((b) => (b.style.height = '3px'));
}

function startMicViz() {
  if (!micStream) return;
  try {
    audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 32;
    audioCtx.createMediaStreamSource(micStream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount), spans = vwBarUser.querySelectorAll('span');
    (function tick() {
      analyser.getByteFrequencyData(data);
      spans.forEach((b, i) => { b.style.height = Math.max(3, Math.round(((data[Math.floor((i * data.length) / spans.length)] || 0) / 255) * 24)) + 'px'; });
      rafId = requestAnimationFrame(tick);
    })();
  } catch (e) { /* the visualiser is decoration only */ }
}

function releaseMic() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (micStream) { micStream.getTracks().forEach((t) => t.stop()); micStream = null; }
  if (audioCtx) { audioCtx.close(); audioCtx = null; }
  resetBars();
}

function setState(next, message) {
  state = next;
  vwAva.className = next === 'idle' ? 'vw-ava' : 'vw-ava ringing';
  vwStart.style.display = next === 'idle' ? 'flex' : 'none';
  vwEnd.style.display = next === 'idle' ? 'none' : 'flex';
  vwSub.className = 'vw-sub' + (next === 'active' ? ' live' : message ? ' warn' : '');
  if (next === 'idle') {
    vwSub.textContent = message || 'Live AI voice demo';
    clearInterval(timerInterval); clearTimeout(connectTimer); timerInterval = connectTimer = null;
    vwTimer.textContent = ''; secs = 0;
    releaseMic();
    vwTranscript.replaceChildren(); partialLine = null;
    vwTranscript.classList.remove('visible');
  }
  if (next === 'asking') vwSub.textContent = 'Allow your microphone to start…';
  if (next === 'connecting') vwSub.textContent = 'Connecting…';
  if (next === 'active') {
    vwSub.textContent = '● Live call';
    clearTimeout(connectTimer); connectTimer = null;
    timerInterval = setInterval(() => {
      vwTimer.textContent = fmt(++secs);
      if (secs >= MAX_SECS) { endNote = 'Demo ended. Book a time to hear more.'; vapi.stop(); }
    }, 1000);
    startMicViz();
    vwTranscript.classList.add('visible');
  }
}

function addLine(role, text, partial) {
  const make = (cls) => {
    const line = document.createElement('div'), who = document.createElement('span'), t = document.createElement('span');
    line.className = 'vw-tx-line'; who.className = 'vw-tx-who ' + role; who.textContent = role.toUpperCase(); t.className = cls;
    line.append(who, t); vwTranscript.appendChild(line); return line;
  };
  if (partial) {
    if (!partialLine) partialLine = make('vw-tx-text partial');
    partialLine.querySelector('.vw-tx-text').textContent = text;
  } else {
    if (partialLine) { partialLine.remove(); partialLine = null; }
    make('vw-tx-text').querySelector('.vw-tx-text').textContent = text;
  }
  vwTranscript.scrollTop = vwTranscript.scrollHeight;
}

async function startCall() {
  if (state !== 'idle') return;
  setState('asking');
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (e) {
    setState('idle', 'Please allow microphone access to talk to EVE (click the lock icon in the address bar).');
    return;
  }
  if (state !== 'asking') { releaseMic(); return; }
  setState('connecting');
  connectTimer = setTimeout(() => { if (state === 'connecting') stopCall('EVE couldn’t connect just now. Please try again.'); }, CONNECT_TIMEOUT_MS);
  try {
    await vapi.start(VAPI_ASSISTANT_ID);
  } catch (e) {
    stopCall('EVE couldn’t connect just now. Please try again.');
  }
}

function stopCall(message) {
  if (state === 'idle') return;
  try { vapi.stop(); } catch (e) { /* already stopped */ }
  setState('idle', message);
}

vwPill.addEventListener('click', openWidget);
$('vwClose').addEventListener('click', closeWidget);
vwStart.addEventListener('click', startCall);
vwEnd.addEventListener('click', () => stopCall());
document.querySelectorAll('[data-talk]').forEach((b) => b.addEventListener('click', () => { openWidget(); startCall(); }));

vapi.on('call-start', () => { if (state === 'connecting') setState('active'); });
vapi.on('call-end', () => { const note = endNote; endNote = ''; setState('idle', note); });
vapi.on('message', (msg) => {
  if (msg.type !== 'transcript') return;
  addLine(msg.role === 'assistant' ? 'eve' : 'you', msg.transcript, msg.transcriptType === 'partial');
});
vapi.on('volume-level', (vol) => {
  vwBarEve.querySelectorAll('span').forEach((b, i) => { b.style.height = Math.max(3, Math.round(vol * 26 * (0.5 + 0.5 * Math.sin(i * 0.9)))) + 'px'; });
});
vapi.on('error', () => stopCall('Something went wrong with the call. Please try again.'));
