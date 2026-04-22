const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => document.querySelectorAll(selector);
const siteContent = window.siteContent;
const DEMOS = window.DEMOS || {};
const currentDemoKey = window.currentDemoKey;

if (!siteContent) {
  throw new Error("No se encontro el contenido de la landing. Revisa que content.js cargue antes que script.js.");
}

const waLink = (message) =>
  `https://wa.me/${siteContent.brand.whatsapp}?text=${encodeURIComponent(message)}`;

function setText(selector, value) {
  const node = qs(selector);
  if (node) {
    node.textContent = value;
  }
}

function setLink(selector, href) {
  const node = qs(selector);
  if (node) {
    node.href = href;
    if (href.startsWith("http")) {
      node.target = "_blank";
      node.rel = "noreferrer";
    }
  }
}

function renderMeta() {
  document.title = siteContent.meta.title;
  const metaDescription = document.querySelector('meta[name="description"]');
  metaDescription?.setAttribute("content", siteContent.meta.description);
}

function renderBrand() {
  setText("#brand-name", siteContent.brand.name);
  setText("#brand-tagline", siteContent.brand.tagline);

  const mark = qs("#brand-mark");
  if (!mark) {
    return;
  }

  if (siteContent.brand.logoImage) {
    mark.innerHTML = `<img class="brand-logo-image" src="${siteContent.brand.logoImage}" alt="${siteContent.brand.name} logo" />`;
  } else {
    mark.textContent = siteContent.brand.logoText;
  }

  setLink("#header-whatsapp", waLink(`Hola, quiero consultar por ${siteContent.brand.name}`));
}

function renderDemoSwitch() {
  const switcher = qs("#demo-switcher");
  if (!switcher) {
    return;
  }

  switcher.innerHTML = Object.entries(DEMOS)
    .map(
      ([key, demo]) => `
        <button class="demo-chip ${key === currentDemoKey ? "is-active" : ""}" type="button" data-demo="${key}">
          ${demo.brand.name}
        </button>
      `
    )
    .join("");

  qsa("[data-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextDemo = button.dataset.demo;
      if (nextDemo) {
        window.location.search = `?demo=${nextDemo}`;
      }
    });
  });
}

function renderHero() {
  setText("#hero-eyebrow", siteContent.hero.eyebrow);
  setText("#hero-title", siteContent.hero.title);
  setText("#hero-text", siteContent.hero.text);
  setText("#secondary-cta", siteContent.hero.secondaryCta);

  const heroPoints = qs("#hero-points");
  heroPoints.innerHTML = siteContent.hero.points.map((item) => `<li>${item}</li>`).join("");

  setText("#featured-pill", siteContent.featured.pill);
  setText("#featured-name", siteContent.featured.name);
  setText("#featured-description", siteContent.featured.description);
  setText("#featured-price", siteContent.featured.price);
  setText("#featured-note", siteContent.featured.note);
  setText("#mini-label", siteContent.featured.statsLabel);

  const miniStats = qs("#mini-stats");
  miniStats.innerHTML = siteContent.featured.stats
    .map(
      (item) => `
        <li>
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </li>
      `
    )
    .join("");
}

function renderTrust() {
  setText("#trust-copy", siteContent.trust.copy);

  const trustItems = qs("#trust-items");
  trustItems.innerHTML = siteContent.trust.items.map((item) => `<span>${item}</span>`).join("");
}

function renderCatalog() {
  setText("#catalog-eyebrow", siteContent.catalog.eyebrow);
  setText("#catalog-title", siteContent.catalog.title);
  setText("#catalog-text", siteContent.catalog.text);

  const filterBar = qs("#filter-bar");
  filterBar.innerHTML = siteContent.catalog.filters
    .map(
      (filter, index) => `
        <button
          class="filter-chip ${index === 0 ? "is-active" : ""}"
          type="button"
          data-filter="${filter.value}"
        >
          ${filter.label}
        </button>
      `
    )
    .join("");

  const productGrid = qs("#product-grid");
  productGrid.innerHTML = siteContent.catalog.products
    .map((product) => {
      const customArt = product.image ? `style="background-image: url('${product.image}');"` : "";
      const artClass = product.image ? "product-art-image" : product.artClass;
      const message = `Hola, quiero consultar por las ${product.name}`;

      return `
        <article class="product-card" data-category="${product.category}">
          <div class="product-art ${artClass}" ${customArt}></div>
          <div class="product-copy">
            <div class="product-topline">
              <span class="tag">${product.tag}</span>
              <span class="stock">${product.stock}</span>
            </div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-footer">
              <strong>${product.price}</strong>
              <a href="${waLink(message)}" target="_blank" rel="noreferrer">Consultar</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderBenefits() {
  setText("#benefits-eyebrow", siteContent.benefits.eyebrow);
  setText("#benefits-title", siteContent.benefits.title);

  const benefitGrid = qs("#benefit-grid");
  benefitGrid.innerHTML = siteContent.benefits.items
    .map(
      (item) => `
        <article>
          <h3>${item.title}</h3>
          <p>${item.text}</p>
        </article>
      `
    )
    .join("");
}

function renderReviews() {
  setText("#reviews-eyebrow", siteContent.reviews.eyebrow);
  setText("#reviews-title", siteContent.reviews.title);

  const reviewGrid = qs("#review-grid");
  reviewGrid.innerHTML = siteContent.reviews.items
    .map(
      (item) => `
        <blockquote class="review-card">
          <p>"${item.text}"</p>
          <footer>${item.author}</footer>
        </blockquote>
      `
    )
    .join("");
}

function renderCta() {
  setText("#cta-eyebrow", siteContent.cta.eyebrow);
  setText("#cta-title", siteContent.cta.title);
  setText("#cta-button", siteContent.cta.button);
}

function renderContact() {
  setText("#contact-eyebrow", siteContent.contact.eyebrow);
  setText("#contact-title", siteContent.contact.title);
  setText("#contact-card-title", siteContent.contact.cardTitle);
  setText("#contact-actions-title", siteContent.contact.actionsTitle);
  setText("#contact-note", siteContent.contact.note);

  const contactList = qs("#contact-list");
  contactList.innerHTML = siteContent.contact.details.map((item) => `<li>${item}</li>`).join("");

  setLink("#contact-whatsapp", waLink(`Hola, quiero consultar por ${siteContent.brand.name}`));
  setLink("#contact-instagram", siteContent.brand.instagram);
}

function setupFilters() {
  const chips = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll(".product-card");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;

      chips.forEach((item) => item.classList.remove("is-active"));
      chip.classList.add("is-active");

      cards.forEach((card) => {
        const matches = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !matches);
      });
    });
  });
}

renderMeta();
renderDemoSwitch();
renderBrand();
renderHero();
renderTrust();
renderCatalog();
renderBenefits();
renderReviews();
renderCta();
renderContact();
setupFilters();
