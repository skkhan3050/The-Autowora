(function () {
  "use strict";

  // Google Apps Script Web App URL (after deployment)
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxHpxNT8PqBmSrjy3K5Jw22EedtwyC3FqctepDtQq-7lfr8jrITZh8LO1kJ0hw91PIbzg/exec";

  const SUPABASE_URL = "https://teyplbqwsiteirnjhmmx.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aPm56qu_Bk8riDmh_FiIQw_TUQA7fIR";
  const supabaseEndpoint = `${SUPABASE_URL}/rest/v1/booking_requests`;

  function showMessage(form, message, isError) {
    const messageElement = form.parentElement.querySelector(".form-message");
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.classList.toggle("success", !isError);
    messageElement.classList.toggle("error", isError);
  }

  document.querySelectorAll("[data-booking-form]").forEach(function (form) {
    form.addEventListener("submit", async function (event) {
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
        phone: value("phone"),
        email: value("email") || null,
        service: value("service"),
        appointment_date: value("date") || null,
        message: value("message") || null,
        source: form.dataset.source,
      };

      submitButton.disabled = true;
      showMessage(form, "Sending your booking request…", false);

      try {
        let response;
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL") {
          // Submit to Google Apps Script Web App
          response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error("Booking request was not accepted by the sheet server.");
          const result = await response.json();
          if (!result.ok) throw new Error(result.error || "Booking request was not accepted.");
        } else {
          // Fallback to Supabase if Google Apps Script is not configured yet
          response = await fetch(supabaseEndpoint, {
            method: "POST",
            headers: {
              apikey: SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error("Booking request was not accepted by the database.");
        }

        form.reset();
        showMessage(form, "Thanks! Your booking request has been received.", false);
      } catch (error) {
        console.error("Submission error:", error);
        showMessage(
          form,
          error.message || "We could not send your request. Please try again shortly.",
          true
        );
      } finally {
        submitButton.disabled = false;
      }
    });
  });
})();
