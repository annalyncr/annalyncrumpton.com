/* Kelp Forest renderer
   A lightweight Canvas 2D aquarium scene. No external libraries required. */
(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  function rgb(hex) {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? value.split("").map(c => c + c).join("") : value;
    const n = parseInt(full, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  class KelpForestScene {
    constructor(root, options = {}) {
      this.root = root;
      this.canvas = root.querySelector("#kelp-canvas");
      this.ctx = this.canvas.getContext("2d");
      this.options = options;
      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.time = 0;
      this.lastTime = 0;
      this.schoolClock = 0;
      this.schoolDuration = 0;
      this.schoolStartX = -0.15;
      this.schoolDirection = 1;
      this.running = true;
      this.kelp = [];
      this.fish = [];
      this.bubbles = [];
      this.particles = [];
      this.jellyfish = [
        { x: 0.57, y: 0.27, size: 25, phase: 0.4, speed: 0.12, drift: 0.035 },
        { x: 0.91, y: 0.48, size: 17, phase: 2.1, speed: 0.09, drift: 0.025 }
      ];
      this.links = options.links || [];
      this.linkElements = [];
      this.crab = {
        x: 0.52,
        direction: 1,
        speed: 0.00045,
        phase: 0
      };
      this.crabLink = null;
      this.chestLink = null;
      this.starfishHotspot = null;
      this.bottleHotspot = null;
      this.hoveredCreature = null;
      this.hoveredObject = null;
      this.favoritesOpen = false;
      this.soundPopup = root.querySelector("#sound-popup");
      this.soundClose = root.querySelector("#sound-close");
      this.soundMode = root.querySelector("#sound-mode");
      this.soundVolume = root.querySelector("#sound-volume");
      this.soundMute = root.querySelector("#sound-mute");
      this.soundPlay = root.querySelector("#sound-play");
      this.soundEngine = null;
      this.soundMuted = false;
      this.soundLevel = 0.35;
      this.menuButton = root.querySelector("#site-menu-button");
      this.menuPopup = root.querySelector("#site-menu-popup");
      this.menuClose = root.querySelector("#site-menu-close");
      this.shellHotspot = null;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.fieldGuide = root.querySelector("#field-guide");
      this.fieldGuideTitle = root.querySelector("#field-guide-title");
      this.fieldGuideDescription = root.querySelector("#field-guide-description");
      this.fieldGuideClose = root.querySelector("#field-guide-close");
      this.aboutPopup = root.querySelector("#about-popup");
      this.aboutClose = root.querySelector("#about-close");
      this.favoritesPopup = root.querySelector("#favorites-popup");
      this.favoritesClose = root.querySelector("#favorites-close");
      this.creatureDescriptions = {
        leopardShark: ["Leopard shark", "Leopard sharks have a slender body covered in dark saddle-like bars and spots. They usually cruise close to the sandy bottom in shallow bays and estuaries, sometimes patrolling kelp forests."],
        sheephead: ["California sheephead", "California sheephead are wrasses with strong teeth for crushing hard-shelled prey. They hunt actively by day and shelter in rocky crevices at night; adults develop a dark head and tail with a reddish middle."],
        anchovy: ["Northern anchovy", "Northern anchovies travel in shimmering schools. They often swim with their mouths open, filtering tiny plankton from the water."],
        wolfEel: ["Wolf-eel", "Despite its name, the wolf-eel is a fish, not an eel. It lives among rocky crevices and uses powerful jaws and molar-like teeth to crush crabs, urchins and other hard-shelled animals."],
        rockfish: ["Rockfish", "Rockfish often hover almost motionless among kelp blades and rocky ledges. A gas-filled swim bladder helps them maintain their position in the water."],
        garibaldi: ["Garibaldi", "The bright orange garibaldi is a damselfish native to the Pacific coast. It is especially associated with the warmer kelp forests of Southern California."],
        senorita: ["Señorita", "Señoritas are slender wrasses that gather in loose schools from the seafloor to the surface. Their orange bodies and dark tail spots make them easy to recognize."],
        kelpfish: ["Giant kelpfish", "Giant kelpfish have long, blade-like bodies that disappear among seaweed. They can be green, red, brown or silvery, and can change color to better match their surroundings."],
        kelpBass: ["Kelp bass", "Kelp bass are sturdy, mottled fish that shelter around rocky reefs and kelp. They ambush smaller fish and invertebrates and often hold close to structure."],
        swellShark: ["Swell shark", "Swell sharks are small, nocturnal bottom-dwelling sharks. When threatened, they can gulp water to inflate their bodies, making it harder for a predator to pull them from a crevice."],
        hornShark: ["Horn shark", "Horn sharks are slow-moving, bottom-dwelling sharks with blunt heads and small horn-like spines in front of their dorsal fins. They forage among rocks for crabs, molluscs and other invertebrates."],
        jellyfish: ["A drifting visitor", "Jellyfish are not listed among the Monterey Bay Aquarium Kelp Forest exhibit's featured residents; this visitor is part of the wider ocean scene."]
      };

      this.resize = this.resize.bind(this);
      this.frame = this.frame.bind(this);
      this.handleCanvasClick = this.handleCanvasClick.bind(this);
      this.handleCanvasMove = this.handleCanvasMove.bind(this);
      this.handleCanvasLeave = () => { this.hoveredCreature = null; this.canvas.style.cursor = "default"; };
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.resizeObserver = new ResizeObserver(this.resize);
      this.resizeObserver.observe(root);
      window.addEventListener("resize", this.resize, { passive: true });
      this.canvas.addEventListener("click", this.handleCanvasClick);
      this.canvas.addEventListener("pointermove", this.handleCanvasMove);
      this.canvas.addEventListener("pointerleave", this.handleCanvasLeave);
      this.canvas.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.openFieldGuide("fish");
        }
      });
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
      this.fieldGuideClose?.addEventListener("click", () => this.closeFieldGuide());
      this.aboutClose?.addEventListener("click", () => this.closeAbout());
      this.favoritesClose?.addEventListener("click", () => this.closeFavorites());
      this.soundClose?.addEventListener("click", () => this.closeSound());
      this.soundPlay?.addEventListener("click", () => this.toggleSound());
      this.soundMute?.addEventListener("click", () => this.toggleMute());
      this.soundMode?.addEventListener("change", () => this.changeSoundMode());
      this.soundVolume?.addEventListener("input", () => this.setSoundVolume(Number(this.soundVolume.value)));
      this.menuButton?.addEventListener("click", () => this.toggleMenu());
      this.menuClose?.addEventListener("click", () => this.closeMenu());
      this.root.querySelectorAll("[data-menu-action]").forEach(button => button.addEventListener("click", () => this.runMenuAction(button.dataset.menuAction)));
      this.canvas.setAttribute("tabindex", "0");
      this.canvas.setAttribute("role", "button");
      this.canvas.setAttribute("aria-label", "Animated kelp forest. Click or tap a fish or jellyfish to open its field guide.");
      this.canvas.setAttribute("aria-describedby", "creature-help");

      this.createSceneObjects();
      this.createLinks();
      this.createCrabLink();
      this.createChestLink();
      this.createStarfishHotspot();
      this.createBottleHotspot();
      this.createSoundShellHotspot();
      this.populateQuickMenu();
      this.resize();
      this.frame(0);
    }

    handleVisibilityChange() {
      if (document.hidden) {
        this.running = false;
      } else if (!this.running) {
        this.running = true;
        this.lastTime = 0;
        requestAnimationFrame(this.frame);
      }
    }

    openFieldGuide(species) {
      if (!this.fieldGuide) return;
      const [title, description] = this.creatureDescriptions[species] || this.creatureDescriptions.fish;
      this.fieldGuideTitle.textContent = title;
      this.fieldGuideDescription.textContent = description;
      this.fieldGuide.hidden = false;
    }

    closeFieldGuide() {
      if (this.fieldGuide) this.fieldGuide.hidden = true;
    }

    openAbout() {
      if (this.aboutPopup) this.aboutPopup.hidden = false;
    }

    closeAbout() {
      if (this.aboutPopup) this.aboutPopup.hidden = true;
    }

    openFavorites() {
      this.favoritesOpen = true;
      if (this.favoritesPopup) this.favoritesPopup.hidden = false;
    }

    closeFavorites() {
      this.favoritesOpen = false;
      if (this.favoritesPopup) this.favoritesPopup.hidden = true;
    }

    toggleMenu() {
      if (!this.menuPopup) return;
      this.menuPopup.hidden = !this.menuPopup.hidden;
      this.menuButton?.setAttribute("aria-expanded", String(!this.menuPopup.hidden));
    }
    closeMenu() { if (this.menuPopup) this.menuPopup.hidden = true; this.menuButton?.setAttribute("aria-expanded", "false"); }
    populateQuickMenu() {
      const list = this.root.querySelector("#quick-menu-links");
      if (!list) return;
      this.links.forEach(link => {
        const li = document.createElement("li"); const a = document.createElement("a");
        a.href = link.href; a.textContent = link.label;
        if (/^https?:\/\//.test(link.href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        li.appendChild(a); list.appendChild(li);
      });
    }
    runMenuAction(action) {
      this.closeMenu();
      if (action === "favorites") this.openFavorites();
      if (action === "about") this.openAbout();
      if (action === "inspiration") this.openInspiration();
      if (action === "sound") this.openSound();
      if (action === "livecam" && this.options.crab?.href) window.open(this.options.crab.href, "_blank", "noopener,noreferrer");
    }
    createSoundShellHotspot() {
      const button = document.createElement("button");
      button.type = "button"; button.className = "aquarium-hotspot aquarium-shell-hotspot";
      button.dataset.label = "ambient sounds"; button.setAttribute("aria-label", "Open ambient sound player");
      button.addEventListener("click", () => this.openSound());
      Object.assign(button.style, { position:"absolute", zIndex:"22", width:"34px", height:"30px", padding:0, border:0, background:"transparent", transform:"translate(-50%,-50%)", cursor:"pointer" });
      this.root.appendChild(button); this.shellHotspot = button; this.positionShellHotspot();
    }
    positionShellHotspot() {
      if (!this.shellHotspot) return;
      this.shellHotspot.style.left = `${this.width * 0.175}px`;
      this.shellHotspot.style.top = `${this.height * 0.925}px`;
    }
    
    openSound() {
      if (this.soundPopup) this.soundPopup.hidden = false;
    }

    closeSound() {
      if (this.soundPopup) this.soundPopup.hidden = true;
    }

    setSoundVolume(value) {
      this.soundLevel = clamp(value, 0, 1);

      if (this.soundEngine) {
        this.soundEngine.volume = this.soundMuted ? 0 : this.soundLevel;
      }
    }

    toggleMute() {
      this.soundMuted = !this.soundMuted;

      if (this.soundEngine) {
        this.soundEngine.volume = this.soundMuted ? 0 : this.soundLevel;
      }

      if (this.soundMute) {
        this.soundMute.textContent = this.soundMuted ? "unmute" : "mute";
      }
    }

    changeSoundMode() {
      if (this.soundEngine) {
        const wasPlaying = !this.soundEngine.paused;

        this.stopSoundEngine();

        if (wasPlaying) {
          this.startSoundEngine();
        }
      }
    }

    toggleSound() {
      if (this.soundEngine && !this.soundEngine.paused) {
        this.stopSoundEngine();

        if (this.soundPlay) {
          this.soundPlay.textContent = "play";
        }
      } else {
        this.startSoundEngine();
      }
    }

    startSoundEngine() {
      const soundFiles = {
        ocean: "sounds/ocean_waves.mp3",
        dreamscape: "sounds/underwater_dreamscape.mp3",
        guitar: "sounds/calm_guitar.mp3"
      };

      const mode = this.soundMode?.value || "ocean";
      const file = soundFiles[mode] || soundFiles.ocean;

      const audio = new Audio(file);

      audio.loop = true;
      audio.volume = this.soundMuted ? 0 : this.soundLevel;

      this.soundEngine = audio;

      audio.play().then(() => {
        if (this.soundPlay) {
          this.soundPlay.textContent = "pause";
        }
      }).catch(error => {
        console.error("Could not play audio:", error);

        if (this.soundPlay) {
          this.soundPlay.textContent = "play";
        }
      });
    }

    stopSoundEngine() {
      if (!this.soundEngine) return;

      this.soundEngine.pause();
      this.soundEngine.currentTime = 0;
      this.soundEngine = null;

      if (this.soundPlay) {
        this.soundPlay.textContent = "play";
      }
    }

    openInspiration() {
      const url = this.options.inspirationUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }

    handleCanvasMove(event) {
      const rect = this.canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      let hovered = null;
      this.fish.forEach((fish, index) => {
        const fx = fish.x * this.width;
        const fy = fish.y * this.height + Math.sin(this.time * 1.7 + fish.phase) * 7;
        const scale = fish.size * (this.width / 1000 + 0.55) * (["leopardShark", "swellShark", "hornShark"].includes(fish.species) ? 2.25 : fish.species === "wolfEel" ? 1.45 : 1);
        if (Math.hypot(px - fx, py - fy) < Math.max(24, scale * 1.05)) hovered = `fish-${index}`;
      });
      this.jellyfish.forEach((jelly, index) => {
        const jx = jelly.x * this.width;
        const jy = jelly.y * this.height + Math.sin(this.time * jelly.speed + jelly.phase) * 18;
        if (Math.hypot(px - jx, py - jy) < jelly.size * 2.2) hovered = `jelly-${index}`;
      });
      this.hoveredCreature = hovered;
      this.canvas.style.cursor = hovered ? "pointer" : "default";
    }

    handleCanvasClick(event) {
      const rect = this.canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      // The starfish opens inspiration; the bottle opens the about note.
      const starX = this.width * 0.29;
      const starY = this.height * 0.925;
      if (Math.hypot(px - starX, py - starY) < Math.max(38, this.width * 0.045)) {
        this.openInspiration();
        return;
      }
      const bottleX = this.width * 0.48;
      const bottleY = this.height * 0.91;
      if (Math.hypot(px - bottleX, py - bottleY) < Math.max(34, this.width * 0.04)) { this.openAbout(); return; }
      const shellX = this.width * 0.175, shellY = this.height * 0.925;
      if (Math.hypot(px-shellX, py-shellY) < Math.max(24, this.width*0.03)) { this.openSound(); return; }

      let nearest = null;
      let nearestDistance = Infinity;

      this.fish.forEach(fish => {
        const fx = fish.x * this.width;
        const fy = fish.y * this.height + Math.sin(this.time * 1.7 + fish.phase) * 7;
        const scale = fish.size * (this.width / 1000 + 0.55) * (["leopardShark", "swellShark", "hornShark"].includes(fish.species) ? 2.25 : fish.species === "wolfEel" ? 1.45 : 1);
        const distance = Math.hypot(px - fx, py - fy);
        const hitRadius = Math.max(24, scale * (fish.species === "wolfEel" ? 1.25 : 0.9));
        if (distance < hitRadius && distance < nearestDistance) {
          nearest = fish.species;
          nearestDistance = distance;
        }
      });

      this.jellyfish.forEach(jelly => {
        const jx = jelly.x * this.width;
        const jy = jelly.y * this.height + Math.sin(this.time * jelly.speed + jelly.phase) * 18;
        const distance = Math.hypot(px - jx, py - jy);
        if (distance < jelly.size * 2.2 && distance < nearestDistance) {
          nearest = "jellyfish";
          nearestDistance = distance;
        }
      });

      if (nearest) this.openFieldGuide(nearest);
    }

    createSceneObjects() {
      // Kelp grows in irregular groves, not evenly spaced individual stalks.
      // Several overlapping clusters create the dense upper canopy seen in Monterey Bay.
      const kelpCount = this.options.kelpCount || 29;
      const fishCount = Math.max(this.options.fishCount || 9, this.links.length);
      const bubbleCount = this.options.bubbleCount || 34;
      const groveCenters = [0.08, 0.27, 0.48, 0.69, 0.91];

      for (let i = 0; i < kelpCount; i++) {
        const grove = groveCenters[i % groveCenters.length];
        const x = clamp(grove + rand(-0.105, 0.105), 0.015, 0.985);
        const tall = Math.random() < 0.72;
        this.kelp.push({
          x,
          height: tall ? rand(0.62, 0.86) : rand(0.34, 0.59),
          width: rand(7, 15),
          phase: rand(0, TAU),
          speed: rand(0.32, 0.78),
          leaves: Math.floor(rand(10, 17)),
          branches: Math.floor(rand(2, 5)),
          hue: rand(0, 1),
          depth: rand(0.38, 1),
          canopyReach: rand(0.12, 0.25),
          seed: rand(0, 100)
        });
      }

      const kinds = ["silver", "gold", "olive", "blue"];
      const residents = ["leopardShark", "sheephead", "anchovy", "wolfEel", "rockfish", "garibaldi", "senorita", "kelpfish", "kelpBass", "swellShark", "hornShark"];
      for (let i = 0; i < fishCount; i++) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const linkedPage = this.links[i];
        this.fish.push({
          // The first fish are paired with the navigation links, so each
          // button can travel with its own fish.
          linkIndex: linkedPage ? i : null,
          x: linkedPage ? clamp(linkedPage.x ?? rand(0.15, 0.85), 0.12, 0.88) : rand(-0.2, 1.2),
          y: linkedPage ? clamp(linkedPage.y ?? rand(0.22, 0.78), 0.18, 0.82) : rand(0.22, 0.78),
          size: rand(17, 34),
          speed: rand(0.018, 0.055) * direction,
          direction,
          phase: rand(0, TAU),
          kind: kinds[i % kinds.length],
          species: residents[i % residents.length],
          depth: rand(0.35, 0.85)
        });
      }

      for (let i = 0; i < bubbleCount; i++) {
        this.bubbles.push(this.newBubble(true));
      }
      for (let i = 0; i < 65; i++) {
        this.particles.push({
          x: Math.random(),
          y: Math.random(),
          r: rand(0.5, 2),
          drift: rand(0.003, 0.012),
          phase: rand(0, TAU),
          alpha: rand(0.12, 0.42)
        });
      }
    }

    newBubble(initial = false) {
      return {
        x: rand(0.03, 0.97),
        y: initial ? Math.random() : rand(1.02, 1.18),
        r: rand(1.2, 4.2),
        // Bubbles should drift slowly enough to feel buoyant, not shoot upward.
        speed: rand(0.0001, .001),
        drift: rand(0.004, 0.016),
        phase: rand(0, TAU),
        alpha: rand(0.18, 0.48)
      };
    }

    createLinks() {
      const nav = this.root.querySelector("#aquarium-links");
      if (!nav) return;
      this.links.forEach((link, index) => {
        const a = document.createElement("a");
        a.className = "aquarium-link";
        a.href = link.href;
        a.textContent = link.label;
        a.style.setProperty("--tint", rgb(link.tint || "#dcebe4"));
        a.style.setProperty("--ink", link.ink || "#f3eee6");
        a.setAttribute("aria-label", link.label);
        if (link.href && /^https?:\/\//.test(link.href)) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        a.addEventListener("pointerenter", () => { this.hoveredObject = `link-${index}`; });
        a.addEventListener("pointerleave", () => { this.hoveredObject = null; });
        nav.appendChild(a);
        this.linkElements.push({ element: a, data: link, index });
        window.setTimeout(() => a.classList.add("is-visible"), 700 + index * 180);
      });
    }

    createChestLink() {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "aquarium-hotspot aquarium-chest-link";
      button.dataset.label = "my favorites";
      button.setAttribute("aria-label", "Open my favorites");
      button.addEventListener("click", () => this.openFavorites());
      button.addEventListener("pointerenter", () => { this.hoveredObject = "chest"; });
      button.addEventListener("pointerleave", () => { this.hoveredObject = null; });
      Object.assign(button.style, {
        position: "absolute", display: "block", background: "transparent",
        border: "0", padding: "0", zIndex: "20", cursor: "pointer"
      });
      this.root.appendChild(button);
      this.chestLink = button;
    }


    createCrabLink() {
      const crabOptions = this.options.crab || {};
      if (!crabOptions.href) return;

      const a = document.createElement("a");
      a.href = crabOptions.href;
      a.className = "aquarium-crab-link aquarium-hotspot";
      a.addEventListener("pointerenter", () => { this.hoveredObject = "crab"; });
      a.addEventListener("pointerleave", () => { this.hoveredObject = null; });
      a.dataset.label = "kelp forest live cam";
      a.setAttribute("aria-label", "Kelp forest live cam");

      if (/^https?:\/\//.test(crabOptions.href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }

      Object.assign(a.style, {
        position: "absolute",
        width: "76px",
        height: "54px",
        transform: "translate(-50%, -50%)",
        zIndex: "20",
        background: "transparent",
        cursor: "pointer"
      });

      this.root.appendChild(a);
      this.crabLink = a;
    }

createStarfishHotspot() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "aquarium-hotspot aquarium-starfish-hotspot";
  button.dataset.label = "inspiration";
  button.setAttribute("aria-label", "Open inspiration");
  button.addEventListener("click", () => this.openInspiration());
  button.addEventListener("pointerenter", () => { this.hoveredObject = "starfish"; });
  button.addEventListener("pointerleave", () => { this.hoveredObject = null; });
  Object.assign(button.style, {
    position: "absolute",
    zIndex: "21",
    width: "54px",
    height: "54px",
    padding: "0",
    border: "0",
    background: "transparent",
    transform: "translate(-50%, -50%)",
    cursor: "pointer"
  });
  this.root.appendChild(button);
  this.starfishHotspot = button;
  this.positionStarfishHotspot();
}


createBottleHotspot() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "aquarium-hotspot aquarium-bottle-hotspot";
  button.dataset.label = "a message in a bottle";
  button.setAttribute("aria-label", "Read my about message");
  button.addEventListener("click", () => this.openAbout());
  button.addEventListener("pointerenter", () => { this.hoveredObject = "bottle"; });
  button.addEventListener("pointerleave", () => { this.hoveredObject = null; });
  Object.assign(button.style, {
    position: "absolute", zIndex: "21", width: "38px", height: "42px",
    padding: "0", border: "0", background: "transparent",
    transform: "translate(-50%, -50%)", cursor: "pointer"
  });
  this.root.appendChild(button);
  this.bottleHotspot = button;
  this.positionBottleHotspot();
}

positionBottleHotspot() {
  if (!this.bottleHotspot) return;
  this.bottleHotspot.style.left = `${this.width * 0.48}px`;
  this.bottleHotspot.style.top = `${this.height * 0.91}px`;
}

positionStarfishHotspot() {
  if (!this.starfishHotspot) return;
  this.starfishHotspot.style.left = `${this.width * 0.29}px`;
  this.starfishHotspot.style.top = `${this.height * 0.925}px`;
}

positionCrabLink() {
  if (!this.crabLink) return;

  const x = this.crab.x * this.width;
  const groundY = this.height * 0.89
    + 7
    + Math.sin(x * 0.018) * 7
    + Math.sin(x * 0.043) * 3;

  this.crabLink.style.left = `${x}px`;
  this.crabLink.style.top = `${groundY - 10}px`;
}


positionChestLink() {
  if (!this.chestLink) return;

  const w = this.width;
  const h = this.height;

  const chestX = w * 0.1;
  const groundY = h * 0.89 + 7
    + Math.sin(chestX * 0.018) * 7
    + Math.sin(chestX * 0.043) * 3;

  const s = w / 1000 + 0.55;

  const chestScale = s * 1.38;
  this.chestLink.style.left = `${chestX - 25 * chestScale}px`;
  this.chestLink.style.top = `${groundY - 42 * chestScale}px`;
  this.chestLink.style.width = `${50 * chestScale}px`;
  this.chestLink.style.height = `${45 * chestScale}px`;
}

    resize() {
      const rect = this.root.getBoundingClientRect();
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.positionLinks();
      this.positionStarfishHotspot();
      this.positionBottleHotspot();
      this.positionShellHotspot();
    }

    positionLinks() {
      this.linkElements.forEach(({ element, index }) => {
        const linkedFish = this.fish.find(fish => fish.linkIndex === index);
        if (!linkedFish) return;

        const fishX = linkedFish.x * this.width;
        const fishY = linkedFish.y * this.height
          + Math.sin(this.time * 1.7 + linkedFish.phase) * 7;

        // Place the caption above its fish and keep it within the visible scene.
        const fishScale = this.width / 1000 + 0.55;
        const buttonY = fishY - linkedFish.size * fishScale * 0.9 - 18;
        const halfButtonWidth = Math.min(element.offsetWidth / 2, this.width / 2 - 8);
        const buttonX = clamp(fishX, halfButtonWidth + 8, this.width - halfButtonWidth - 8);

        element.style.left = `${buttonX}px`;
        element.style.top = `${clamp(buttonY, 34, this.height - 34)}px`;
      });
    }

    drawBackground(ctx) {
      const w = this.width, h = this.height;
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "#39717a");
      gradient.addColorStop(0.18, "#245c68");
      gradient.addColorStop(0.52, "#124452");
      gradient.addColorStop(1, "#082a36");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // Sunlit surface glow.
      const glow = ctx.createRadialGradient(w * 0.52, -h * 0.05, 5, w * 0.52, h * 0.16, h * 0.78);
      glow.addColorStop(0, "rgba(218, 231, 190, 0.25)");
      glow.addColorStop(0.45, "rgba(132, 190, 169, 0.09)");
      glow.addColorStop(1, "rgba(132, 190, 169, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Subtle surface ripples.
      ctx.save();
      ctx.strokeStyle = "rgba(207, 232, 211, 0.14)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const y = 12 + i * 3.5;
        ctx.beginPath();
        for (let x = 0; x <= w + 8; x += 8) {
          const yy = y + Math.sin(x * 0.012 + this.time * 0.8 + i) * 2;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Long, softly blurred shafts of light.
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 7; i++) {
        const x = w * (0.12 + i * 0.14) + Math.sin(this.time * 0.12 + i) * 28;
        const beam = ctx.createLinearGradient(x, 0, x + 80, h * 0.86);
        beam.addColorStop(0, "rgba(220, 235, 194, 0.10)");
        beam.addColorStop(0.55, "rgba(190, 222, 188, 0.035)");
        beam.addColorStop(1, "rgba(190, 222, 188, 0)");
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(x - 16, 0);
        ctx.lineTo(x + 20, 0);
        ctx.lineTo(x + 160, h);
        ctx.lineTo(x + 62, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    drawSeafloor(ctx) {
      const w = this.width, h = this.height;
      const top = h * 0.89;
      ctx.save();
      const sand = ctx.createLinearGradient(0, top, 0, h);
      sand.addColorStop(0, "#344e48");
      sand.addColorStop(0.28, "#263f3b");
      sand.addColorStop(1, "#142d31");
      ctx.fillStyle = sand;
      ctx.beginPath();
      ctx.moveTo(0, top + 8);
      for (let x = 0; x <= w + 30; x += 30) {
        ctx.lineTo(x, top + 7 + Math.sin(x * 0.018) * 7 + Math.sin(x * 0.043) * 3);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Rock silhouettes.
      for (let i = 0; i < Math.ceil(w / 65); i++) {
        const x = i * 65 + 12;
        const r = 12 + (i % 4) * 5;
        const rockAngle = ((i % 3) - 1) * 0.05; // fixed angle: rocks stay still
        ctx.fillStyle = i % 2 ? "#263e3c" : "#304744";
        ctx.beginPath();
        ctx.ellipse(x, top + 16, r, r * 0.56, rockAngle, Math.PI, 0);
        ctx.fill();
      }
      ctx.restore();
    }

    drawSeafloorDecorations(ctx) {
      const w = this.width, h = this.height;
      const top = h * 0.89;
      ctx.save();
      // Tufts of seagrass, scattered shells, and small anemone-like plants.
      for (let i = 0; i < Math.ceil(w / 115); i++) {
        const gx = 28 + i * 115 + (i % 2) * 22;
        const gy = top + 17 + (i % 3) * 3;
        ctx.save();
        ctx.lineCap = "round";
        for (let blade = 0; blade < 5; blade++) {
          const lean = (blade - 2) * 8;
          ctx.beginPath();
          ctx.moveTo(gx, gy + 8);
          ctx.quadraticCurveTo(gx + lean * 0.4, gy - 7, gx + lean + Math.sin(this.time + i + blade) * 2, gy - 22 - (blade % 3) * 6);
          ctx.strokeStyle = ["#56866b", "#72966d", "#3f765f"][blade % 3];
          ctx.lineWidth = 2.4;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Purple sea urchins with fine spines.
      [0.13, 0.57, 0.83].forEach((pos, index) => {
        const ux = w * pos;
        const uy = top + 17 + (index % 2) * 5;
        const radius = Math.max(5, Math.min(8, w * 0.008));
        ctx.save();
        ctx.translate(ux, uy);
        ctx.strokeStyle = "#8d7890";
        ctx.lineWidth = 1.5;
        for (let spike = 0; spike < 12; spike++) {
          const a = spike * TAU / 12;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * radius * 0.55, Math.sin(a) * radius * 0.55);
          ctx.lineTo(Math.cos(a) * radius * 1.8, Math.sin(a) * radius * 1.8);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, TAU);
        ctx.fillStyle = "#554d70";
        ctx.fill();
        ctx.restore();
      });

      // Tiny pale shells resting in the sand.
      for (let i = 0; i < 8; i++) {
        const sx = w * (0.06 + i * 0.123);
        const sy = top + 22 + (i % 3) * 5;
        ctx.fillStyle = "rgba(222, 207, 174, 0.72)";
        ctx.beginPath();
        ctx.ellipse(sx, sy, 4.5, 2.5, (i % 2 ? -0.25 : 0.25), Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = "rgba(125, 119, 96, 0.65)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      ctx.restore();
    }

    drawSoundShell(ctx) {
      const x = this.width * 0.175, y = this.height * 0.925, s = this.width / 1000 + 0.55;
      ctx.save();
      if (this.hoveredObject === "sound-shell") this.drawHoverGlow(ctx, x, y, 20*s);
      ctx.translate(x, y);
      ctx.rotate(-0.12);
      // A small fan-shaped scallop shell with a softly ridged, curved edge.
      ctx.fillStyle = "#e8c9b5";
      ctx.strokeStyle = "#f7e5d7";
      ctx.lineWidth = 1.25 * s;
      ctx.beginPath();
      ctx.moveTo(-12*s, 7*s);
      ctx.quadraticCurveTo(-17*s, -2*s, -12*s, -10*s);
      ctx.quadraticCurveTo(-8*s, -17*s, -3*s, -13*s);
      ctx.quadraticCurveTo(2*s, -19*s, 6*s, -13*s);
      ctx.quadraticCurveTo(14*s, -15*s, 15*s, -6*s);
      ctx.quadraticCurveTo(18*s, 2*s, 11*s, 9*s);
      ctx.quadraticCurveTo(0, 13*s, -12*s, 7*s);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(160, 111, 103, 0.62)";
      ctx.lineWidth = 0.9 * s;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 2.5*s, 8*s);
        ctx.quadraticCurveTo(i * 3.5*s, -1*s, i * 4.2*s, -12*s);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255, 244, 228, 0.8)";
      ctx.beginPath(); ctx.ellipse(0, 7*s, 3.5*s, 1.5*s, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }

    drawMessageBottle(ctx) {
      const x = this.width * 0.48;
      const y = this.height * 0.91;
      const s = (this.width / 1000 + 0.55) * 0.72;
      ctx.save();
      if (this.hoveredObject === "bottle") this.drawHoverGlow(ctx, x, y, 24 * s);
      ctx.translate(x, y);
      ctx.rotate(-0.22);
      ctx.shadowColor = "rgba(164, 221, 220, 0.45)";
      ctx.shadowBlur = 9;
      ctx.fillStyle = "rgba(173, 211, 201, 0.48)";
      ctx.strokeStyle = "rgba(225, 241, 218, 0.9)";
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(-6*s, -19*s); ctx.lineTo(-6*s, -25*s);
      ctx.lineTo(-3*s, -29*s); ctx.lineTo(3*s, -29*s);
      ctx.lineTo(6*s, -25*s); ctx.lineTo(6*s, -19*s);
      ctx.quadraticCurveTo(13*s, -14*s, 13*s, -5*s);
      ctx.lineTo(13*s, 16*s); ctx.quadraticCurveTo(13*s, 22*s, 7*s, 22*s);
      ctx.lineTo(-7*s, 22*s); ctx.quadraticCurveTo(-13*s, 22*s, -13*s, 16*s);
      ctx.lineTo(-13*s, -5*s); ctx.quadraticCurveTo(-13*s, -14*s, -6*s, -19*s);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(242, 225, 174, 0.88)";
      ctx.fillRect(-7*s, -2*s, 14*s, 10*s);
      ctx.strokeStyle = "rgba(255,255,255,0.48)";
      ctx.beginPath(); ctx.moveTo(-7*s, -12*s); ctx.lineTo(-7*s, 13*s); ctx.stroke();
      ctx.restore();
    }

    drawAboutStarfish(ctx) {
      const x = this.width * 0.29;
      const y = this.height * 0.925;
      const r = Math.max(10, Math.min(15, this.width * 0.014));
      ctx.save();
      if (this.hoveredObject === "starfish") this.drawHoverGlow(ctx, x, y, 23);
      ctx.translate(x, y);
      ctx.rotate(-0.18);
      ctx.beginPath();
      for (let point = 0; point < 10; point++) {
        const angle = -Math.PI / 2 + point * Math.PI / 5;
        const radius = point % 2 === 0 ? r : r * 0.43;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = "#d88a67";
      ctx.strokeStyle = "#f0b18a";
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 226, 185, 0.8)";
      [[-3,-2],[3,1],[0,5]].forEach(([dx,dy]) => { ctx.beginPath(); ctx.arc(dx,dy,1.1,0,TAU); ctx.fill(); });
      ctx.fillStyle = "#f2e9d7";
      ctx.font = "600 10px Geist, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 5;
      ctx.restore();
    }

    drawFishSchool(ctx, dt) {
      if (!this.reducedMotion) {
        this.schoolClock += dt / 60;
        if (this.schoolDuration > 0) this.schoolDuration -= dt / 60;
        else if (this.schoolClock > 17) {
          this.schoolClock = 0;
          this.schoolDuration = 5.5;
          this.schoolDirection = Math.random() > 0.5 ? 1 : -1;
          this.schoolStartX = this.schoolDirection > 0 ? -0.12 : 1.12;
        }
      }
      if (this.schoolDuration <= 0) return;
      const progress = 1 - this.schoolDuration / 5.5;
      const centerX = this.schoolStartX + this.schoolDirection * progress * 1.24;
      const centerY = this.height * 0.115;
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.schoolDuration * 1.5);
      for (let i = 0; i < 30; i++) {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const offsetX = (col - 2.5 + (row % 2) * 0.45) * 12;
        const offsetY = (row - 2) * 8 + Math.sin(this.time * 5 + i) * 1.4;
        const x = centerX * this.width + offsetX * this.schoolDirection;
        const y = centerY + offsetY;
        const size = 2.1 + (i % 3) * 0.35;
        ctx.save();
        ctx.translate(x, y);
        if (this.schoolDirection < 0) ctx.scale(-1, 1);
        ctx.fillStyle = i % 4 === 0 ? "#d7e5d1" : "#a9c9bd";
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.5, size * 0.8, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-size, 0);
        ctx.lineTo(-size * 2.2, -size * 0.9);
        ctx.lineTo(-size * 2.2, size * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    drawKelp(ctx, plant, index) {
      const w = this.width, h = this.height;
      const baseX = plant.x * w;
      const baseY = h * (0.91 + (1 - plant.depth) * 0.015);
      const stemHeight = plant.height * h;
      const motion = this.reducedMotion ? 0 : Math.sin(this.time * plant.speed + plant.phase);
      const sway = motion * (12 + plant.depth * 12);
      const topX = baseX + sway;
      const dark = plant.depth < 0.58;
      const stemColor = plant.hue > 0.52 ? (dark ? "#456f55" : "#5b8960") : (dark ? "#3e7158" : "#4e805d");
      const bladeA = plant.hue > 0.52 ? "#789b58" : "#65945d";
      const bladeB = plant.hue > 0.52 ? "#426f4d" : "#397653";
      const alpha = 0.46 + plant.depth * 0.43;
      const scale = Math.max(0.72, w / 1000);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // A flexible, slightly irregular stipe rising from a rocky holdfast.
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.bezierCurveTo(baseX - sway * 0.2, baseY - stemHeight * 0.32,
        topX + sway * 0.25, baseY - stemHeight * 0.7, topX, baseY - stemHeight);
      ctx.strokeStyle = stemColor;
      ctx.lineWidth = plant.width * scale * 0.48;
      ctx.stroke();

      // A few lateral stipes branch from the main one, giving each grove a tangled silhouette.
      for (let b = 0; b < plant.branches; b++) {
        const t = 0.43 + b * (0.105 + plant.seed * 0.0002);
        const by = baseY - stemHeight * Math.min(t, 0.82);
        const bx = baseX + sway * t * t;
        const side = b % 2 ? 1 : -1;
        const reach = (22 + (b % 3) * 11) * scale;
        const branchWave = this.reducedMotion ? 0 : Math.sin(this.time * plant.speed + plant.phase + b) * 7;
        const ex = bx + side * reach + branchWave;
        const ey = by - stemHeight * (0.17 + (b % 2) * 0.055);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + side * reach * 0.5, by - 10 * scale, ex, ey);
        ctx.strokeStyle = stemColor;
        ctx.lineWidth = plant.width * scale * 0.25;
        ctx.stroke();
      }

      // Alternating blades with a broad base and tapered, gently curling tips.
      for (let i = 0; i < plant.leaves; i++) {
        const t = (i + 1) / (plant.leaves + 1);
        const y = baseY - stemHeight * t;
        const centerX = baseX + sway * t * t;
        const side = i % 2 === 0 ? -1 : 1;
        const length = (25 + 54 * (1 - t)) * scale;
        const wave = this.reducedMotion ? 0 : Math.sin(this.time * 0.82 + plant.phase + i * 0.63) * 7 * scale;
        const endX = centerX + side * length + wave;
        const endY = y - length * (0.38 + 0.12 * Math.sin(i * 1.7));
        const width = (3.5 + 2.5 * (1 - t)) * scale;
        const grad = ctx.createLinearGradient(centerX, y, endX, endY);
        grad.addColorStop(0, bladeA);
        grad.addColorStop(1, bladeB);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.quadraticCurveTo(centerX + side * length * 0.48 + wave * 0.4, y - length * 0.12 - width,
          centerX + side * length * 0.78 + wave, y - length * 0.29);
        ctx.quadraticCurveTo(endX + side * width * 0.25, endY + width * 0.5, endX, endY);
        ctx.quadraticCurveTo(centerX + side * length * 0.48, y - length * 0.17 + width,
          centerX, y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(207, 218, 154, 0.18)";
        ctx.lineWidth = 0.75 * scale;
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.quadraticCurveTo(centerX + side * length * 0.5 + wave * 0.4, y - length * 0.2, endX, endY);
        ctx.stroke();

        // Tiny pneumatocysts (gas floats) sit near the base of selected blades.
        if (i % 3 === 0) {
          ctx.fillStyle = "rgba(190, 174, 105, 0.72)";
          ctx.beginPath();
          ctx.ellipse(centerX + side * 2.2 * scale, y - 1.5 * scale,
            2.5 * scale, 3.4 * scale, side * 0.2, 0, TAU);
          ctx.fill();
        }
      }

      // Long upper fronds fan outward and overlap neighboring plants to form a surface canopy.
      const canopyY = Math.max(h * 0.055, baseY - stemHeight * 0.93);
      for (let c = 0; c < 3; c++) {
        const side = c === 1 ? -1 : 1;
        const reach = plant.canopyReach * w * (c === 2 ? 0.72 : 1);
        const drift = this.reducedMotion ? 0 : Math.sin(this.time * plant.speed * 0.7 + plant.phase + c) * 8;
        const sx = topX + side * c * 5 * scale;
        const sy = canopyY + c * 5 * scale;
        const ex = sx + side * reach + drift;
        const ey = Math.max(h * 0.035, sy + (c - 1) * 7 * scale);
        const belly = (9 + (c % 2) * 3) * scale;
        ctx.fillStyle = c % 2 ? "rgba(91, 137, 77, 0.84)" : "rgba(111, 151, 83, 0.88)";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx + side * reach * 0.28, sy - belly,
          sx + side * reach * 0.72 + drift, ey - belly * 0.55, ex, ey);
        ctx.bezierCurveTo(sx + side * reach * 0.7 + drift, ey + belly * 0.7,
          sx + side * reach * 0.25, sy + belly * 0.9, sx, sy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(202, 211, 151, 0.22)";
        ctx.lineWidth = 0.8 * scale;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + side * reach * 0.5 + drift, ey - 1, ex, ey);
        ctx.stroke();
      }

      // Root-like holdfast, visible where the stipe meets the reef.
      ctx.strokeStyle = "rgba(76, 94, 61, 0.75)";
      ctx.lineWidth = 1.4 * scale;
      for (let r = 0; r < 5; r++) {
        const angle = (r / 5) * TAU + plant.phase;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY - 2 * scale);
        ctx.quadraticCurveTo(baseX + Math.cos(angle) * 5 * scale, baseY + 3 * scale,
          baseX + Math.cos(angle) * (10 + (r % 2) * 3) * scale,
          baseY + Math.sin(angle) * 4 * scale);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawCaveAndTreasure(ctx) {
      const w = this.width;
      const h = this.height;
      const groundY = h * 0.89 + 7
        + Math.sin(w * 0.91 * 0.018) * 7
        + Math.sin(w * 0.91 * 0.043) * 3;

      const s = w / 1000 + 0.55;

      // -------------------------
      // TREASURE CHEST
      // -------------------------
      const chestX = w * 0.1;
      const chestY = groundY + 5;
      const chestScale = s * 1.38;
      if (this.hoveredObject === "chest") this.drawHoverGlow(ctx, chestX, chestY - 15 * chestScale, 31 * chestScale);

      ctx.save();
      ctx.translate(chestX, chestY);

      // Shadow underneath chest.
      ctx.fillStyle = "rgba(5, 23, 26, 0.35)";
      ctx.beginPath();
      ctx.ellipse(0, 2 * chestScale, 25 * chestScale, 6 * chestScale, 0, 0, TAU);
      ctx.fill();

      // Wooden chest body.
      ctx.fillStyle = "#805536";
      ctx.fillRect(-20 * chestScale, -20 * chestScale, 40 * chestScale, 19 * chestScale);

      // Chest lid.
      ctx.fillStyle = "#a16b3e";
      ctx.beginPath();
      if (this.favoritesOpen) {
        ctx.moveTo(-20 * chestScale, -21 * chestScale);
        ctx.lineTo(-29 * chestScale, -43 * chestScale);
        ctx.quadraticCurveTo(0, -55 * chestScale, 29 * chestScale, -43 * chestScale);
        ctx.lineTo(20 * chestScale, -21 * chestScale);
      } else {
        ctx.moveTo(-20 * chestScale, -20 * chestScale);
        ctx.lineTo(-17 * chestScale, -30 * chestScale);
        ctx.quadraticCurveTo(0, -39 * chestScale, 17 * chestScale, -30 * chestScale);
        ctx.lineTo(20 * chestScale, -20 * chestScale);
      }
      ctx.closePath(); ctx.fill();

      // Lid highlight.
      ctx.strokeStyle = "#c18a55";
      ctx.lineWidth = 2 * chestScale;
      ctx.beginPath();
      ctx.moveTo(-15 * chestScale, -28 * chestScale);
      ctx.quadraticCurveTo(0, -35 * chestScale, 15 * chestScale, -28 * chestScale);
      ctx.stroke();

      // Chest wooden planks.
      ctx.strokeStyle = "#533d2e";
      ctx.lineWidth = 1.5 * chestScale;
      ctx.beginPath();
      ctx.moveTo(-10 * chestScale, -19 * chestScale);
      ctx.lineTo(-10 * chestScale, -2 * chestScale);
      ctx.moveTo(10 * chestScale, -19 * chestScale);
      ctx.lineTo(10 * chestScale, -2 * chestScale);
      ctx.stroke();

      // Gold bands.
      ctx.fillStyle = "#d4ad58";
      ctx.fillRect(-20 * chestScale, -20 * chestScale, 4 * chestScale, 19 * chestScale);
      ctx.fillRect(16 * chestScale, -20 * chestScale, 4 * chestScale, 19 * chestScale);

      // Gold lock.
      ctx.fillStyle = "#e5c36d";
      ctx.fillRect(-4 * chestScale, -17 * chestScale, 8 * chestScale, 10 * chestScale);
      ctx.fillStyle = "#79552e";
      ctx.beginPath();
      ctx.arc(0, -12 * chestScale, 1.5 * chestScale, 0, TAU);
      ctx.fill();

      ctx.restore();

      // -------------------------
      // ROCK CAVE
      // -------------------------
      const caveX = w * 0.92;
      const caveY = groundY;

      ctx.save();
      ctx.translate(caveX, caveY);

      // Dark shadow behind the cave.
      ctx.fillStyle = "#152f31";
      ctx.beginPath();
      ctx.ellipse(-45 * s, -2 * s, 17 * s, 9 * s, 0, 0, TAU);
      ctx.ellipse(45 * s, -2 * s, 17 * s, 9 * s, 0, 0, TAU);
      ctx.fill();

      // Dark cave opening.
      ctx.fillStyle = "#071d25";
      ctx.beginPath();
      ctx.ellipse(0, -29 * s, 35 * s, 29 * s, 0, Math.PI, TAU);
      ctx.lineTo(50 * s, 0);
      ctx.lineTo(-50 * s, 0);
      ctx.closePath();
      ctx.fill();

      // A subtle blue-green glow deep inside.
      const glow = ctx.createRadialGradient(
        0, -20 * s, 2 * s,
        0, -20 * s, 25 * s
      );
      glow.addColorStop(0, "rgba(43, 83, 79, 0.35)");
      glow.addColorStop(1, "rgba(7, 29, 37, 0)");
      ctx.fillStyle = glow;
      ctx.fill();

      // Rounded rocks forming the cave.
      const rocks = [
      [-48, -17, 17, 13],
      [-35, -38, 18, 15],
      [-10, -47, 20, 16],
      [18, -44, 19, 15],
      [43, -29, 17, 14],
      [54, -8, 13, 11]
    ];

    rocks.forEach(([x, y, rx, ry], i) => {
      ctx.fillStyle = i % 2 === 0 ? "#405b53" : "#52675a";

      ctx.beginPath();
      ctx.ellipse(
        x * s,
        y * s,
        rx * s,
        ry * s,
        0,
        0,
        TAU
      );
      ctx.fill();

      // Soft highlight on each rounded rock.
      ctx.strokeStyle = "rgba(159, 179, 143, 0.25)";
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.ellipse(
        x * s - 3 * s,
        y * s - 3 * s,
        rx * 0.65 * s,
        ry * 0.55 * s,
        0,
        Math.PI,
        TAU
      );
      ctx.stroke();
    });

    // Rounded rocks along the bottom edges.
    ctx.fillStyle = "#304940";

    ctx.beginPath();
    ctx.ellipse(-33 * s, -2 * s, 17 * s, 9 * s, 0, 0, TAU);
    ctx.ellipse(33 * s, -2 * s, 17 * s, 9 * s, 0, 0, TAU);
    ctx.fill();

      ctx.restore();
    }


    drawCrab(ctx) {
      const w = this.width;
      const h = this.height;

      const x = this.crab.x * w;
      const groundY = h * 0.89
        + 7
        + Math.sin(x * 0.018) * 7
        + Math.sin(x * 0.043) * 3;

      const s = w / 1000 + 0.55;

      // Fast alternating leg movements.
      const step = this.reducedMotion
        ? 0
        : Math.sin(this.time * 7) * 4;

      const bodyShift = this.reducedMotion
        ? 0
        : Math.sin(this.time * 18) * 1.2;

      ctx.save();
      ctx.translate(x, groundY - 9 + bodyShift);
      ctx.scale(this.crab.direction, 1);

      // Six little sideways legs.
      ctx.strokeStyle = "#a93232";
      ctx.lineWidth = 2.2 * s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 0; i < 3; i++) {
        const side = i - 1;
        const movement = (i % 2 === 0 ? step : -step);

        // Legs on the left side.
        ctx.beginPath();
        ctx.moveTo(-5 * s, 1 * s);
        ctx.lineTo((-10 - i * 2) * s, (4 + movement) * s);
        ctx.lineTo((-15 - i * 2) * s, (7 - movement) * s);
        ctx.stroke();

        // Legs on the right side.
        ctx.beginPath();
        ctx.moveTo(5 * s, 1 * s);
        ctx.lineTo((10 + i * 2) * s, (4 - movement) * s);
        ctx.lineTo((15 + i * 2) * s, (7 + movement) * s);
        ctx.stroke();
      }

      // Rounded red shell.
      ctx.fillStyle = "#c7473d";
      ctx.beginPath();
      ctx.ellipse(0, 0, 12 * s, 7 * s, 0, Math.PI, 0);
      ctx.lineTo(12 * s, 2 * s);
      ctx.quadraticCurveTo(0, 10 * s, -12 * s, 2 * s);
      ctx.closePath();
      ctx.fill();

      // Subtle shell highlight.
      ctx.strokeStyle = "#e77a60";
      ctx.lineWidth = 1.3 * s;
      ctx.beginPath();
      ctx.arc(0, 0, 8 * s, Math.PI, 0);
      ctx.stroke();

      // Eyes on short stalks.
      for (const side of [-1, 1]) {
        ctx.strokeStyle = "#a93232";
        ctx.lineWidth = 1.8 * s;

        ctx.beginPath();
        ctx.moveTo(side * 5 * s, -4 * s);
        ctx.lineTo(side * 7 * s, -9 * s);
        ctx.stroke();

        ctx.fillStyle = "#f4e9d7";
        ctx.beginPath();
        ctx.arc(side * 7 * s, -9 * s, 2.3 * s, 0, TAU);
        ctx.fill();

        ctx.fillStyle = "#253c3b";
        ctx.beginPath();
        ctx.arc(side * 7 * s, -9 * s, 1 * s, 0, TAU);
        ctx.fill();
      }

      // Small claws with a little alternating movement.
      for (const side of [-1, 1]) {
        const clawMove = this.reducedMotion
          ? 0
          : Math.sin(this.time * 9 + side) * 1.5;

        ctx.strokeStyle = "#a93232";
        ctx.lineWidth = 2.5 * s;

        ctx.beginPath();
        ctx.moveTo(side * 8 * s, 0);
        ctx.lineTo(side * 14 * s, (-3 + clawMove) * s);
        ctx.stroke();

        ctx.fillStyle = "#d65343";
        ctx.beginPath();
        ctx.arc(side * 16 * s, (-4 + clawMove) * s, 3.5 * s, 0, TAU);
        ctx.fill();
      }

      ctx.restore();
    }

    drawShark(ctx, s) {
      // Animated tail
      const tailWag = this.reducedMotion
        ? 0
        : Math.sin(this.time * 4) * 0.18;

      ctx.save();
      ctx.translate(-s * 0.5, 0);
      ctx.rotate(tailWag);
      ctx.translate(s * 0.5, 0);

      ctx.fillStyle = "#668b91";
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, 0);
      ctx.lineTo(-s * 1.05, -s * 0.55);
      ctx.lineTo(-s * 0.92, 0);
      ctx.lineTo(-s * 1.05, s * 0.55);
      ctx.closePath();
      ctx.fill();

ctx.restore();

      // Body
      ctx.fillStyle = "#789da0";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.75, s * 0.3, 0, 0, TAU);
      ctx.fill();

      // Pale belly
      ctx.fillStyle = "#d5dfd4";
      ctx.beginPath();
      ctx.ellipse(s * 0.08, s * 0.13, s * 0.53, s * 0.14, 0, 0, TAU);
      ctx.fill();

      // Dorsal fin
      ctx.fillStyle = "#557e84";
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, -s * 0.2);
      ctx.lineTo(s * 0.02, -s * 0.68);
      ctx.lineTo(s * 0.3, -s * 0.22);
      ctx.closePath();
      ctx.fill();

      // Side fin
      ctx.beginPath();
      ctx.moveTo(-s * 0.05, s * 0.12);
      ctx.lineTo(s * 0.3, s * 0.48);
      ctx.lineTo(s * 0.48, s * 0.13);
      ctx.closePath();
      ctx.fill();

      // Gill lines
      ctx.strokeStyle = "rgba(35, 65, 69, 0.55)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(s * (0.22 + i * 0.07), -s * 0.1);
        ctx.lineTo(s * (0.2 + i * 0.07), s * 0.12);
        ctx.stroke();
      }

      // Eye
      ctx.fillStyle = "#172f35";
      ctx.beginPath();
      ctx.arc(s * 0.55, -s * 0.07, s * 0.035, 0, TAU);
      ctx.fill();
    }

    drawTurtle(ctx, s) {
      const flap = this.reducedMotion
        ? 0
        : Math.sin(this.time * 5) * 0.16;

      ctx.save();

      // Small rear tail.
      ctx.fillStyle = "#668d70";
      ctx.beginPath();
      ctx.moveTo(-s * 0.48, s * 0.02);
      ctx.lineTo(-s * 0.82, s * 0.13);
      ctx.lineTo(-s * 0.48, s * 0.19);
      ctx.closePath();
      ctx.fill();

      // Far-side rear flipper.
      ctx.save();
      ctx.translate(-s * 0.32, -s * 0.08);
      ctx.rotate(-0.25 - flap * 0.6);
      ctx.fillStyle = "#638c70";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-s * 0.12, -s * 0.28, -s * 0.42, -s * 0.53);
      ctx.quadraticCurveTo(-s * 0.35, -s * 0.12, s * 0.08, s * 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Far-side front flipper — angled backward.
      ctx.save();
      ctx.translate(s * 0.22, -s * 0.1);
      ctx.rotate(-3 - flap * 0.6);

      ctx.fillStyle = "#709879";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.2, -s * 0.3, s * 0.48, -s * 0.48);
      ctx.quadraticCurveTo(s * 0.4, -s * 0.05, s * 0.05, s * 0.12);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Main shell.
      ctx.fillStyle = "#426d54";
      ctx.beginPath();
      ctx.ellipse(-s * 0.08, 0, s * 0.53, s * 0.36, 0, 0, TAU);
      ctx.fill();

      // Lighter shell rim.
      ctx.strokeStyle = "#a3b58a";
      ctx.lineWidth = s * 0.045;
      ctx.beginPath();
      ctx.ellipse(-s * 0.08, 0, s * 0.48, s * 0.31, 0, 0, TAU);
      ctx.stroke();

      // Individual shell plates.
      ctx.strokeStyle = "#a3b58a";
      ctx.lineWidth = s * 0.025;

      ctx.beginPath();
      ctx.moveTo(-s * 0.35, -s * 0.18);
      ctx.lineTo(-s * 0.25, s * 0.18);
      ctx.lineTo(-s * 0.08, s * 0.29);
      ctx.lineTo(s * 0.12, s * 0.17);
      ctx.lineTo(s * 0.22, -s * 0.16);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-s * 0.08, -s * 0.34);
      ctx.lineTo(-s * 0.08, s * 0.3);
      ctx.moveTo(-s * 0.36, 0);
      ctx.lineTo(s * 0.2, 0);
      ctx.stroke();

      // Near-side rear flipper.
      ctx.save();
      ctx.translate(-s * 0.34, s * 0.12);
      ctx.rotate(0.6 + flap);
      ctx.fillStyle = "#83a982";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-s * 0.15, s * 0.3, -s * 0.42, s * 0.55);
      ctx.quadraticCurveTo(-s * 0.32, s * 0.12, s * 0.08, -s * 0.04);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(210, 225, 180, 0.4)";
      ctx.lineWidth = s * 0.025;
      ctx.stroke();
      ctx.restore();

      // Near-side front flipper — angled backward.
      ctx.save();
      ctx.translate(s * 0.2, s * 0.12);
      ctx.rotate(2.2 + flap);
      ctx.fillStyle = "#83a982";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.2, s * 0.3, s * 0.48, s * 0.55);
      ctx.quadraticCurveTo(s * 0.38, s * 0.12, s * 0.05, -s * 0.04);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(210, 225, 180, 0.4)";
      ctx.lineWidth = s * 0.025;
      ctx.stroke();
      ctx.restore();

      // Neck.
      ctx.fillStyle = "#83a982";
      ctx.beginPath();
      ctx.ellipse(s * 0.42, -s * 0.02, s * 0.22, s * 0.14, 0, 0, TAU);
      ctx.fill();

      // Head.
      ctx.fillStyle = "#91b58a";
      ctx.beginPath();
      ctx.ellipse(s * 0.62, -s * 0.04, s * 0.25, s * 0.2, -0.08, 0, TAU);
      ctx.fill();

      // Small smile.
      ctx.strokeStyle = "#527b5e";
      ctx.lineWidth = s * 0.025;
      ctx.beginPath();
      ctx.arc(s * 0.76, s * 0.02, s * 0.07, 0.2, 1.3);
      ctx.stroke();

      // Eye.
      ctx.fillStyle = "#203d38";
      ctx.beginPath();
      ctx.arc(s * 0.69, -s * 0.12, s * 0.035, 0, TAU);
      ctx.fill();

      // Eye glint.
      ctx.fillStyle = "#f1ead5";
      ctx.beginPath();
      ctx.arc(s * 0.7, -s * 0.13, s * 0.012, 0, TAU);
      ctx.fill();

      ctx.restore();
    }

    drawHoverGlow(ctx, x, y, radius) {
      const glow = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius * 1);
      glow.addColorStop(0, "rgba(197, 244, 231, 0.34)");
      glow.addColorStop(0.55, "rgba(139, 231, 220, 0.18)");
      glow.addColorStop(1, "rgba(139, 231, 220, 0)");
      ctx.save(); ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill(); ctx.restore();
    }

    drawFish(ctx, fish) {
      const w = this.width, h = this.height;
      const x = fish.x * w;
      const y = fish.y * h + Math.sin(this.time * 1.7 + fish.phase) * 7;
      const s = fish.size * (w / 1000 + 0.55)
        * (["leopardShark", "swellShark", "hornShark"].includes(fish.species) ? 2.25 : fish.species === "wolfEel" ? 1.45 : 1);
      const dir = fish.direction;
      const speciesPalette = {
        sheephead: ["#d8a17d", "#493d43"], anchovy: ["#b9d2cc", "#607f82"],
        wolfEel: ["#7e8d70", "#344d45"], rockfish: ["#c58b61", "#596c62"],
        garibaldi: ["#ff9a32", "#d65b22"], senorita: ["#e5a05e", "#b85b3c"],
        kelpfish: ["#8c9b65", "#526f54"], kelpBass: ["#9caa85", "#526d62"]
      };
      const palette = speciesPalette[fish.species] || ({
        silver: ["#d8e2d8", "#829f9d"], gold: ["#d6b66b", "#8f8050"],
        olive: ["#a9b88b", "#5f806b"], blue: ["#8bb9c1", "#4b7c8d"]
      }[fish.kind]);
      if (this.hoveredCreature === `fish-${this.fish.indexOf(fish)}` || this.hoveredObject === `link-${fish.linkIndex}`) this.drawHoverGlow(ctx, x, y, Math.max(20, s * 1.15));
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.globalAlpha = 0.76 + fish.depth * 0.22;

      if (["leopardShark", "swellShark", "hornShark"].includes(fish.species)) {
        this.drawShark(ctx, s);
        // Keep body markings inside the body silhouette so they never spill
        // onto the pectoral/side fin or the surrounding water.
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.75, s * 0.3, 0, 0, TAU);
        ctx.clip();
        // Species-specific markings distinguish the local shark residents.
        if (fish.species === "leopardShark") {
          ctx.fillStyle = "rgba(35, 57, 59, 0.72)";
          for (let i = 0; i < 10; i++) {
            const sx = -s * 0.42 + i * s * 0.095;
            ctx.beginPath(); ctx.ellipse(sx, -s * 0.02, s * 0.025, s * 0.06, 0, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + s * 0.025, s * 0.09, s * 0.022, 0, TAU); ctx.fill();
          }
        } else if (fish.species === "swellShark") {
          ctx.strokeStyle = "rgba(205, 174, 115, 0.7)"; ctx.lineWidth = Math.max(1, s * 0.018);
          for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i*s*0.16, 0, s*0.18, 0.2, 2.8); ctx.stroke(); }
        } else {
          ctx.fillStyle = "rgba(42, 54, 49, 0.65)";
          for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-s*0.25+i*s*0.16, s*0.18, s*0.035, 0, TAU); ctx.fill(); }
        }
        ctx.restore(); ctx.restore(); return;
      }

      // Tail.
      const tailWag = this.reducedMotion ? 0 : Math.sin(this.time * 8 + fish.phase) * 4;
      ctx.fillStyle = palette[1];
      ctx.beginPath();
      ctx.moveTo(-s * 0.55, 0);
      ctx.lineTo(-s * 1.02, -s * 0.34 + tailWag);
      ctx.lineTo(-s * 0.94, s * 0.32 + tailWag);
      ctx.closePath();
      ctx.fill();

      // Body.
      const body = ctx.createLinearGradient(0, -s * 0.28, 0, s * 0.3);
      body.addColorStop(0, palette[0]);
      body.addColorStop(1, palette[1]);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * (fish.species === "wolfEel" ? 0.9 : fish.species === "anchovy" || fish.species === "senorita" || fish.species === "kelpfish" ? 0.82 : 0.68), s * (fish.species === "wolfEel" ? 0.19 : 0.31), 0, 0, TAU);
      ctx.fill();

      // Dorsal fin and gill.
      ctx.fillStyle = palette[1];
      ctx.beginPath();
      ctx.moveTo(-s * 0.22, -s * 0.23);
      ctx.lineTo(-s * 0.03, -s * 0.48);
      ctx.lineTo(s * 0.22, -s * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(35, 57, 57, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s * 0.25, 0, s * 0.15, -1.1, 1.1);
      ctx.stroke();

      // Field marks for recognizable Monterey kelp-forest fish.
      if (fish.species === "garibaldi") {
        ctx.fillStyle = "rgba(255, 214, 115, 0.65)";
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-s*0.35+i*s*0.16, -s*0.08, s*0.018, 0, TAU); ctx.fill(); }
      } else if (fish.species === "sheephead") {
        ctx.fillStyle = "rgba(245, 225, 196, 0.8)";
        ctx.fillRect(-s*0.25, -s*0.22, s*0.12, s*0.44);
        ctx.fillStyle = "rgba(36, 39, 43, 0.6)";
        ctx.fillRect(s*0.28, -s*0.22, s*0.16, s*0.44);
      } else if (fish.species === "rockfish" || fish.species === "kelpBass") {
        ctx.fillStyle = "rgba(45, 57, 48, 0.38)";
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-s*0.34+i*s*0.15, -s*0.02, s*0.035, s*0.12, 0.1, 0, TAU); ctx.fill(); }
      } else if (fish.species === "anchovy" || fish.species === "senorita") {
        ctx.strokeStyle = "rgba(237, 225, 190, 0.72)"; ctx.lineWidth = Math.max(1, s*0.018);
        ctx.beginPath(); ctx.moveTo(-s*0.42, s*0.04); ctx.lineTo(s*0.42, s*0.04); ctx.stroke();
      }

      // Eye.
      ctx.fillStyle = "#142d31";
      ctx.beginPath();
      ctx.arc(s * 0.47, -s * 0.06, Math.max(1.2, s * 0.035), 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    drawJellyfish(ctx) {
      this.jellyfish.forEach((jelly, index) => {
        if (!this.reducedMotion) {
          jelly.x += Math.sin(this.time * jelly.speed + jelly.phase) * 0.000025;
          if (jelly.x < 0.08) jelly.x = 0.92;
          if (jelly.x > 0.94) jelly.x = 0.08;
        }
        const x = jelly.x * this.width;
        const y = jelly.y * this.height + Math.sin(this.time * jelly.speed + jelly.phase) * 18;
        const s = jelly.size * (this.width / 1000 + 0.55);
        const pulse = this.reducedMotion ? 0 : Math.sin(this.time * 2.2 + jelly.phase) * 0.08;
        if (this.hoveredCreature === `jelly-${index}`) this.drawHoverGlow(ctx, x, y, s * 1.8);
        ctx.save();
        ctx.translate(x, y);
        ctx.globalAlpha = 0.62;
        ctx.fillStyle = index === 0 ? "rgba(202, 190, 221, 0.72)" : "rgba(169, 213, 207, 0.68)";
        ctx.strokeStyle = "rgba(231, 235, 224, 0.62)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, s * (0.78 + pulse), s * (0.58 - pulse), 0, Math.PI, TAU);
        ctx.lineTo(s * 0.78, 0);
        ctx.quadraticCurveTo(0, s * 0.22, -s * 0.78, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "rgba(220, 230, 221, 0.55)";
        for (let tentacle = -2; tentacle <= 2; tentacle++) {
          const tx = tentacle * s * 0.25;
          ctx.beginPath();
          ctx.moveTo(tx, s * 0.04);
          ctx.bezierCurveTo(
            tx + Math.sin(this.time * 1.5 + tentacle) * s * 0.12, s * 0.42,
            tx - Math.sin(this.time * 1.2 + tentacle) * s * 0.12, s * 0.72,
            tx + Math.sin(this.time * 1.8 + tentacle) * s * 0.1, s * (0.95 + tentacle * 0.025)
          );
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    drawBubbles(ctx, dt) {
      const w = this.width, h = this.height;
      this.bubbles.forEach(b => {
        if (!this.reducedMotion) {
          b.y -= b.speed * dt;
          b.x = clamp(b.baseX ?? (b.baseX = b.x), 0.02, 0.98)
            + Math.sin(this.time * 0.7 + b.phase) * b.drift * 0.08;
        }
        if (b.y < -0.05) Object.assign(b, this.newBubble());
        const x = b.x * w, y = b.y * h;
        ctx.beginPath();
        ctx.arc(x, y, b.r, 0, TAU);
        ctx.strokeStyle = `rgba(220, 240, 228, ${b.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - b.r * 0.3, y - b.r * 0.3, Math.max(0.5, b.r * 0.18), 0, TAU);
        ctx.fillStyle = `rgba(240, 250, 238, ${b.alpha * 0.65})`;
        ctx.fill();
      });
    }

    drawParticles(ctx, dt) {
      const w = this.width, h = this.height;
      this.particles.forEach(p => {
        if (!this.reducedMotion) {
          p.y -= p.drift * dt;
          p.x += Math.sin(this.time + p.phase) * 0.000035 * dt;
        }
        if (p.y < -0.02) p.y = 1.02;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, TAU);
        ctx.fillStyle = `rgba(221, 232, 201, ${p.alpha})`;
        ctx.fill();
      });
    }

    frame(timestamp) {
      if (!this.running) return;
      const dt = this.lastTime ? Math.min((timestamp - this.lastTime) / 16.67, 2.5) : 1;
      this.lastTime = timestamp;
      if (!this.reducedMotion) this.time += dt / 60;

      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      this.drawBackground(ctx);
      this.drawParticles(ctx, dt);
      this.drawFishSchool(ctx, dt);
      this.drawJellyfish(ctx);

      // Distant kelp first, foreground kelp last.
      [...this.kelp].sort((a, b) => a.depth - b.depth).forEach((plant, i) => this.drawKelp(ctx, plant, i));

      this.fish.forEach(f => {
        if (!this.reducedMotion) {
          f.x += f.speed * dt * 0.012;
          if (f.linkIndex !== null) {
            // Linked fish turn around before their captions can leave the screen.
            if (f.direction > 0 && f.x > 0.88) {
              f.x = 0.88;
              f.direction = -1;
              f.speed = -Math.abs(f.speed);
            } else if (f.direction < 0 && f.x < 0.12) {
              f.x = 0.12;
              f.direction = 1;
              f.speed = Math.abs(f.speed);
            }
          } else {
            if (f.direction > 0 && f.x > 1.18) f.x = -0.18;
            if (f.direction < 0 && f.x < -0.18) f.x = 1.18;
          }
        }
        this.drawFish(ctx, f);
      });

      // Update caption positions every frame so they follow their fish.
      this.positionLinks();
      this.drawBubbles(ctx, dt);
      this.drawCaveAndTreasure(ctx);
      this.drawSeafloor(ctx);
      this.drawSeafloorDecorations(ctx);
      this.drawSoundShell(ctx);
      this.drawAboutStarfish(ctx);
      this.drawMessageBottle(ctx);

      // Move the crab along the right half of the sandy bottom.
      if (!this.reducedMotion) {
        this.crab.x += this.crab.direction * this.crab.speed * dt;

        if (this.crab.x > 0.94) {
          this.crab.x = 0.94;
          this.crab.direction = -1;
        }

        if (this.crab.x < 0.50) {
          this.crab.x = 0.50;
          this.crab.direction = 1;
        }
      }

// The crab disappears into its cave and reappears when it comes out.
if (this.crab.x < 0.89) {
  if (this.hoveredObject === "crab") {
    const cx = this.crab.x * this.width;
    const cy = this.height * 0.89 + 7 + Math.sin(cx * 0.018) * 7 + Math.sin(cx * 0.043) * 3 - 10;
    this.drawHoverGlow(ctx, cx, cy, 28);
  }
  this.drawCrab(ctx);
}

if (this.crabLink) {
  this.crabLink.style.display =
    this.crab.x < 0.89 ? "block" : "none";
}

this.positionCrabLink();
this.positionChestLink();
this.positionStarfishHotspot();
this.positionBottleHotspot();
this.positionShellHotspot();

requestAnimationFrame(this.frame);
    }

    destroy() {
      this.running = false;
      this.resizeObserver.disconnect();
      this.starfishHotspot?.remove();
      this.shellHotspot?.remove();
      this.stopSoundEngine();
      window.removeEventListener("resize", this.resize);
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      this.canvas.removeEventListener("click", this.handleCanvasClick);
      this.canvas.removeEventListener("pointermove", this.handleCanvasMove);
      this.canvas.removeEventListener("pointerleave", this.handleCanvasLeave);
    }
  }

  window.KelpForest = {
    create(root, options = {}) {
      if (!root) throw new Error("KelpForest.create needs an aquarium container.");
      return new KelpForestScene(root, options);
    }
  };
})();
