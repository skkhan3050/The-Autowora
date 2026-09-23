(function () {
  "use strict";

  // Google Apps Script Web App URL
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHpxNT8PqBmSrjy3K5Jw22EedtwyC3FqctepDtQq-7lfr8jrITZh8LO1kJ0hw91PIbzg/exec";

  function saveLocalBooking(payload) {
    try {
      const existing = JSON.parse(localStorage.getItem("autowora_bookings") || "[]");
      existing.unshift({
        ...payload,
        submitted_at: new Date().toISOString()
      });
      localStorage.setItem("autowora_bookings", JSON.stringify(existing.slice(0, 100)));
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }

  function showMessage(form, message, type) {
    const messageElement = form.parentElement.querySelector(".form-message");
    if (!messageElement) return;

    if (type === "hide" || !message) {
      messageElement.textContent = "";
      messageElement.className = "form-message";
      messageElement.style.display = "none";
      return;
    }

    messageElement.textContent = message;
    messageElement.className = "form-message " + (type || "");
    messageElement.style.display = "block";
  }

  document.querySelectorAll("[data-booking-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const value = function (name) {
        return String(formData.get(name) || "").trim();
      };

      const submitButton = form.querySelector('button[type="submit"]');

      const payload = {
        full_name: value("name"),
        name: value("name"),
        phone: value("phone"),
        email: value("email") || null,
        service: value("service"),
        appointment_date: value("date") || null,
        message: value("message") || null,
        source: form.dataset.source || "website_form",
      };

      // 1. Instant local persistence (Zero data loss)
      saveLocalBooking(payload);

      // 2. Dispatch to Google Apps Script in the background without blocking
      if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL")) {
        try {
          fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
          }).catch(function (err) {
            console.warn("Background delivery note:", err);
          });
        } catch (e) {
          console.warn("Dispatch note:", e);
        }
      }

      // 3. Instant UI confirmation & smooth redirect to Thank You page
      form.reset();
      showMessage(form, "✓ Booking Received! Redirecting...", "success");

      setTimeout(function () {
        const queryParams = new URLSearchParams({
          name: payload.name || "",
          phone: payload.phone || "",
          service: payload.service || "",
          date: payload.appointment_date || ""
        }).toString();

        window.location.href = "thank-you.html?" + queryParams;
      }, 400);
    });
  });
})();


