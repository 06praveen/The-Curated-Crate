/**
 * login.js — The Curated Crate
 * Login form validation, submission, and auth logic
 */

document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    window.location.href = "home.html";
    return;
  }

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const btnSpinner = loginBtn.querySelector(".btn-spinner");
  const globalError = document.getElementById("globalError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  // Seed demo user if not exists
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || "{}");
  if (!users["demo@curatedcrate.in"]) {
    users["demo@curatedcrate.in"] = {
      name: "Demo User",
      email: "demo@curatedcrate.in",
      password: btoa("demo1234"),
      phone: "9876543210",
      joinedAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  // ─── Validation Helpers ────────────────────────────────────
  function clearErrors() {
    [emailError, passwordError, globalError].forEach(el => {
      el.textContent = "";
      el.classList.remove("show");
    });
    emailInput.style.borderColor = "";
    passwordInput.style.borderColor = "";
  }

  function showFieldError(input, errorEl, message) {
    errorEl.textContent = message;
    errorEl.classList.add("show");
    input.style.borderColor = "#c0392b";
    input.focus();
  }

  function showGlobalError(message) {
    globalError.textContent = message;
    globalError.classList.add("show");
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ─── Real-time Input Feedback ───────────────────────────────
  emailInput.addEventListener("input", () => {
    if (validateEmail(emailInput.value)) {
      emailInput.style.borderColor = "#8A9B7E";
      emailError.classList.remove("show");
    }
  });

  passwordInput.addEventListener("input", () => {
    if (passwordInput.value.length >= 6) {
      passwordInput.style.borderColor = "#8A9B7E";
      passwordError.classList.remove("show");
    }
  });

  // ─── Form Submit ────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate
    let valid = true;

    if (!email) {
      showFieldError(emailInput, emailError, "Please enter your email address.");
      valid = false;
    } else if (!validateEmail(email)) {
      showFieldError(emailInput, emailError, "Please enter a valid email address.");
      valid = false;
    }

    if (!password) {
      if (valid) showFieldError(passwordInput, passwordError, "Please enter your password.");
      valid = false;
    } else if (password.length < 6) {
      if (valid) showFieldError(passwordInput, passwordError, "Password must be at least 6 characters.");
      valid = false;
    }

    if (!valid) return;

    // Simulate network delay for realism
    setLoading(true);
    await delay(800);

    const result = await Auth.login(email, password);

    if (!result.success) {
      setLoading(false);
      showGlobalError(result.message);
      // Shake animation on error
      form.classList.add("shake");
      setTimeout(() => form.classList.remove("shake"), 500);
      return;
    }

    // Success!
    Toast.show(`Welcome back, ${result.user.name}! ✨`, "success", 2000);
    await delay(600);
    window.location.href = "home.html";
  });

  // ─── Loading State ──────────────────────────────────────────
  function setLoading(loading) {
    loginBtn.disabled = loading;
    btnText.style.display = loading ? "none" : "block";
    btnSpinner.style.display = loading ? "flex" : "none";
    loginBtn.style.opacity = loading ? "0.8" : "1";
  }

  // ─── Utility ────────────────────────────────────────────────
  function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
});

// ─── Toggle Password Visibility ───────────────────────────────
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  // Swap icon
  btn.querySelector("svg").innerHTML = isPassword
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
}

// ─── Demo Login ───────────────────────────────────────────────
async function quickDemo() {
  const demoEmail = "demo@curatedcrate.in";
  const demoPass = "demo1234";

  document.getElementById("loginEmail").value = demoEmail;
  document.getElementById("loginPassword").value = demoPass;
  document.getElementById("loginEmail").style.borderColor = "#8A9B7E";
  document.getElementById("loginPassword").style.borderColor = "#8A9B7E";
  Toast.show("Demo credentials filled in ✦", "info", 2000);

  // Ensure demo user exists in the backend before attempting login
  try {
    await Auth.signup("Demo User", demoEmail, demoPass, "9876543210");
  } catch(e) {
    // Ignore error, we will gracefully proceed to login
  }

  // Auto-submit after brief delay
  await new Promise(r => setTimeout(r, 500));
  document.getElementById("loginForm").requestSubmit();
}
