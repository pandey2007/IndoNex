/* =========================================================
   IndoNex — Script
   ========================================================= */

// Contact form submissions are emailed to you through Formspree
const FORMSPREE_URL = "https://formspree.io/f/mdeejvvw";

document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  const toTop = document.getElementById("toTop");

  /* ---------- Sticky header + back-to-top ---------- */
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 30);
    toTop.classList.toggle("show", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Mobile menu ---------- */
  const closeMenu = () => {
    navLinks.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  };
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------- Active link on scroll ---------- */
  const sections = document.querySelectorAll("main section[id]");
  const links = navLinks.querySelectorAll("a:not(.btn)");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 90}ms`;
    revealObserver.observe(el);
  });

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.count;
        const duration = 1400;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countObserver.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => countObserver.observe(c));

  /* =========================================================
     CONTACT FORM — validation + WhatsApp
     ========================================================= */
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");

  const nameInput = form.elements["name"];
  const phoneInput = form.elements["phone"];
  const emailInput = form.elements["email"];
  const messageInput = form.elements["message"];

  const errorBox = (field) => document.getElementById(field.id + "Error");

  const setError = (field, msg) => {
    field.classList.toggle("invalid", Boolean(msg));
    const box = errorBox(field);
    if (box) box.textContent = msg || "";
    return !msg;
  };

  /* ---- Name: letters only (no numbers / symbols) ---- */
  // Allows letters (any language), spaces, dot, apostrophe, hyphen
  nameInput.addEventListener("input", () => {
    nameInput.value = nameInput.value.replace(/[^\p{L}\s.'-]/gu, "");
    setError(nameInput, "");
  });

  /* ---- Phone: digits only, max 10 ---- */
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    setError(phoneInput, "");
  });

  /* ---- Email: no spaces, clear error while typing ---- */
  emailInput.addEventListener("input", () => {
    emailInput.value = emailInput.value.replace(/\s/g, "");
    setError(emailInput, "");
  });

  messageInput.addEventListener("input", () => setError(messageInput, ""));

  /* ---- Validators ---- */
  const validateName = () => {
    const v = nameInput.value.trim();
    if (!v) return setError(nameInput, "Please enter your name.");
    if (!/^[\p{L}\s.'-]+$/u.test(v)) return setError(nameInput, "Name can contain letters only.");
    if (v.length < 2) return setError(nameInput, "Name is too short.");
    return setError(nameInput, "");
  };

  const validatePhone = () => {
    const v = phoneInput.value.trim();
    if (!v) return setError(phoneInput, "Please enter your phone number.");
    if (!/^\d+$/.test(v)) return setError(phoneInput, "Phone number can contain digits only.");
    if (!/^[6-9]\d{9}$/.test(v)) return setError(phoneInput, "Enter a valid 10-digit mobile number.");
    return setError(phoneInput, "");
  };

  const validateEmail = () => {
    const v = emailInput.value.trim();
    if (!v) return setError(emailInput, "Please enter your email.");
    if (!v.includes("@")) return setError(emailInput, "Email must contain the @ symbol.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return setError(emailInput, "Enter a valid email, e.g. name@example.com.");
    return setError(emailInput, "");
  };

  const validateMessage = () => {
    if (!messageInput.value.trim()) return setError(messageInput, "Please write a short message.");
    return setError(messageInput, "");
  };

  // Validate each field when the user leaves it
  nameInput.addEventListener("blur", validateName);
  phoneInput.addEventListener("blur", validatePhone);
  emailInput.addEventListener("blur", validateEmail);

  /* ---- Submit ---- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Run all validators (no short-circuit so every error is shown)
    const results = [validateName(), validatePhone(), validateEmail(), validateMessage()];
    if (results.includes(false)) {
      note.textContent = "Please correct the highlighted fields.";
      note.classList.add("error");
      const firstBad = form.querySelector(".invalid");
      if (firstBad) firstBad.focus();
      return;
    }

    // Spam trap: if the hidden field is filled, silently stop
    if (form.elements["_gotcha"] && form.elements["_gotcha"].value) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;

    const payload = {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      email: emailInput.value.trim(),
      service: form.elements["service"].value,
      message: messageInput.value.trim(),
      _subject: `New enquiry from ${nameInput.value.trim()} — ${form.elements["service"].value}`,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    note.classList.remove("error");
    note.textContent = "";

    fetch(FORMSPREE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed");
        note.textContent = "Thank you! Your message has been sent. We'll get back to you soon.";
        form.reset();
      })
      .catch(() => {
        note.classList.add("error");
        note.textContent = "Sorry, something went wrong. Please try again or contact us on WhatsApp.";
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      });
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
});