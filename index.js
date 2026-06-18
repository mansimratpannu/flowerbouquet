/* ==========================================================================
   Petal Post JS Logic & State Management
   ========================================================================== */

// 1. Data Definitions
const flowersData = [
  { id: 1, name: "orchid", meaning: "Beauty", birthMonth: "October", size: "medium" },
  { id: 2, name: "sunflower", meaning: "Adoration", birthMonth: "August", size: "large" },
  { id: 3, name: "lily", meaning: "Purity", birthMonth: "May", size: "large" },
  { id: 4, name: "pink_lily", meaning: "Prosperity", birthMonth: "May", size: "large" },
  { id: 5, name: "peony", meaning: "Romance", birthMonth: "May", size: "large" },
  { id: 6, name: "blue_flower", meaning: "Trust and grace", birthMonth: "April", size: "medium" },
  { id: 7, name: "wildflower", meaning: "Joy", birthMonth: "July", size: "large" },
  { id: 8, name: "rose", meaning: "Love and passion", birthMonth: "June", size: "large" },
  { id: 9, name: "anemone", meaning: "Anticipation", birthMonth: "September", size: "medium" },
  { id: 10, name: "white_camellia", meaning: "Adoration & Lovely", birthMonth: "July", size: "medium" },
  { id: 11, name: "lotus", meaning: "Purity and strength", birthMonth: "July", size: "large" },
  { id: 12, name: "hibiscus", meaning: "Delicate beauty", birthMonth: "September", size: "large" }
];

// 2. Application State
let state = {
  mode: "color", // 'color' or 'mono'
  selectedFlowers: [], // Array of objects: { id, rotation }
  flowerOrder: [], // Shuffled indices mapping
  greenery: 0, // 0 to 4 (which corresponds to foliage 1 to 5)
  card: {
    to: "",
    message: "",
    from: ""
  },
  stage: "home" // 'home', 'picker', 'customize', 'card', 'share', 'garden'
};

// 3. Initialization
window.addEventListener("DOMContentLoaded", () => {
  setupLogoListener();
  renderPickerGrid();
  checkURLParameters();
});

// Deterministic offsets generator for organic asymmetrical flower placement
function getFlowerOffsets(index, id, rotation) {
  const seed = (index + 1) * 23.7 + id * 11.3 + Math.abs(rotation) * 7.9;
  const x = Math.sin(seed) * 10; // range -10px to +10px
  const y = Math.cos(seed) * 10; // range -10px to +10px
  return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
}

// Logo resets app when clicked
function setupLogoListener() {
  const logo = document.getElementById("logo-link");
  if (logo) {
    logo.addEventListener("click", (e) => {
      e.preventDefault();
      resetApp();
    });
  }
}

// 4. View Routing
function switchView(targetStage) {
  state.stage = targetStage;
  
  // Toggle home-specific background class on body
  if (targetStage === "home") {
    document.body.classList.add("stage-home");
  } else {
    document.body.classList.remove("stage-home");
  }
  
  // Hide all sections
  document.querySelectorAll(".view-section").forEach(section => {
    section.classList.remove("active");
  });

  // Show target section
  const targetSection = document.getElementById(`view-${targetStage}`);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Header display rules
  const header = document.getElementById("app-header");
  if ((targetStage === "share" && isReceivedBouquet()) || targetStage === "home") {
    header.classList.add("hidden"); // Clean receiver landing page & home page
  } else {
    header.classList.remove("hidden");
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function startApp(selectedMode) {
  state.mode = selectedMode;
  state.selectedFlowers = [];
  state.flowerOrder = [];
  state.greenery = 0;
  
  updatePickerDrawer();
  switchView("picker");
}

function goHome() {
  switchView("home");
}

// 5. Flower Picker Logic
function renderPickerGrid() {
  const grid = document.getElementById("flower-grid");
  if (!grid) return;
  grid.innerHTML = "";

  flowersData.forEach(flower => {
    const card = document.createElement("button");
    card.className = `flower-card size-${flower.size} flower-${flower.name}`;
    card.id = `flower-select-${flower.id}`;
    card.type = "button";
    card.onclick = () => addFlower(flower.id);

    // Image Source (Dynamic based on state.mode)
    const imgWrapper = document.createElement("div");
    imgWrapper.className = "flower-img-wrapper";
    
    const img = document.createElement("img");
    img.className = "flower-card-img";
    img.src = `assets/flowers/${flower.name}.png`; // local path
    img.alt = `${flower.name} flower`;
    img.loading = "lazy";
    imgWrapper.appendChild(img);

    // Label
    const label = document.createElement("span");
    label.className = "flower-label";
    label.style.marginTop = "8px";
    label.textContent = flower.name;

    // Tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "flower-tooltip";
    tooltip.innerHTML = `
      <div class="tooltip-title">${flower.meaning}</div>
      <div class="tooltip-desc">Birth month: ${flower.birthMonth}</div>
    `;

    card.appendChild(imgWrapper);
    card.appendChild(label);
    card.appendChild(tooltip);
    grid.appendChild(card);
  });
}

function updatePickerImages() {
  const grid = document.getElementById("flower-grid");
  if (grid) {
    if (state.mode === "mono") {
      grid.classList.add("mono-filter");
    } else {
      grid.classList.remove("mono-filter");
    }
  }
}

function addFlower(flowerId) {
  if (state.selectedFlowers.length >= 7) return;

  const flowerInfo = flowersData.find(f => f.id === flowerId);
  if (!flowerInfo) return;

  // Generate random rotation between -5 and +5 degrees
  const rotation = parseFloat((Math.random() * 10 - 5).toFixed(1));

  state.selectedFlowers.push({
    id: flowerId,
    rotation: rotation
  });

  // Default order is linear
  state.flowerOrder = Array.from({ length: state.selectedFlowers.length }, (_, i) => i);

  updatePickerDrawer();
}

function removeFlowerInstance(index) {
  state.selectedFlowers.splice(index, 1);
  state.flowerOrder = Array.from({ length: state.selectedFlowers.length }, (_, i) => i);
  updatePickerDrawer();
}

function updatePickerDrawer() {
  const drawer = document.getElementById("selection-drawer");
  const list = document.getElementById("selected-flowers-list");
  const countSpan = document.getElementById("selected-count");
  const nextBtn = document.getElementById("btn-picker-next");

  if (!drawer || !list || !countSpan || !nextBtn) return;

  // Update mode-dependent images in grid
  updatePickerImages();

  const count = state.selectedFlowers.length;
  countSpan.textContent = count;

  // Show selection helper only if flowers are selected
  const helpText = document.getElementById("picker-help");
  if (count > 0) {
    helpText.classList.remove("opacity-50");
    helpText.textContent = "Click on a flower in the tray below to deselect it.";
  } else {
    helpText.classList.add("opacity-50");
    helpText.textContent = "Click on a flower to add it to your bouquet.";
  }

  // Clear list
  list.innerHTML = "";

  state.selectedFlowers.forEach((item, index) => {
    const flowerInfo = flowersData.find(f => f.id === item.id) || flowersData[item.id % flowersData.length] || flowersData[0];
    if (flowerInfo) {
      const tag = document.createElement("div");
      tag.className = "selected-tag";
      tag.textContent = flowerInfo.name;
      tag.onclick = () => removeFlowerInstance(index);
      list.appendChild(tag);
    }
  });

  // Toggle button state (4 to 7 blooms allowed)
  nextBtn.disabled = count < 4 || count > 7;
}

function applyDefaultPresetIfMatched() {
  const counts = {};
  state.selectedFlowers.forEach(item => {
    counts[item.id] = (counts[item.id] || 0) + 1;
  });

  // Check if selection matches: 4 of ID 4 (pink_lily), 2 of ID 2 (sunflower), 1 of ID 5 (peony)
  if (counts[4] === 4 && counts[2] === 2 && counts[5] === 1 && state.selectedFlowers.length === 7) {
    state.selectedFlowers = [
      { id: 4, rotation: -6.0 }, // Bottom Lily
      { id: 2, rotation: 4.0 },  // Bottom Sunflower
      { id: 5, rotation: 2.0 },  // Peony
      { id: 2, rotation: -2.0 }, // Middle Sunflower
      { id: 4, rotation: 0.0 },  // Top Lily
      { id: 4, rotation: -4.0 }, // Left Lily
      { id: 4, rotation: 3.0 }   // Right Lily
    ];
    state.flowerOrder = [0, 1, 2, 3, 4, 5, 6];
  }
}

// 6. Bouquet Customizer Logic
function goToCustomizer() {
  applyDefaultPresetIfMatched();
  renderBouquet("bouquet-container", "flowers-wrap-container", "bush-background", "bush-foreground");
  switchView("customize");
}

function goToPicker() {
  updatePickerDrawer();
  switchView("picker");
}

function renderBouquet(containerId, flowersWrapId, bgId, fgId) {
  const container = document.getElementById(containerId);
  const wrap = document.getElementById(flowersWrapId);
  const bg = document.getElementById(bgId);
  const fg = document.getElementById(fgId);

  if (!container || !wrap || !bg || !fg) return;

  // Set foliage images (always color, we apply grayscale via CSS if mode is mono)
  bg.className = `bush-layer z-background foliage-type-${state.greenery + 1}`;
  bg.src = `assets/foliage/foliage-${state.greenery + 1}.png`;
  fg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  // Apply monochrome class
  if (state.mode === "mono") {
    container.classList.add("mono-filter");
  } else {
    container.classList.remove("mono-filter");
  }

  // Clear current flowers
  wrap.innerHTML = "";

  state.selectedFlowers.forEach((item, index) => {
    const flowerInfo = flowersData.find(f => f.id === item.id) || flowersData[item.id % flowersData.length] || flowersData[0];
    if (!flowerInfo) return;

    const flowerDiv = document.createElement("div");
    // Size class
    flowerDiv.className = `flower-instance size-${flowerInfo.size} flower-${flowerInfo.name}`;
    
    // Stacking order
    const renderOrder = state.flowerOrder[index] !== undefined ? state.flowerOrder[index] : index;
    flowerDiv.style.order = renderOrder;

    // Apply deterministic translations + rotations
    const offsets = getFlowerOffsets(index, item.id, item.rotation);
    flowerDiv.style.transform = `translate(${offsets.x}px, ${offsets.y}px) rotate(${item.rotation}deg)`;

    // Image element
    const img = document.createElement("img");
    img.src = `assets/flowers/${flowerInfo.name}.png`;
    img.alt = flowerInfo.name;
    img.className = "flower-instance-img";
    img.loading = "eager";

    // Tooltip showing name and meaning on hover
    const tooltip = document.createElement("div");
    tooltip.className = "flower-tooltip";
    tooltip.innerHTML = `
      <div class="tooltip-title">${flowerInfo.name}</div>
      <div class="tooltip-desc">${flowerInfo.meaning}</div>
    `;

    flowerDiv.appendChild(img);
    flowerDiv.appendChild(tooltip);
    wrap.appendChild(flowerDiv);
  });
}

function changeGreenery() {
  state.greenery = (state.greenery + 1) % 7;
  
  // Re-render customizer
  renderBouquet("bouquet-container", "flowers-wrap-container", "bush-background", "bush-foreground");
}

function shuffleFlowers() {
  const count = state.selectedFlowers.length;
  if (count === 0) return;

  // Shuffle order indices (Fisher-Yates)
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  state.flowerOrder = indices;

  // Re-randomize rotations slightly for natural variation
  state.selectedFlowers.forEach(item => {
    item.rotation = parseFloat((Math.random() * 10 - 5).toFixed(1));
  });

  // Re-render
  renderBouquet("bouquet-container", "flowers-wrap-container", "bush-background", "bush-foreground");
}

// 7. Card Writer Logic
function goToCardWriter() {
  // Clear inputs if resetting, or leave populated
  document.getElementById("input-to").value = state.card.to;
  document.getElementById("input-msg").value = state.card.message;
  document.getElementById("input-from").value = state.card.from;

  switchView("card");
}

function submitCard(e) {
  e.preventDefault();
  
  state.card.to = document.getElementById("input-to").value.trim();
  state.card.message = document.getElementById("input-msg").value.trim();
  state.card.from = document.getElementById("input-from").value.trim();

  // Save to Local Garden
  saveToGarden();

  // Prepare and open Share View
  openShareViewSender();
}

// 8. Share View Logic

// Sender Mode: Just created the bouquet
function openShareViewSender() {
  // Populate Bouquet preview
  renderBouquet("share-bouquet-container", "share-flowers-wrap-container", "share-bush-background", "share-bush-foreground");

  // Populate card inside
  document.getElementById("display-to").textContent = `To: ${state.card.to}`;
  document.getElementById("display-msg").textContent = state.card.message;
  document.getElementById("display-from").textContent = `From: ${state.card.from}`;

  // Reset envelope state
  document.getElementById("gift-card-envelope").classList.remove("hidden");
  document.getElementById("gift-card-content").classList.add("hidden");

  // Generate sharing URL
  const shareURL = generateShareURL();
  document.getElementById("share-url-input").value = shareURL;

  // Show sender panels
  document.getElementById("sender-success-message").classList.remove("hidden");
  document.getElementById("sender-actions").classList.remove("hidden");
  document.getElementById("receiver-actions").classList.add("hidden");

  switchView("share");
}

// Receiver Mode: Loaded from sharing link
function openShareViewReceiver() {
  // Populate Bouquet preview
  renderBouquet("share-bouquet-container", "share-flowers-wrap-container", "share-bush-background", "share-bush-foreground");

  // Populate card inside
  document.getElementById("display-to").textContent = `To: ${state.card.to}`;
  document.getElementById("display-msg").textContent = state.card.message;
  document.getElementById("display-from").textContent = `From: ${state.card.from}`;

  // Reset envelope state
  document.getElementById("gift-card-envelope").classList.remove("hidden");
  document.getElementById("gift-card-content").classList.add("hidden");

  // Show receiver panels
  document.getElementById("sender-success-message").classList.add("hidden");
  document.getElementById("sender-actions").classList.add("hidden");
  document.getElementById("receiver-actions").classList.remove("hidden");

  switchView("share");
}

function openCard() {
  // Add a small rotation flap effect or directly slide
  const envelope = document.getElementById("gift-card-envelope");
  const content = document.getElementById("gift-card-content");
  
  if (envelope && content) {
    envelope.classList.add("hidden");
    content.classList.remove("hidden");
  }
}

function closeCard() {
  const envelope = document.getElementById("gift-card-envelope");
  const content = document.getElementById("gift-card-content");
  
  if (envelope && content) {
    content.classList.add("hidden");
    envelope.classList.remove("hidden");
  }
}

function generateShareURL() {
  const flowerIds = state.selectedFlowers.map(f => f.id).join(",");
  const rotations = state.selectedFlowers.map(f => f.rotation).join(",");
  const order = state.flowerOrder.join(",");
  
  const params = new URLSearchParams();
  params.set("view", "share");
  params.set("m", state.mode);
  params.set("f", flowerIds);
  params.set("g", state.greenery);
  params.set("r", rotations);
  params.set("o", order);
  params.set("to", state.card.to);
  params.set("from", state.card.from);
  params.set("msg", state.card.message);

  // Use the origin + pathname
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function copyShareLink() {
  const input = document.getElementById("share-url-input");
  const copyBtn = document.getElementById("btn-copy-link");
  if (!input || !copyBtn) return;

  input.select();
  input.setSelectionRange(0, 99999); // For mobile devices

  navigator.clipboard.writeText(input.value)
    .then(() => {
      copyBtn.textContent = "COPIED!";
      copyBtn.style.backgroundColor = "#4CAF50"; // Soft Green Success
      
      setTimeout(() => {
        copyBtn.textContent = "COPY LINK";
        copyBtn.style.backgroundColor = "var(--btn-bg)";
      }, 2000);
    })
    .catch(err => {
      console.error("Failed to copy link: ", err);
    });
}

function isReceivedBouquet() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has("f") && urlParams.has("to");
}

function checkURLParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("f") && urlParams.has("to")) {
    // We have a shared bouquet! Parse it.
    try {
      state.mode = urlParams.get("m") || "color";
      state.greenery = parseInt(urlParams.get("g") || "0", 10);
      state.card.to = urlParams.get("to") || "";
      state.card.from = urlParams.get("from") || "";
      state.card.message = urlParams.get("msg") || "";

      // Parse flower array
      const ids = urlParams.get("f").split(",").map(Number);
      const rotations = urlParams.get("r").split(",").map(Number);
      
      state.selectedFlowers = ids.map((id, idx) => ({
        id: id,
        rotation: rotations[idx] !== undefined ? rotations[idx] : 0
      }));

      // Parse order
      if (urlParams.has("o")) {
        state.flowerOrder = urlParams.get("o").split(",").map(Number);
      } else {
        state.flowerOrder = Array.from({ length: state.selectedFlowers.length }, (_, i) => i);
      }

      openShareViewReceiver();
    } catch (e) {
      console.error("Failed to parse sharing URL parameters: ", e);
      resetApp();
    }
  } else {
    switchView("home");
  }
}

function resetApp() {
  // Clear parameters by pushing clean URL
  window.history.pushState({}, document.title, window.location.pathname);
  
  // Reset state
  state = {
    mode: "color",
    selectedFlowers: [],
    flowerOrder: [],
    greenery: 0,
    card: { to: "", message: "", from: "" },
    stage: "home"
  };

  // Switch back to home
  switchView("home");
}

// 9. Local Storage "Garden" Logic
function saveToGarden() {
  try {
    const gardenData = JSON.parse(localStorage.getItem("petalpost_garden") || "[]");
    
    // Create new saved item
    const newItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "numeric", day: "numeric" }),
      mode: state.mode,
      greenery: state.greenery,
      flowers: JSON.parse(JSON.stringify(state.selectedFlowers)),
      flowerOrder: [...state.flowerOrder],
      card: { ...state.card }
    };

    gardenData.unshift(newItem); // Newest first
    localStorage.setItem("petalpost_garden", JSON.stringify(gardenData));
  } catch (e) {
    console.error("Failed to save bouquet to garden: ", e);
  }
}

function showGarden() {
  const grid = document.getElementById("garden-grid");
  if (!grid) return;
  grid.innerHTML = "";

  try {
    const gardenData = JSON.parse(localStorage.getItem("petalpost_garden") || "[]");

    if (gardenData.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; opacity: 0.5;">
          Your garden is currently empty. Build your first bouquet to see it bloom here!
        </div>
      `;
    } else {
      gardenData.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "garden-item";
        itemDiv.onclick = () => loadSavedBouquet(item);

        // Thumbnail bouquet preview
        const thumbContainer = document.createElement("div");
        thumbContainer.className = "bouquet-sandwich-container";
        thumbContainer.style.minHeight = "250px";
        thumbContainer.style.overflow = "hidden";
        thumbContainer.style.pointerEvents = "none"; // disable animations inside card hover

        // Apply monochrome class
        if (item.mode === "mono") {
          thumbContainer.classList.add("mono-filter");
        }

        const bg = document.createElement("img");
        bg.className = `bush-layer z-background foliage-type-${item.greenery + 1}`;
        bg.src = `assets/foliage/foliage-${item.greenery + 1}.png`;

        const wrap = document.createElement("div");
        wrap.className = "flowers-wrap-container";
        wrap.style.transform = "scale(0.7)"; // Scale down to fit thumbnail

        item.flowers.forEach((flower, index) => {
          const flowerInfo = flowersData.find(f => f.id === flower.id) || flowersData[flower.id % flowersData.length] || flowersData[0];
          if (!flowerInfo) return;

          const flowerDiv = document.createElement("div");
          flowerDiv.className = `flower-instance size-${flowerInfo.size} flower-${flowerInfo.name}`;
          flowerDiv.style.order = item.flowerOrder[index] !== undefined ? item.flowerOrder[index] : index;

          // Apply same deterministic offsets
          const offsets = getFlowerOffsets(index, flower.id, flower.rotation);
          flowerDiv.style.transform = `translate(${offsets.x}px, ${offsets.y}px) rotate(${flower.rotation}deg)`;

          const img = document.createElement("img");
          img.src = `assets/flowers/${flowerInfo.name}.png`;
          img.alt = flowerInfo.name;
          img.className = "flower-instance-img";

          flowerDiv.appendChild(img);
          wrap.appendChild(flowerDiv);
        });

        const fg = document.createElement("img");
        fg.className = "bush-layer z-foreground";
        fg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

        thumbContainer.appendChild(bg);
        thumbContainer.appendChild(wrap);
        thumbContainer.appendChild(fg);

        // Date & Labels
        const labelText = document.createElement("div");
        labelText.style.marginTop = "10px";
        labelText.style.fontWeight = "bold";
        labelText.textContent = `For: ${item.card.to}`;

        const dateText = document.createElement("div");
        dateText.className = "garden-item-date";
        dateText.textContent = item.date;

        itemDiv.appendChild(thumbContainer);
        itemDiv.appendChild(labelText);
        itemDiv.appendChild(dateText);
        grid.appendChild(itemDiv);
      });
    }
  } catch (e) {
    console.error("Failed to load garden: ", e);
  }

  switchView("garden");
}

function loadSavedBouquet(item) {
  state.mode = item.mode;
  state.greenery = item.greenery;
  state.selectedFlowers = item.flowers;
  state.flowerOrder = item.flowerOrder;
  state.card = { ...item.card };

  openShareViewSender();
}
