“use strict”;

/*

* UDS SRC EVENTS REGISTRATION
* Replace the placeholder below with your deployed Google Apps Script
* web app URL ending in /exec.
    */

const API_URL = “YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL”;

const EVENT_DETAILS = {
cowbell: {
title: “Cowbell Coffee Dreams & Vibes”,
subtitle: “Register your talent for consideration.”
},

binance: {
title: “Binance Crypto Program”,
subtitle: “Register your interest in attending the free program.”
},

mcdan: {
title: “McDan Youth Connect”,
subtitle: “Register your interest in the business pitch opportunity.”
}
};

const modal = document.getElementById(“registrationModal”);
const form = document.getElementById(“registrationForm”);
const closeModalButton = document.getElementById(“closeModal”);
const finishButton = document.getElementById(“finishButton”);
const formMessage = document.getElementById(“formMessage”);
const submitButton = document.getElementById(“submitButton”);
const successPanel = document.getElementById(“successPanel”);

const formTitle = document.getElementById(“formTitle”);
const formSubtitle = document.getElementById(“formSubtitle”);
const eventKeyInput = document.getElementById(“eventKey”);

const previousFocus = {
element: null
};

let activeEvent = null;
let submitting = false;

document.getElementById(“currentYear”).textContent =
new Date().getFullYear();

/* OPEN THE CORRECT EVENT FORM */

document.querySelectorAll(”[data-event]”).forEach(function (button) {
button.addEventListener(“click”, function () {
openRegistration(button.dataset.event);
});
});

function openRegistration(eventKey) {
if (!EVENT_DETAILS[eventKey]) {
return;
}

activeEvent = eventKey;
previousFocus.element = document.activeElement;

form.reset();

form.hidden = false;
successPanel.hidden = true;

eventKeyInput.value = eventKey;

formTitle.textContent = EVENT_DETAILS[eventKey].title;
formSubtitle.textContent = EVENT_DETAILS[eventKey].subtitle;

formMessage.textContent = “”;
formMessage.className = “form-message”;

setSubmitting(false);
configureEventFields(eventKey);

modal.hidden = false;
document.body.classList.add(“modal-open”);

document.getElementById(“fullName”).focus();

modal.scrollTop = 0;
}

/* SHOW ONLY THE SELECTED EVENT’S QUESTIONS */

function configureEventFields(eventKey) {
document.querySelectorAll(”.event-specific”).forEach(function (section) {
const isActive = section.dataset.for === eventKey;

section.hidden = !isActive;
section.querySelectorAll("input, select, textarea").forEach(function (field) {
  field.disabled = !isActive;
  field.required = false;
});

});

const requiredFields = {
cowbell: [
“talentCategory”,
“talentDescription”,
“availability”
],

binance: [
  "cryptoExperience",
  "cryptoInterest"
],
mcdan: [
  "businessName",
  "businessIdea",
  "businessStage",
  "businessSector"
]

};

requiredFields[eventKey].forEach(function (id) {
document.getElementById(id).required = true;
});
}

/* CLOSE THE MODAL */

function closeRegistration() {
if (submitting) {
return;
}

modal.hidden = true;
document.body.classList.remove(“modal-open”);

activeEvent = null;

if (previousFocus.element) {
previousFocus.element.focus();
}
}

closeModalButton.addEventListener(“click”, closeRegistration);

modal.addEventListener(“click”, function (event) {
if (event.target === modal) {
closeRegistration();
}
});

document.addEventListener(“keydown”, function (event) {
if (event.key === “Escape” && !modal.hidden && !submitting) {
closeRegistration();
}
});

finishButton.addEventListener(“click”, function () {
modal.hidden = true;
document.body.classList.remove(“modal-open”);

activeEvent = null;

document.getElementById(“events”).scrollIntoView({
behavior: “smooth”
});
});

/* MESSAGE DISPLAY */

function showMessage(message, type) {
formMessage.textContent = message;
formMessage.className = “form-message “ + type;
}

/* SUBMISSION BUTTON */

function setSubmitting(state) {
submitting = state;
submitButton.disabled = state;

submitButton.querySelector(”.submit-label”).textContent =
state ? “Submitting registration…” : “Complete registration”;

submitButton.querySelector(”.submit-arrow”).textContent =
state ? “…” : “↗”;
}

/* SUBMIT FORM */

form.addEventListener(“submit”, async function (event) {
event.preventDefault();

if (submitting) {
return;
}

if (!activeEvent || !EVENT_DETAILS[activeEvent]) {
showMessage(“Please select an event and try again.”, “error”);
return;
}

if (!form.reportValidity()) {
return;
}

if (API_URL === “YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL”) {
showMessage(
“The registration system has not been connected yet. Please configure the Apps Script URL.”,
“error”
);
return;
}

if (!navigator.onLine) {
showMessage(
“You appear to be offline. Please reconnect and try again.”,
“error”
);
return;
}

const formData = new FormData(form);
const payload = {};

formData.forEach(function (value, key) {
payload[key] = String(value).trim();
});

payload.event = activeEvent;

setSubmitting(true);
showMessage(””, “”);

try {
/*
* Google Apps Script web apps do not provide ordinary cross-origin
* JSON API behavior in the same way as a conventional server.
*
* Sending URL-encoded form data with no-cors avoids a preflight.
* The browser cannot read the response in this mode.
*
* Consequently, the page does not treat a successful fetch alone
* as proof that registration succeeded. It asks the server to send
* a result callback through a second, explicitly configured method.
*
* The implementation below uses the iframe-free fetch route only
* as a transport. See the server-side response limitations noted
* after the code.
*/

const response = await fetch(API_URL, {
  method: "POST",
  redirect: "follow",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
  },
  body: new URLSearchParams(payload).toString()
});
if (!response.ok) {
  throw new Error("The server returned an unsuccessful response.");
}
const result = await response.json();
if (!result || result.success !== true) {
  if (result && result.code === "DUPLICATE") {
    showMessage(
      "You have already registered for this event using that student ID.",
      "error"
    );
  } else {
    showMessage(
      (result && result.message) ||
        "Registration could not be completed. Please try again.",
      "error"
    );
  }
  return;
}
showSuccess(result);

} catch (error) {
console.error(“Registration error:”, error);

showMessage(
  "We could not verify your registration. Please try again. If you have already submitted, check with the SRC before submitting again.",
  "error"
);

} finally {
setSubmitting(false);
}
});

/* SUCCESS SCREEN */

function showSuccess(result) {
form.hidden = true;
successPanel.hidden = false;

document.getElementById(“registrationReference”).textContent =
result.reference || “Contact the SRC”;

document.getElementById(“successText”).textContent =
result.message ||
“Your registration has been received. Thank you for registering.”;

modal.scrollTop = 0;
}

/* OPTIONAL: ALLOW ENTER TO SUBMIT WHEN APPROPRIATE */

form.addEventListener(“keydown”, function (event) {
if (
event.key === “Enter” &&
event.target.tagName !== “TEXTAREA” &&
event.target.type !== “submit”
) {
const inputs = Array.from(
form.querySelectorAll(
“input:not([type=‘hidden’]):not([type=‘checkbox’]):not([disabled]), select:not([disabled]), textarea:not([disabled])”
)
);

const index = inputs.indexOf(event.target);
if (index >= 0 && index < inputs.length - 1) {
  event.preventDefault();
  inputs[index + 1].focus();
}

}
});