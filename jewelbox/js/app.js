// =====================================================================
// app.js: the "front desk" of jewelbox.
// Switches between the three views (Studio / Library / Stash), switches
// the Studio's Cover / Tracklist / Disc tabs, and checks the Supabase connection.
// =====================================================================

window.JB = window.JB || {};

(function () {
  const VIEWS = ["studio", "library", "stash"];

  // ---------- 1. Views ----------
  // The address bar remembers the view (#studio, #library, #stash), so the
  // browser's back button works and you can share a link to the library.
  function viewFromAddress() {
    const name = location.hash.slice(1);
    return VIEWS.includes(name) ? name : "studio";
  }

  function showView(name) {
    document.querySelectorAll("[data-view]").forEach((section) => {
      section.hidden = section.dataset.view !== name;
    });
    document.querySelectorAll("[data-nav]").forEach((link) => {
      if (link.dataset.nav === name) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (name === "library") loadLibrary();
  }

  // ---------- 2. Studio tabs (Cover / Tracklist / Disc) ----------
  function setupStudioTabs() {
    const tabs = [...document.querySelectorAll('[role="tab"][data-tab]')];
    const panels = [...document.querySelectorAll("[data-panel]")];

    function select(name) {
      tabs.forEach((tab) => {
        const on = tab.dataset.tab === name;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
    }

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab.dataset.tab));
      // Left/right arrow keys move between tabs (standard for tab bars).
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        select(next.dataset.tab);
        next.focus();
      });
    });
  }

  // ---------- 3. Stage 1 previews: paper samples + CD finish ----------
  // These let you try the textures now. Stage 2 replaces them with the
  // real Cover tools.
  function setupPreviews() {
    const cover = document.getElementById("cover-canvas");
    const paperButtons = [...document.querySelectorAll("[data-paper]")];
    const paperClasses = paperButtons.map((b) => "paper--" + b.dataset.paper);

    paperButtons.forEach((button) => {
      button.addEventListener("click", () => {
        cover.classList.remove(...paperClasses);
        cover.classList.add("paper--" + button.dataset.paper);
        paperButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      });
    });

    const disc = document.getElementById("disc-preview");
    document.querySelectorAll("[data-finish]").forEach((button, _, all) => {
      button.addEventListener("click", () => {
        disc.classList.toggle("cd--gold", button.dataset.finish === "gold");
        all.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      });
    });
  }

  // ---------- 4. Community Library (connection check for now) ----------
  let libraryLoading = false;

  async function loadLibrary() {
    if (libraryLoading) return;
    const status = document.getElementById("library-status");
    const grid = document.getElementById("library-grid");

    if (!JB.db.isConfigured()) {
      status.textContent = "The library isn't connected yet. Paste your Supabase Project URL and anon key into jewelbox/config.js.";
      return;
    }

    libraryLoading = true;
    status.textContent = "Flipping through the crate…";
    try {
      const mixes = await JB.db.listMixtapes();
      grid.replaceChildren(...mixes.map(makeClosedCase));
      status.textContent = mixes.length
        ? `${mixes.length} CD${mixes.length === 1 ? "" : "s"} on the shelf.`
        : "Connected! The shelf is empty. Your CD could be the first.";
    } catch (error) {
      console.error(error);
      // "42P01" is Postgres's code for "that table doesn't exist".
      status.textContent = error.code === "42P01" || /does not exist/i.test(error.message || "")
        ? "Connected to Supabase, but the mixtapes table is missing. Run supabase-setup.sql in the SQL Editor."
        : "Couldn't reach the library: " + (error.message || "unknown error");
    } finally {
      libraryLoading = false;
    }
  }

  // A simple closed case for the shelf. Stage 5 replaces this with the full
  // decorated cover and the hinge-open animation.
  // Note: we use textContent (never innerHTML) for anything a visitor typed,
  // so nobody can sneak code into the page through a CD title.
  function makeClosedCase(mix) {
    const item = document.createElement("article");
    item.className = "shelf-item";

    const caseEl = document.createElement("div");
    caseEl.className = "jewel-case jewel-case--small";
    caseEl.innerHTML = '<div class="jewel-case__spine"></div><div class="jewel-case__window"><div class="paper paper--kraft cover-canvas"></div></div>';

    const title = document.createElement("p");
    title.className = "shelf-item__title label-strip";
    title.textContent = mix.title;

    const by = document.createElement("p");
    by.className = "shelf-item__by";
    by.textContent = "by " + mix.creator_name;

    item.append(caseEl, title, by);
    return item;
  }

  // ---------- 5. My Stash (form only for now) ----------
  function setupStash() {
    const form = document.getElementById("stash-form");
    const message = document.getElementById("stash-message");
    form.addEventListener("submit", (e) => {
      e.preventDefault(); // stop the browser from reloading the page
      message.textContent = "My Stash opens in stage 6. Your name + secret word will unlock your CDs here.";
    });
  }

  // ---------- Start everything ----------
  // Any element with data-ransom="some words" gets ransom-note letters.
  // (In index.html these are aria-hidden, with a plain-text copy for screen readers.)
  document.querySelectorAll("[data-ransom]").forEach((el) => {
    el.append(JB.makeRansom(el.dataset.ransom));
  });
  setupStudioTabs();
  setupPreviews();
  setupStash();
  window.addEventListener("hashchange", () => showView(viewFromAddress()));
  showView(viewFromAddress());
})();
