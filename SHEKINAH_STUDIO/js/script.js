/* SHEKINAH STUDIO · interacciones compartidas por las cinco páginas. */
"use strict";

document.documentElement.classList.add("js");

// El mapa y el formulario comparten página, pero tienen accesos móviles distintos.
const currentFile = document.querySelector('.nav-link[aria-current="page"]').getAttribute("href");
const dockLinks = document.querySelectorAll(".dock-link");
function updateDock() {
  const onMap = currentFile === "contacto.html" && location.hash === "#ubicacion";
  dockLinks.forEach((link) => {
    const [file, anchor] = link.getAttribute("href").split("#");
    const active = file === currentFile &&
      (file !== "contacto.html" || (anchor === "ubicacion") === onMap);
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", anchor ? "location" : "page");
    else link.removeAttribute("aria-current");
  });
}
updateDock();
window.addEventListener("hashchange", updateDock);

const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector(".nav-links");
function setMenu(open) {
  menu.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
menuButton.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
menu.addEventListener("click", () => setMenu(false));
document.addEventListener("click", (event) => {
  if (menu.classList.contains("open") && !event.target.closest(".nav")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.classList.contains("open")) {
    setMenu(false);
    menuButton.focus();
  }
});

// El contenido ya es visible en HTML. Solo animamos lo que está fuera de pantalla.
if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove("reveal-pending");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.05 });
  document.querySelectorAll(".reveal").forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight) return;
    item.classList.add("reveal-pending");
    observer.observe(item);
  });
}

const carousel = document.querySelector("#glass-carousel");
if (carousel) {
  const slides = [...carousel.querySelectorAll(".glass-slide")];
  const counter = document.querySelector("#carousel-count");
  let active = Math.max(0, slides.findIndex((slide) => slide.hasAttribute("aria-current")));
  let touchStart;
  let ignoreClickUntil = 0;

  function showSlide(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      let offset = i - active;
      if (offset > slides.length / 2) offset -= slides.length;
      if (offset < -slides.length / 2) offset += slides.length;
      slide.style.setProperty("--offset", offset);
      slide.style.setProperty("--distance", Math.abs(offset));
      slide.dataset.position = String(offset);
      slide.setAttribute("aria-current", String(i === active));
      slide.tabIndex = i === active ? 0 : -1;
    });
    const title = slides[active].querySelector("strong").textContent;
    counter.textContent = (active + 1) + " de " + slides.length + " · " + title;
  }

  slides.forEach((slide, i) => slide.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (performance.now() < ignoreClickUntil) {
      event.preventDefault();
    } else if (i !== active) {
      event.preventDefault();
      showSlide(i);
    }
    // El enlace de la tarjeta central abre su obra o la presentación de la artista.
  }));
  document.querySelector(".carousel-prev").addEventListener("click", () => showSlide(active - 1));
  document.querySelector(".carousel-next").addEventListener("click", () => showSlide(active + 1));
  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showSlide(active + (event.key === "ArrowLeft" ? -1 : 1));
    slides[active].focus({ preventScroll: true });
  });
  carousel.addEventListener("touchstart", (event) => {
    touchStart = event.touches.length === 1 ? event.touches[0] : null;
  }, { passive: true });
  carousel.addEventListener("touchcancel", () => { touchStart = null; });
  carousel.addEventListener("touchend", (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.clientX;
    const dy = event.changedTouches[0].clientY - touchStart.clientY;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      ignoreClickUntil = performance.now() + 350;
      showSlide(active + (dx < 0 ? 1 : -1));
    }
  }, { passive: true });
  showSlide(active);
}

const portfolio = document.querySelector(".portfolio-grid");
if (portfolio) {
  const items = [...portfolio.querySelectorAll(".portfolio-item")];
  const filters = document.querySelectorAll(".filter-btn");
  function selectCategory(category) {
    filters.forEach((button) => {
      const selected = button.dataset.filter === category;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("selected", selected);
    });
    items.forEach((item) => {
      item.hidden = category !== "todos" && item.dataset.category !== category;
    });
  }
  filters.forEach((button) =>
    button.addEventListener("click", () => selectCategory(button.dataset.filter))
  );

  const dialog = document.querySelector("#lightbox");
  if (typeof dialog.showModal === "function") {
    const image = document.querySelector("#lightbox-image");
    const caption = document.querySelector("#lightbox-caption");
    const count = document.querySelector("#lightbox-count");
    let currentItem;
    function visibleItems() {
      return items.filter((item) => !item.hidden);
    }
    function showPhoto(item) {
      currentItem = item;
      const group = visibleItems();
      image.alt = item.querySelector("img").alt;
      image.src = item.href;
      caption.textContent = item.dataset.title;
      count.textContent = (group.indexOf(item) + 1) + " de " + group.length;
      if (!dialog.open) {
        dialog.showModal();
        document.body.classList.add("modal-open");
      }
    }
    function stepPhoto(direction) {
      const group = visibleItems();
      const index = (group.indexOf(currentItem) + direction + group.length) % group.length;
      showPhoto(group[index]);
    }
    items.forEach((item) => item.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showPhoto(item);
    }));
    document.querySelector("#lightbox-prev").addEventListener("click", () => stepPhoto(-1));
    document.querySelector("#lightbox-next").addEventListener("click", () => stepPhoto(1));
    document.querySelector("#close-lightbox").addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      stepPhoto(event.key === "ArrowLeft" ? -1 : 1);
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));

    function openLinkedPhoto() {
      const item = document.getElementById(location.hash.slice(1));
      if (!item || !portfolio.contains(item)) return;
      if (item.hidden) selectCategory("todos");
      item.focus({ preventScroll: true });
      showPhoto(item);
    }
    openLinkedPhoto();
    window.addEventListener("hashchange", openLinkedPhoto);
  }
}

const form = document.querySelector("#contact-form");
if (form) {
  const { nombre, servicio, mensaje, fecha } = form.elements;
  const dateField = document.querySelector("#campo-fecha");
  const messageLabel = document.querySelector("#mensaje-etiqueta");
  const error = document.querySelector("#form-error");
  const whatsappLink = document.querySelector("#contact-whatsapp");
  const bookingServices = ["Tatuaje", "Uñas", "Manicura masculina"];
  const studioCalendar = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
  });

  function updateFields() {
    const print = servicio.value === "Impresión o escáner";
    const booking = !servicio.value || bookingServices.includes(servicio.value);
    dateField.hidden = !booking;
    fecha.disabled = !booking;
    fecha.min = studioCalendar.format(new Date());
    messageLabel.textContent = print ? "¿Qué necesitas imprimir o escanear?" :
      booking ? "Cuéntanos tu idea" : "¿Qué te gustaría consultar?";
    mensaje.placeholder = print ? "Indica el tipo de documento y la cantidad de páginas…" :
      booking ? "Describe lo que tienes en mente…" : "Escribe tu consulta…";
  }
  function clearError() {
    const invalid = form.querySelector('[aria-invalid="true"]');
    if (invalid) {
      invalid.removeAttribute("aria-invalid");
      invalid.removeAttribute("aria-describedby");
    }
    error.textContent = "";
  }
  function showError(field, text) {
    error.textContent = text;
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", "form-error");
    field.focus();
  }
  const requested = new URLSearchParams(location.search).get("servicio");
  if (requested && [...servicio.options].some((option) => option.value === requested)) {
    servicio.value = requested;
  }
  updateFields();
  servicio.addEventListener("change", () => { clearError(); updateFields(); });
  form.addEventListener("input", (event) => {
    if (event.target.hasAttribute("aria-invalid")) clearError();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();
    updateFields();
    if (nombre.value.trim().length < 2) return showError(nombre, "Escribe tu nombre (al menos 2 caracteres).");
    if (!servicio.value) return showError(servicio, "Selecciona el servicio que te interesa.");
    if (mensaje.value.trim().length < 10) return showError(mensaje, "Escribe al menos 10 caracteres para contarnos qué necesitas.");
    if (!fecha.disabled && !fecha.validity.valid) return showError(fecha, "Selecciona una fecha válida de hoy en adelante.");

    const booking = bookingServices.includes(servicio.value);
    const greeting = booking ? "Quiero solicitar una cita." : "Quiero hacer una consulta.";
    const lines = [
      "Hola, SHEKINAH STUDIO. " + greeting, "",
      "Nombre: " + nombre.value.trim(),
      "Servicio: " + servicio.value,
      (booking ? "Mi idea: " : "Consulta: ") + mensaje.value.trim(),
    ];
    if (booking && fecha.value) lines.push("Fecha deseada: " + fecha.value.split("-").reverse().join("/"));
    lines.push("", booking ? "¿Me confirman disponibilidad y cotización?" : "¿Me pueden ayudar con esta solicitud?");
    const url = new URL(whatsappLink.href);
    url.searchParams.set("text", lines.join("\n"));
    window.location.assign(url.href);
  });
}

document.querySelector("#year").textContent = String(new Date().getFullYear());
