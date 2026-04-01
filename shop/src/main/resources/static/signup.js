/**
 * signup.js — The Curated Crate
 * Signup form validation, password strength, and registration
 */

document.addEventListener("DOMContentLoaded", () => {
  if (Auth.isLoggedIn()) {
    window.location.href = "home.html";
    return;
  }

  const form = document.getElementById("signupForm");
  const nameInput = document.getElementById("signupName");
  const emailInput = document.getElementById("signupEmail");
  const passwordInput = document.getElementById("signupPassword");
  const confirmInput = document.getElementById("confirmPassword");
  const phoneInput = document.getElementById("signupPhone");
  const termsCheck = document.getElementById("agreeTerms");
  const signupBtn = document.getElementById("signupBtn");
  const btnText = signupBtn.querySelector(".btn-text");
  const btnSpinner = signupBtn.querySelector(".btn-spinner");

  // Error elements
  const errors = {
    name: document.getElementById("nameError"),
    email: document.getElementById("emailError"),
    password: document.getElementById("passwordError"),
    confirm: document.getElementById("confirmError"),
    terms: document.getElementById("termsError"),
    global: document.getElementById("globalError")
  };

  // ─── Password Strength ──────────────────────────────────────
  const strengthEl = document.getElementById("passwordStrength");
  const strengthFill = document.getElementById("strengthFill");
  const strengthLabel = document.getElementById("strengthLabel");

  function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { cls: "", label: "Too short" },
      { cls: "weak", label: "Weak" },
      { cls: "fair", label: "Fair" },
      { cls: "good", label: "Good" },
      { cls: "strong", label: "Strong" },
      { cls: "strong", label: "Very Strong" }
    ];
    const level = levels[Math.min(score, 5)];
    strengthFill.className = "strength-fill " + level.cls;
    strengthLabel.textContent = level.label;
  }

  passwordInput.addEventListener("input", () => {
    const val = passwordInput.value;
    if (val.length > 0) {
      strengthEl.classList.add("visible");
      checkPasswordStrength(val);
    } else {
      strengthEl.classList.remove("visible");
    }
    clearFieldError(passwordInput, errors.password);
  });

  confirmInput.addEventListener("input", () => {
    if (confirmInput.value === passwordInput.value) {
      clearFieldError(confirmInput, errors.confirm);
      confirmInput.style.borderColor = "#8A9B7E";
    }
  });

  nameInput.addEventListener("input", () => clearFieldError(nameInput, errors.name));
  emailInput.addEventListener("input", () => clearFieldError(emailInput, errors.email));

  // Phone validation — digits only
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
  });

  // ─── Helpers ────────────────────────────────────────────────
  function clearFieldError(input, errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
    input.style.borderColor = "";
  }

  function showFieldError(input, errorEl, message) {
    errorEl.textContent = message;
    errorEl.classList.add("show");
    input.style.borderColor = "#c0392b";
  }

  function clearAll() {
    Object.values(errors).forEach(el => {
      el.textContent = "";
      el.classList.remove("show");
    });
    [nameInput, emailInput, passwordInput, confirmInput].forEach(i => i.style.borderColor = "");
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setLoading(loading) {
    signupBtn.disabled = loading;
    btnText.style.display = loading ? "none" : "block";
    btnSpinner.style.display = loading ? "flex" : "none";
  }

  // ─── Submit ─────────────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAll();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    const phone = phoneInput.value.trim();

    let valid = true;

    if (!name || name.length < 2) {
      showFieldError(nameInput, errors.name, "Please enter your full name (at least 2 characters).");
      valid = false;
    }

    if (!email) {
      showFieldError(emailInput, errors.email, "Please enter your email address.");
      if (valid) { valid = false; emailInput.focus(); }
      valid = false;
    } else if (!validateEmail(email)) {
      showFieldError(emailInput, errors.email, "Please enter a valid email address.");
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, errors.password, "Please create a password.");
      valid = false;
    } else if (password.length < 8) {
      showFieldError(passwordInput, errors.password, "Password must be at least 8 characters.");
      valid = false;
    }

    if (!confirm) {
      showFieldError(confirmInput, errors.confirm, "Please confirm your password.");
      valid = false;
    } else if (password !== confirm) {
      showFieldError(confirmInput, errors.confirm, "Passwords do not match.");
      valid = false;
    }

    if (!termsCheck.checked) {
      errors.terms.textContent = "Please agree to the Terms of Service to continue.";
      errors.terms.classList.add("show");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 900));

    const result = await Auth.signup(name, email, password, phone);

    if (!result.success) {
      setLoading(false);
      errors.global.textContent = result.message;
      errors.global.classList.add("show");
      return;
    }

    Toast.show(`Welcome to the crate, ${name}! 🎉`, "success", 2500);
    await new Promise(r => setTimeout(r, 700));
    window.location.href = "home.html";
  });
});
