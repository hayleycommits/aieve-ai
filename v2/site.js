// Shared bits for the AI EVE pages: live UK clock tile, copy email.
(function () {
  const clock = document.getElementById("clock"), line = document.getElementById("clockline");
  if (clock) {
    const tick = () => {
      const t = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
      const h = parseInt(t.slice(0, 2), 10);
      clock.textContent = t;
      line.textContent = h < 6 ? "Everyone's asleep. EVE isn't." : h < 12 ? "Breakfast rush. EVE's got it." : h < 17 ? "Lunch service. EVE's on the phones." : h < 23 ? "Dinner service. EVE's taking bookings." : "Late one. EVE's still here.";
    };
    tick(); setInterval(tick, 15000);
  }

  const copy = document.getElementById("copy");
  if (copy) copy.addEventListener("click", () => {
    const out = document.getElementById("copied");
    const select = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById("email")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); out.textContent = "Selected"; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText("hello@aieve.ai").then(() => { out.textContent = "Copied"; }).catch(select); else select();
  });
})();
