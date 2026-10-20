(() => {
  "use strict";

  const workspaceData = {
    home: {
      name: "Home Services Pro",
      avatar: "HS",
      summary: { calls: 37, leads: 24, appointments: 11, conversion: "29.7%" },
      activity: [
        ["New lead qualified", "Plumbing · Emergency", "2m ago"],
        ["Appointment booked", "AC Repair · Tomorrow, 10:00 AM", "5m ago"],
        ["New lead qualified", "Electrical · Panel Upgrade", "8m ago"],
        ["Appointment booked", "Plumbing · Friday, 2:00 PM", "12m ago"],
        ["Call handled", "Roofing · Estimate requested", "18m ago"],
        ["Lead follow-up sent", "Heating · Annual service", "24m ago"]
      ]
    },
    vacation: {
      name: "Vacation Rentals",
      avatar: "VR",
      summary: { calls: 42, leads: 29, appointments: 14, conversion: "33.3%" },
      activity: [
        ["New booking enquiry", "Seaside Cottage · 4 guests", "1m ago"],
        ["Viewing booked", "Lake House · Tomorrow, 11:30 AM", "4m ago"],
        ["Guest question answered", "City Loft · Parking details", "7m ago"],
        ["Owner call scheduled", "Mountain Cabin · Friday, 3:00 PM", "10m ago"],
        ["New booking enquiry", "Garden Studio · 2 guests", "16m ago"],
        ["Availability confirmed", "Harbour Apartment · July stay", "21m ago"]
      ]
    }
  };

  const chartData = {
    week: {
      title: "Weekly Overview",
      leads: 38,
      appointments: 17,
      path: "M0,108 L35,95 L70,101 L105,72 L140,79 L175,47 L215,55 L260,24"
    },
    month: {
      title: "Monthly Overview",
      leads: 162,
      appointments: 73,
      path: "M0,100 L20,90 L40,95 L60,80 L80,70 L100,75 L120,60 L140,50 L160,55 L180,40 L200,35 L220,25 L240,20 L260,10"
    },
    quarter: {
      title: "Quarterly Overview",
      leads: 481,
      appointments: 216,
      path: "M0,112 L20,108 L40,95 L60,101 L80,84 L100,89 L120,64 L140,72 L160,49 L180,58 L200,35 L220,42 L240,19 L260,8"
    }
  };

  const viewData = {
    Calls: {
      copy: "Live and completed conversations handled by AI EVE across the selected workspace.",
      metrics: [["37", "Calls today"], ["04:12", "Average duration"], ["92%", "Answered first time"]],
      headers: ["Caller", "Reason", "Status"],
      rows: [
        ["Sarah M.", "Emergency plumbing", "Qualified"],
        ["Daniel R.", "AC repair", "Booked"],
        ["Priya K.", "Electrical quote", "Follow-up"]
      ]
    },
    Leads: {
      copy: "Qualified prospects captured automatically from calls, including service need and urgency.",
      metrics: [["24", "Qualified today"], ["65%", "Qualification rate"], ["8", "High priority"]],
      headers: ["Lead", "Service", "Priority"],
      rows: [
        ["Sarah M.", "Plumbing", "Urgent"],
        ["Jordan B.", "Heating", "High"],
        ["Luis A.", "Roofing", "Standard"]
      ]
    },
    Appointments: {
      copy: "Bookings created during calls using the business availability configured for this demo.",
      metrics: [["11", "Booked today"], ["3", "Tomorrow"], ["0", "Conflicts"]],
      headers: ["Customer", "Service", "Time"],
      rows: [
        ["Daniel R.", "AC repair", "Tomorrow, 10:00"],
        ["Priya K.", "Electrical", "Friday, 14:00"],
        ["Maya T.", "Boiler service", "Friday, 16:30"]
      ]
    },
    Services: {
      copy: "Services AI EVE can identify, qualify and book during a customer conversation.",
      metrics: [["8", "Active services"], ["5", "Bookable"], ["3", "Quote only"]],
      headers: ["Service", "Routing", "Availability"],
      rows: [
        ["Emergency plumbing", "On-call team", "24/7"],
        ["AC repair", "Cooling team", "Mon–Sat"],
        ["Electrical work", "Electrical team", "Mon–Fri"]
      ]
    },
    Analytics: {
      copy: "A compact view of call outcomes and the revenue-driving actions completed by AI EVE.",
      metrics: [["29.7%", "Lead conversion"], ["45.8%", "Booking rate"], ["0.4s", "Answer speed"]],
      headers: ["Metric", "Current", "Change"],
      rows: [
        ["Calls handled", "37", "+16%"],
        ["Qualified leads", "24", "+20%"],
        ["Appointments", "11", "+22%"]
      ]
    },
    Integrations: {
      copy: "The demonstration workspace is connected to the core tools needed to route calls and capture outcomes.",
      metrics: [["3", "Connected"], ["100%", "Sync health"], ["0", "Errors"]],
      headers: ["Integration", "Purpose", "Status"],
      rows: [
        ["Business phone", "Inbound call routing", "Connected"],
        ["Calendar", "Appointment booking", "Connected"],
        ["CRM", "Lead capture", "Connected"]
      ]
    },
    Settings: {
      copy: "Configuration preview for greeting, call routing and business-hours behaviour.",
      metrics: [["24/7", "Call coverage"], ["English", "Primary language"], ["Instant", "Lead alerts"]],
      headers: ["Setting", "Value", "Status"],
      rows: [
        ["After-hours routing", "AI EVE answers", "Active"],
        ["Urgent call alerts", "SMS + email", "Active"],
        ["Call recording", "Enabled", "Active"]
      ]
    }
  };

  const state = {
    seconds: 18,
    callEnded: false,
    muted: false,
    held: false,
    workspace: "home",
    lastFocus: null,
    toastTimer: null
  };

  const elements = {
    wave: document.getElementById("wave"),
    timer: document.getElementById("callTimer"),
    callStatus: document.getElementById("callStatus"),
    muteButton: document.getElementById("muteButton"),
    keypadButton: document.getElementById("keypadButton"),
    endCallButton: document.getElementById("endCallButton"),
    holdButton: document.getElementById("holdButton"),
    addCallButton: document.getElementById("addCallButton"),
    workspaceSelect: document.getElementById("workspaceSelect"),
    workspaceAvatar: document.getElementById("workspaceAvatar"),
    chartRange: document.getElementById("chartRange"),
    chartTitle: document.getElementById("chartTitle"),
    chartLine: document.getElementById("chartLine"),
    chartFillPath: document.getElementById("chartFillPath"),
    chartLeads: document.getElementById("chartLeads"),
    chartAppointments: document.getElementById("chartAppointments"),
    summaryButton: document.getElementById("summaryActionsButton"),
    viewAllButton: document.getElementById("viewAllButton"),
    modalBackdrop: document.getElementById("modalBackdrop"),
    modalKicker: document.getElementById("modalKicker"),
    modalTitle: document.getElementById("modalTitle"),
    modalBody: document.getElementById("modalBody"),
    modalCloseButton: document.getElementById("modalCloseButton"),
    toast: document.getElementById("toast")
  };

  function buildWaveform() {
    for (let index = 0; index < 60; index += 1) {
      const bar = document.createElement("span");
      bar.style.animationDelay = `${-(index % 14) / 10}s`;
      bar.style.animationDuration = `${1 + (index % 8) / 10}s`;
      elements.wave.appendChild(bar);
    }
  }

  function formatTimer(seconds) {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const remaining = String(seconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${remaining}`;
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
  }

  function setActiveNav(view) {
    document.querySelectorAll(".nav-item").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      if (active) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function openModal(title, body, kicker = "AI EVE dashboard") {
    state.lastFocus = document.activeElement;
    elements.modalTitle.textContent = title;
    elements.modalKicker.textContent = kicker;
    elements.modalBody.innerHTML = body;
    elements.modalBackdrop.classList.add("open");
    elements.modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => elements.modalCloseButton.focus());
  }

  function closeModal({ resetNav = true } = {}) {
    if (!elements.modalBackdrop.classList.contains("open")) return;
    elements.modalBackdrop.classList.remove("open");
    elements.modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (resetNav) setActiveNav("Dashboard");
    if (state.lastFocus instanceof HTMLElement) state.lastFocus.focus();
  }

  function renderCards(metrics) {
    return `<div class="data-grid">${metrics.map(([value, label]) => (
      `<div class="data-card"><strong>${value}</strong><span>${label}</span></div>`
    )).join("")}</div>`;
  }

  function renderTable(headers, rows) {
    return `
      <table class="data-table">
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => (
          `<tr>${row.map((cell, index) => (
            `<td>${index === row.length - 1 ? `<span class="status-pill">${cell}</span>` : cell}</td>`
          )).join("")}</tr>`
        )).join("")}</tbody>
      </table>`;
  }

  function openView(view) {
    if (view === "Dashboard") {
      closeModal({ resetNav: false });
      setActiveNav("Dashboard");
      showToast("Dashboard overview selected");
      return;
    }
    const data = viewData[view];
    setActiveNav(view);
    openModal(
      view,
      `<p class="modal-copy">${data.copy}</p>${renderCards(data.metrics)}${renderTable(data.headers, data.rows)}`,
      "Workspace overview"
    );
  }

  function updateChart(range) {
    const data = chartData[range];
    elements.chartTitle.textContent = data.title;
    elements.chartLeads.textContent = data.leads;
    elements.chartAppointments.textContent = data.appointments;
    elements.chartLine.setAttribute("d", data.path);
    elements.chartFillPath.setAttribute("d", `${data.path} L260,130 L0,130 Z`);
    showToast(`${data.title} loaded`);
  }

  function updateWorkspace(workspace) {
    const data = workspaceData[workspace];
    state.workspace = workspace;
    elements.workspaceAvatar.textContent = data.avatar;
    Object.entries(data.summary).forEach(([key, value]) => {
      const target = document.querySelector(`[data-summary="${key}"]`);
      if (target) target.textContent = value;
    });

    const rows = document.querySelectorAll(".activity .activity-row");
    rows.forEach((row, index) => {
      const item = data.activity[index];
      row.querySelector(".activity-title").textContent = item[0];
      row.querySelector(".activity-meta").textContent = item[1];
      row.querySelector(".activity-time").textContent = item[2];
    });
    showToast(`${data.name} workspace loaded`);
  }

  function setCallControlsDisabled(disabled) {
    [elements.muteButton, elements.keypadButton, elements.holdButton, elements.addCallButton]
      .forEach((button) => { button.disabled = disabled; });
  }

  function setCallStatus(status) {
    elements.callStatus.classList.remove("hold", "ended");
    if (status === "hold") {
      elements.callStatus.classList.add("hold");
      elements.callStatus.textContent = "Call on hold";
    } else if (status === "ended") {
      elements.callStatus.classList.add("ended");
      elements.callStatus.textContent = "Call ended";
    } else {
      elements.callStatus.textContent = "Call in progress";
    }
  }

  function resetCall() {
    state.seconds = 18;
    state.callEnded = false;
    state.muted = false;
    state.held = false;
    elements.timer.textContent = formatTimer(state.seconds);
    elements.wave.classList.remove("paused", "ended");
    elements.muteButton.setAttribute("aria-pressed", "false");
    elements.muteButton.querySelector("span").textContent = "Mute";
    elements.holdButton.setAttribute("aria-pressed", "false");
    elements.holdButton.querySelector("span").textContent = "Hold";
    elements.endCallButton.querySelector("span").textContent = "End Call";
    setCallControlsDisabled(false);
    setCallStatus("active");
    showToast("Call demo restarted");
  }

  function toggleMute() {
    state.muted = !state.muted;
    elements.muteButton.setAttribute("aria-pressed", String(state.muted));
    elements.muteButton.querySelector("span").textContent = state.muted ? "Unmute" : "Mute";
    showToast(state.muted ? "Microphone muted" : "Microphone unmuted");
  }

  function toggleHold() {
    state.held = !state.held;
    elements.holdButton.setAttribute("aria-pressed", String(state.held));
    elements.holdButton.querySelector("span").textContent = state.held ? "Resume" : "Hold";
    elements.wave.classList.toggle("paused", state.held);
    setCallStatus(state.held ? "hold" : "active");
    showToast(state.held ? "Call placed on hold" : "Call resumed");
  }

  function endCall() {
    if (state.callEnded) {
      resetCall();
      return;
    }
    state.callEnded = true;
    state.held = false;
    state.muted = false;
    elements.wave.classList.remove("paused");
    elements.wave.classList.add("ended");
    elements.endCallButton.querySelector("span").textContent = "Restart Demo";
    setCallControlsDisabled(true);
    setCallStatus("ended");
    showToast("Call ended");
  }

  function openKeypad() {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
    openModal(
      "Call keypad",
      `<div class="keypad-display" id="keypadDisplay" aria-live="polite">—</div>
       <div class="keypad">${keys.map((key) => `<button type="button" data-key="${key}" aria-label="Dial ${key}">${key}</button>`).join("")}</div>
       <div class="modal-actions">
         <button class="modal-action" type="button" data-modal-action="clear-keypad">Clear</button>
         <button class="modal-action primary" type="button" data-modal-action="send-keypad">Send tones</button>
       </div>`,
      "Active call"
    );
  }

  function openAddCall() {
    openModal(
      "Add a participant",
      `<p class="modal-copy">Choose a team member to add to the active demonstration call.</p>
       <label for="participantSelect">Participant</label>
       <select class="modal-select" id="participantSelect">
         <option>On-call technician</option>
         <option>Office manager</option>
         <option>Scheduling team</option>
       </select>
       <div class="modal-actions">
         <button class="modal-action" type="button" data-modal-action="cancel">Cancel</button>
         <button class="modal-action primary" type="button" data-modal-action="add-participant">Add to call</button>
       </div>`,
      "Active call"
    );
  }

  function openActivity() {
    const data = workspaceData[state.workspace];
    openModal(
      "Recent activity",
      `<p class="modal-copy">Latest activity for ${data.name}.</p>${renderTable(
        ["Event", "Details", "When"],
        data.activity
      )}`,
      "Live workspace feed"
    );
  }

  function downloadSummary() {
    const data = workspaceData[state.workspace];
    const csv = [
      ["AI EVE daily summary", data.name],
      ["Metric", "Value"],
      ["Calls handled", data.summary.calls],
      ["Leads qualified", data.summary.leads],
      ["Appointments booked", data.summary.appointments],
      ["Conversion rate", data.summary.conversion]
    ].map((row) => row.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-eve-${state.workspace}-summary.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Today's summary downloaded");
  }

  function handleModalAction(event) {
    const keyButton = event.target.closest("[data-key]");
    if (keyButton) {
      const display = document.getElementById("keypadDisplay");
      display.textContent = display.textContent === "—"
        ? keyButton.dataset.key
        : `${display.textContent}${keyButton.dataset.key}`;
      return;
    }

    const actionButton = event.target.closest("[data-modal-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.modalAction;
    if (action === "clear-keypad") {
      document.getElementById("keypadDisplay").textContent = "—";
    } else if (action === "send-keypad") {
      const tones = document.getElementById("keypadDisplay").textContent;
      closeModal();
      showToast(tones === "—" ? "No keypad tones entered" : `Sent tones ${tones}`);
    } else if (action === "add-participant") {
      const participant = document.getElementById("participantSelect").value;
      closeModal();
      showToast(`${participant} added to the call`);
    } else if (action === "cancel") {
      closeModal();
    }
  }

  function trapModalFocus(event) {
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key !== "Tab" || !elements.modalBackdrop.classList.contains("open")) return;
    const focusable = [...elements.modalBackdrop.querySelectorAll(
      "button:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])"
    )];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => openView(button.dataset.view));
  });
  elements.chartRange.addEventListener("change", () => updateChart(elements.chartRange.value));
  elements.workspaceSelect.addEventListener("change", () => updateWorkspace(elements.workspaceSelect.value));
  elements.muteButton.addEventListener("click", toggleMute);
  elements.holdButton.addEventListener("click", toggleHold);
  elements.endCallButton.addEventListener("click", endCall);
  elements.keypadButton.addEventListener("click", openKeypad);
  elements.addCallButton.addEventListener("click", openAddCall);
  elements.summaryButton.addEventListener("click", downloadSummary);
  elements.viewAllButton.addEventListener("click", openActivity);
  elements.modalCloseButton.addEventListener("click", closeModal);
  elements.modalBody.addEventListener("click", handleModalAction);
  elements.modalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.modalBackdrop) closeModal();
  });
  document.addEventListener("keydown", trapModalFocus);

  buildWaveform();
  elements.timer.textContent = formatTimer(state.seconds);
  window.setInterval(() => {
    if (state.callEnded || state.held) return;
    state.seconds += 1;
    elements.timer.textContent = formatTimer(state.seconds);
  }, 1000);
})();
