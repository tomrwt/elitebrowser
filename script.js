"use strict"; // Enforces safer JavaScript (e.g., prevents implicit globals)

// ============================================================================
// CONSTANTS & LOOKUP TABLES
// ============================================================================
const BASE_SEEDS = { s0: 0x5A4A, s1: 0x0248, s2: 0xB753 };
const SYSTEMS_PER_GALAXY = 256;
const NUM_GALAXIES = 8;
const ZOOM_MAX_MAGNIFICATION = 4;

const NAME_TOKENS = ["AL","LE","XE","GE","ZA","CE","BI","SO","US","ES","AR","MA","IN","DI","RE","A","ER","AT","EN","BE","RA","LA","VE","TI","ED","OR","QU","AN","TE","IS","RI","ON"];
const GOVERNMENTS = ["Anarchy","Feudal","Multi-government","Dictatorship","Communist","Confederacy","Democracy","Corporate State"];
const ECONOMIES = ["Rich Industrial", "Average Industrial", "Poor Industrial", "Mainly Industrial", "Mainly Agricultural", "Rich Agricultural", "Average Agricultural", "Poor Agricultural"];
const SPECIES_ADJECTIVES = [
    ["Large ", "Fierce ", "Small "],
    ["Green ", "Red ", "Yellow ", "Blue ", "Black ", "Harmless "],
    ["Slimy ", "Bug-Eyed ", "Horned ", "Bony ", "Fat ", "Furry "],
    ["Rodents", "Frogs", "Lizards", "Lobsters", "Birds", "Humanoids", "Felines", "Insects"]
];

// ============================================================================
// APPLICATION STATE
// ============================================================================
const state = {
    galaxies: [],             // Holds all 8 galaxies and their systems
    currentGalaxyIndex: 0,    // Which galaxy map is currently active
    targetSystemIndex: null,  // The system clicked on for zoom
    hoveredSystemIndex: null, // The system nearest to the mouse pointer
    displayedSystemIndex: null, // The system currently shown in the data panel
    isSystemSelected: false,  // Whether the data panel has been initialized
    isShortRange: false,      // Whether we are viewing the zoomed-in map
    zoomIntervalId: null      // Reference to the active animation loop
};

// ============================================================================
// UI & CANVAS SETUP
// ============================================================================
const UI = {
    wrapper: document.getElementById("wrapper"),
    mapBox: document.getElementById("map"),
    canvas: document.getElementById('galCanvas'),
    ctx: document.getElementById('galCanvas').getContext('2d'),
    title: document.getElementById("title"),
    sysDatScr: document.getElementById("sysDatScr"),
    nextGalBut: document.getElementById("nextGal")
};

// Calculate canvas dimensions dynamically based on viewport
let canvasWidth = window.visualViewport.width - 20;
let canvasHeight = window.visualViewport.height - 20;

if ((canvasWidth / canvasHeight) > 1.5) {
    canvasWidth = canvasWidth / 2;
}

canvasHeight = canvasWidth / 2;
const scaleFactor = canvasWidth / 256;

UI.canvas.width = canvasWidth;
UI.canvas.height = canvasHeight;
UI.ctx.fillStyle = "yellow";

// ============================================================================
// BITWISE MATH HELPERS
// ============================================================================
const getHighByte = (n) => (n & 0xFF00) >> 8;
const getLowByte = (n) => n & 0x00FF;
const wrap16Bit = (n) => n & 0xFFFF;
const rotate16BitLeft = (n) => wrap16Bit((n << 1) | (n >>> 15));
const rotate8BitLeft = (n) => ((n << 1) | (n >>> 7)) & 0xFF;

// ============================================================================
// PROCEDURAL GENERATION ENGINE
// ============================================================================

/**
 * Mutates a seed object to advance the procedural generation sequence.
 */
function twistSeeds(seeds) {
    const tmp = wrap16Bit(seeds.s0 + seeds.s1);
    seeds.s0 = seeds.s1;
    seeds.s1 = seeds.s2;
    seeds.s2 = wrap16Bit(tmp + seeds.s1);
}

/**
 * Generates the name of a system. 
 * Note: Takes a cloned seed object so it doesn't affect the main galaxy sequence.
 */
function generateSystemName(localSeeds) {
    let sysName = "";
    // Bit 6 of s0 dictates whether the name has 3 or 4 token pairs
    const isLongName = (localSeeds.s0 & 0b01000000) > 0;
    const pairs = isLongName ? 4 : 3;

    for (let n = 0; n < pairs; n++) {
        const tokenIndex = (localSeeds.s2 & 0x1F00) >> 8; // Bits 8-12
        if (tokenIndex > 0) {
            sysName += NAME_TOKENS[tokenIndex];
        }
        twistSeeds(localSeeds);
    }

    return sysName;
}

/**
 * Generates all stats, coordinates, and properties for a single system.
 */
function generateSystemData(seeds) {
    // Clone seeds for the name generator so it doesn't break the main procedural loop
    const name = generateSystemName({ ...seeds });

    const s0_hi = getHighByte(seeds.s0);
    const s0_lo = getLowByte(seeds.s0);
    const s1_hi = getHighByte(seeds.s1);
    const s1_lo = getLowByte(seeds.s1);
    const s2_hi = getHighByte(seeds.s2);
    const s2_lo = getLowByte(seeds.s2);

    const government = (s1_lo & 0b00111000) >> 3;
    let economy = s0_hi & 0b111;

    // Anarchy or Feudal governments can't be rich
    if (government < 2) {
        economy = economy | 0b010;
    }

    const flipEcon = economy ^ 0b111;
    const techLevel = flipEcon + (s1_hi & 0b11) + Math.round(government / 2);
    const population = (techLevel * 4) + economy + government + 1;

    let species = "";
    const isHuman = (s2_lo & 0b10000000) === 0;

    if (isHuman) {
        species = "Human Colonials";
    } else {
        const adj1 = (s2_hi & 0b11100) >> 2;
        if (adj1 < 3) species += SPECIES_ADJECTIVES[0][adj1];

        const adj2 = (s2_hi & 0b11100000) >> 5;
        if (adj2 < 6) species += SPECIES_ADJECTIVES[1][adj2];

        const adj3 = (s0_hi ^ s1_hi) & 0b111;
        if (adj3 < 6) species += SPECIES_ADJECTIVES[2][adj3];

        const animalIndex = (adj3 + (s2_hi & 0b11)) & 0b111;
        species += SPECIES_ADJECTIVES[3][animalIndex];
    }

    const productivity = (flipEcon + 3) * (government + 4) * population * 8;
    const radius = ((s2_hi & 0b1111) + 11) * 256 + s1_hi;

    const x = s1_hi;
    const y = s0_hi >> 1; // Galactic chart is half-height
    
    const zz = s2_lo | 0b01010000;
    const pixelWidth = (zz > 143) ? 1 : 2;

    const carryFlag = seeds.s0 & 0b00000001;
    const starSize = (s2_lo & 0b00000001) + 2 + carryFlag;

    return {
        name,
        economy,
        government,
        techLevel: techLevel + 1,
        population: population / 10,
        species,
        productivity,
        radius,
        x,
        y,
        pixelWidth,
        starSize
    };
}

/**
 * Initializes the entire universe (8 galaxies, 256 systems each) upon load.
 */
function initializeUniverse() {
    let currentSeeds = { ...BASE_SEEDS };

    for (let g = 0; g < NUM_GALAXIES; g++) {
        const baseSeeds = { ...currentSeeds };
        const currentGalaxySystems = [];

        for (let s = 0; s < SYSTEMS_PER_GALAXY; s++) {
            currentGalaxySystems.push(generateSystemData(currentSeeds));
            
            // The Elite algorithm twists the seeds 4 times between each system
            twistSeeds(currentSeeds);
            twistSeeds(currentSeeds);
            twistSeeds(currentSeeds);
            twistSeeds(currentSeeds);
        }

        state.galaxies.push(currentGalaxySystems);

        // Calculate the base seeds for the next galaxy
        currentSeeds.s0 = (rotate8BitLeft(getHighByte(baseSeeds.s0)) << 8) + rotate8BitLeft(getLowByte(baseSeeds.s0));
        currentSeeds.s1 = (rotate8BitLeft(getHighByte(baseSeeds.s1)) << 8) + rotate8BitLeft(getLowByte(baseSeeds.s1));
        currentSeeds.s2 = (rotate8BitLeft(getHighByte(baseSeeds.s2)) << 8) + rotate8BitLeft(getLowByte(baseSeeds.s2));
    }
}

// ============================================================================
// RENDERING & ANIMATION
// ============================================================================

function renderGalaxyMap() {
    UI.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    UI.ctx.fillStyle = "yellow";
    
    const currentGalaxy = state.galaxies[state.currentGalaxyIndex];
    
    for (let s = 0; s < SYSTEMS_PER_GALAXY; s++) {
        const sys = currentGalaxy[s];
        UI.ctx.fillRect(sys.x * scaleFactor, sys.y * scaleFactor, sys.pixelWidth, 1);
    }
}

function renderShortRangeChart() {
    UI.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    UI.ctx.fillStyle = "yellow";
    state.isShortRange = true;
    
    UI.title.innerHTML = "SHORT RANGE CHART";
    UI.nextGalBut.innerHTML = "back";

    const sysCenter = state.galaxies[state.currentGalaxyIndex][state.targetSystemIndex];

    for (let s = 0; s < SYSTEMS_PER_GALAXY; s++) {
        const sys = state.galaxies[state.currentGalaxyIndex][s];
        const xDiff = sys.x - sysCenter.x;
        const yDiff = sys.y - sysCenter.y;

        // Render systems within a specific coordinate distance
        if (Math.abs(xDiff) < 32 && Math.abs(yDiff) < 16) {
            const plotX = (canvasWidth / 2) + (xDiff * (scaleFactor * ZOOM_MAX_MAGNIFICATION));
            const plotY = (canvasHeight / 2) + (yDiff * (scaleFactor * ZOOM_MAX_MAGNIFICATION));
            UI.ctx.fillRect(plotX, plotY, sys.pixelWidth, 1);
        }
    }

    displaySystemData(state.targetSystemIndex);
    UI.canvas.addEventListener("click", handleMapClick, { once: true });
}

function handleMapClick() {
    // If we're already zoomed in, clicking the map returns us to the galaxy view
    if (state.isShortRange) {
        showNextGalaxy(true);
        return;
    }

    state.targetSystemIndex = state.hoveredSystemIndex;
    const sysCenter = state.galaxies[state.currentGalaxyIndex][state.targetSystemIndex];

    const xOffset = (canvasWidth / 2) - (sysCenter.x * scaleFactor);
    const yOffset = (canvasHeight / 2) - (sysCenter.y * scaleFactor);

    let progress = 1;
    const step = 0.05;
    
    let currentCenterX = sysCenter.x * scaleFactor;
    let currentCenterY = sysCenter.y * scaleFactor;

    state.zoomIntervalId = setInterval(() => {
        UI.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        UI.ctx.fillStyle = "yellow";
        
        const xShift = xOffset * ((progress - 1) / 3);
        const yShift = yOffset * ((progress - 1) / 3);

        for (let s = 0; s < SYSTEMS_PER_GALAXY; s++) {
            const sys = state.galaxies[state.currentGalaxyIndex][s];
            
            let x = (sys.x * scaleFactor) + xShift;
            let y = (sys.y * scaleFactor) + yShift;
            
            x = ((x - currentCenterX) * progress) + currentCenterX;
            y = ((y - currentCenterY) * progress) + currentCenterY;
            
            if (s === state.targetSystemIndex) {
                currentCenterX = x;
                currentCenterY = y;
            }
            
            UI.ctx.fillRect(x, y, sys.pixelWidth, 1);
        }

        progress += step;
        
        if (progress > ZOOM_MAX_MAGNIFICATION) {
            clearInterval(state.zoomIntervalId);
            renderShortRangeChart();
        }
    }, 10);
}

// ============================================================================
// UI & EVENT HANDLERS
// ============================================================================

function displaySystemData(systemIndex) {
    if (!state.isSystemSelected) {
        // Initialize the DOM structure once
        UI.sysDatScr.innerHTML = `
            <div id="sysDataContainer">
                <div id="top2" class="beebHead"><h1 class="screen" id="sysDatTitle"></h1></div>
                <div id="bod2" class="beebText"><div id="sysDatText"></div></div>
            </div>`;
        state.isSystemSelected = true;
    }

    const titleEl = document.getElementById("sysDatTitle");
    const textEl = document.getElementById("sysDatText");
    const sys = state.galaxies[state.currentGalaxyIndex][systemIndex];

    titleEl.innerHTML = `DATA ON SYSTEM ${sys.name}`;

    // Template literals make building HTML dramatically easier to read
    textEl.innerHTML = `
        <p>Economy: ${ECONOMIES[sys.economy]}</p>
        <p>Government: ${GOVERNMENTS[sys.government]}</p>
        <p>Tech Level: ${sys.techLevel}</p>
        <p>Population: ${sys.population.toFixed(1)} Billion</p>
        <p>(${sys.species})</p>
        <p>Gross Productivity: ${sys.productivity} M Cr</p>
        <p>Average Radius: ${sys.radius} km</p>
    `;
    
    state.displayedSystemIndex = systemIndex;
}

function handleMouseMove(event) {
    const rect = UI.canvas.getBoundingClientRect();
    let mouseX = (event.clientX - rect.left) / scaleFactor;
    let mouseY = (event.clientY - rect.top) / scaleFactor;

    if (state.isShortRange) {
        const sysCenter = state.galaxies[state.currentGalaxyIndex][state.targetSystemIndex];
        mouseX = ((mouseX - 128) / ZOOM_MAX_MAGNIFICATION) + sysCenter.x;
        mouseY = ((mouseY - 64) / ZOOM_MAX_MAGNIFICATION) + sysCenter.y;
    }

    let closestDistance = Infinity;

    for (let s = 0; s < SYSTEMS_PER_GALAXY; s++) {
        const sys = state.galaxies[state.currentGalaxyIndex][s];
        
        // In JS, adding a boolean (isShortRange) to a number coerces it to 1 or 0. 
        // This cleverly inflates the hit-box slightly when zoomed in.
        const xDiff = Math.abs(sys.x - mouseX) + (state.isShortRange ? 1 : 0);
        const yDiff = Math.abs(sys.y - mouseY) + (state.isShortRange ? 1 : 0);

        if (xDiff < 2 && yDiff < 2) {
            displaySystemData(s);
        }

        if ((xDiff + yDiff) < closestDistance) {
            state.hoveredSystemIndex = s;
            closestDistance = xDiff + yDiff;
        }
    }
}

function showNextGalaxy(stayOnCurrentGalaxy = false) {
    UI.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    UI.sysDatScr.innerHTML = "";
    UI.nextGalBut.innerHTML = "next galaxy";
    
    state.isSystemSelected = false;
    state.isShortRange = false;

    if (!stayOnCurrentGalaxy) {
        // Cycle from 0-7, looping back to 0
        state.currentGalaxyIndex = (state.currentGalaxyIndex === 7) ? 0 : state.currentGalaxyIndex + 1;
    }

    UI.title.innerHTML = `GALACTIC CHART ${state.currentGalaxyIndex + 1}`;
    
    renderGalaxyMap();
    UI.canvas.addEventListener("click", handleMapClick, { once: true });
}

// ============================================================================
// BOOTSTRAP
// ============================================================================

initializeUniverse();
renderGalaxyMap();

UI.canvas.addEventListener("click", handleMapClick, { once: true });
UI.canvas.addEventListener("mousemove", handleMouseMove);
UI.nextGalBut.addEventListener("click", () => showNextGalaxy(false));
