// WRITE YOUR JS CODE HERE

let allPlanetsData = [];
let allLaunchesData = [];

async function fetchAstronomyPicture(specificDate = null) {
    try {

        const response = await fetch(`https:api.nasa.gov/planetary/apod?api_key=e1S0uOy1izehR795UEWjAQwGLVRoVstyEGBSvkAo&date=${specificDate}`);
        const data = await response.json();

        const imageContainer = document.getElementById("apod-image-container");
        const loadingSpinner = document.getElementById("apod-loading");
        const apodImageElement = document.getElementById("apod-image");

        loadingSpinner.classList.remove("hidden");
        apodImageElement.classList.add("hidden");
        apodImageElement.src = "";

        const existingOverlay = imageContainer.querySelector(".absolute.inset-0");
        if (existingOverlay && existingOverlay !== loadingSpinner) {
            existingOverlay.remove();
        }

        const formattedDate = new Date(data.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        document.getElementById("apod-date").textContent = `Astronomy Picture of the Day - ${formattedDate}`;
        document.getElementById("apod-date-detail").innerHTML = `<i class="far fa-calendar mr-2"></i>${formattedDate}`;
        document.getElementById("apod-date-info").textContent = formattedDate;
        document.getElementById("apod-title").textContent = data.title;
        document.getElementById("apod-explanation").textContent = data.explanation;

        const copyrightElement = document.getElementById("apod-copyright");
        if (data.copyright) {
            copyrightElement.innerHTML = `<i class="fas fa-copyright mr-1"></i>Copyright: ${data.copyright.trim()}`;
            copyrightElement.classList.remove("hidden");
        } else {
            copyrightElement.classList.add("hidden");
        }

        document.getElementById("apod-media-type").textContent = data.media_type === "image" ? "Image" : "Video";

        if (data.media_type === "image") {
            apodImageElement.src = data.url;
            apodImageElement.alt = data.title;

            apodImageElement.onload = function() {
                loadingSpinner.classList.add("hidden");
                apodImageElement.classList.remove("hidden");
            };

            apodImageElement.onerror = function() {
                loadingSpinner.innerHTML = `
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-slate-400">Failed to load image</p>
                `;
            };

            const overlayDiv = document.createElement("div");
            overlayDiv.className = "absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity";
            overlayDiv.innerHTML = `
                <div class="absolute bottom-6 left-6 right-6">
                    <a href="${data.hdurl || data.url}" target="_blank" class="block w-full py-3 bg-white/10 backdrop-blur-md rounded-lg font-semibold hover:bg-white/20 transition-colors text-center">
                        <i class="fas fa-expand mr-2"></i>View Full Resolution
                    </a>
                </div>
            `;
            imageContainer.appendChild(overlayDiv);

        } else if (data.media_type === "video") {
            loadingSpinner.classList.add("hidden");
            imageContainer.innerHTML = `
                <iframe src="${data.url}" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
            `;
        }

    } catch (error) {
        console.error("Error fetching APOD:", error);
        document.getElementById("apod-loading").innerHTML = `
            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <p class="text-slate-400">Failed to load today's image</p>
            <p class="text-slate-500 text-sm mt-2">Please try again later</p>
        `;
    }
}

async function fetchPlanetsData() {
    try {
        const response = await fetch("https:solar-system-opendata-proxy.vercel.app/api/planets");
        const data = await response.json();
        
        allPlanetsData = data.bodies.filter(body => body.isPlanet === true);
        
        renderPlanetsGrid();
        renderPlanetsComparisonTable();

        const earthData = allPlanetsData.find(p => p.englishName.toLowerCase() === "earth");
        if (earthData) {
            displayPlanetDetails(earthData);
        }

    } catch (error) {
        console.error("Error fetching planets data:", error);
        const planetsGrid = document.getElementById("planets-grid");
        if (planetsGrid) {
            planetsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
                    <p class="text-slate-400">Failed to load planets data.</p>
                </div>
            `;
        }
    }
}

async function fetchUpcomingLaunches() {
    try {
        const response = await fetch(`https:lldev.thespacedevs.com/2.3.0/launches/upcoming/?limit=10`);
        const data = await response.json();
        allLaunchesData = data.results;

        const countDesktop = document.getElementById("launches-count");
        const countMobile = document.getElementById("launches-count-mobile");

        if (countDesktop) countDesktop.textContent = `${allLaunchesData.length} Launches`;
        if (countMobile) countMobile.textContent = `${allLaunchesData.length}`;

        renderFeaturedLaunch();
        renderLaunchesGrid();

    } catch (error) {
        console.error("Error fetching launches data:", error);
        const errorContent = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-400 text-5xl mb-4"></i>
                <p class="text-slate-400 text-lg">Failed to load launches data</p>
            </div>
        `;
        const featuredArea = document.getElementById("featured-launch");
        const gridArea = document.getElementById("launches-grid");
        
        if (featuredArea) featuredArea.innerHTML = errorContent;
        if (gridArea) gridArea.innerHTML = errorContent;
    }
}

function renderFeaturedLaunch() {
    const container = document.getElementById("featured-launch");
    if (!container || allLaunchesData.length === 0) return;

    const launch = allLaunchesData[0];
    const launchDate = new Date(launch.net);
    const timeDiff = launchDate - new Date();
    const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const dateString = launchDate.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    const timeString = launchDate.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", timeZone: "UTC"
    }) + " UTC";

    const statusMap = { "Go": "green", "Success": "green", "TBD": "yellow", "Hold": "red", "TBC": "yellow" };
    const statusColor = statusMap[launch.status?.abbrev] || "blue";
    
    const imageUrl = launch.image?.image_url || launch.rocket?.configuration?.image_url || "";

    container.innerHTML = `
        <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
            <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
                <div class="flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-3 mb-4">
                            <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2">
                                <i class="fas fa-star"></i> Featured Launch
                            </span>
                            <span class="px-4 py-1.5 bg-${statusColor}-500/20 text-${statusColor}-400 rounded-full text-sm font-semibold">
                                ${launch.status?.abbrev || "TBD"}
                            </span>
                        </div>
                        <h3 class="text-3xl font-bold mb-3 leading-tight">${launch.name}</h3>
                        <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-building"></i>
                                <span>${launch.launch_service_provider?.name || "Unknown"}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i class="fas fa-rocket"></i>
                                <span>${launch.rocket?.configuration?.name || "N/A"}</span>
                            </div>
                        </div>
                        
                        ${daysUntil > 0 ? `
                        <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
                            <i class="fas fa-clock text-2xl text-blue-400"></i>
                            <div>
                                <p class="text-2xl font-bold text-blue-400">${daysUntil}</p>
                                <p class="text-xs text-slate-400">Days Until Launch</p>
                            </div>
                        </div>
                        ` : ""}

                        <div class="grid xl:grid-cols-2 gap-4 mb-6">
                            <div class="bg-slate-900/50 rounded-xl p-4">
                                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-calendar"></i> Launch Date</p>
                                <p class="font-semibold">${dateString}</p>
                            </div>
                            <div class="bg-slate-900/50 rounded-xl p-4">
                                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-clock"></i> Launch Time</p>
                                <p class="font-semibold">${timeString}</p>
                            </div>
                        </div>
                        <p class="text-slate-300 leading-relaxed mb-6">
                            ${launch.mission?.description || "Mission details will be available closer to launch date."}
                        </p>
                    </div>
                    <div class="flex flex-col md:flex-row gap-3">
                        <button class="flex-1 px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold">View Full Details</button>
                    </div>
                </div>
                <div class="relative">
                    ${imageUrl ? `
                    <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
                        <img src="${imageUrl}" class="w-full h-full object-cover" />
                    </div>
                    ` : `
                    <div class="flex items-center justify-center h-full min-h-[400px] bg-slate-900/50 rounded-2xl">
                        <i class="fas fa-rocket text-6xl text-slate-700"></i>
                    </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function renderLaunchesGrid() {
    const grid = document.getElementById("launches-grid");
    if (!grid || allLaunchesData.length === 0) return;

    const otherLaunches = allLaunchesData.slice(1, 10);
    
    grid.innerHTML = otherLaunches.map(launch => {
        const launchDate = new Date(launch.net);
        const dateStr = launchDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const timeStr = launchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
        
        const statusMap = { "Go": "green", "Success": "green", "TBD": "yellow", "Hold": "red", "TBC": "yellow" };
        const statusColor = statusMap[launch.status?.abbrev] || "blue";
        const thumbUrl = launch.image?.thumbnail_url || "";

        return `
            <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
                <div class="relative h-48 overflow-hidden bg-slate-900/50">
                    <img src="${thumbUrl || '/assets/images/launch-placeholder.png'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div class="absolute top-3 right-3">
                        <span class="px-3 py-1 bg-${statusColor}-500/90 text-white rounded-full text-xs font-semibold">${launch.status?.abbrev || "TBD"}</span>
                    </div>
                </div>
                <div class="p-5">
                    <h4 class="font-bold text-lg mb-2 line-clamp-2">${launch.name}</h4>
                    <div class="space-y-2 mb-4 text-sm text-slate-300">
                        <div class="flex items-center gap-2"><i class="fas fa-calendar w-4"></i> ${dateStr}</div>
                        <div class="flex items-center gap-2"><i class="fas fa-clock w-4"></i> ${timeStr}</div>
                        <div class="flex items-center gap-2"><i class="fas fa-rocket w-4"></i> ${launch.rocket?.configuration?.name || "N/A"}</div>
                    </div>
                    <button class="w-full py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors font-semibold">Details</button>
                </div>
            </div>
        `;
    }).join("");
}

function renderPlanetsGrid() {
    const grid = document.getElementById("planets-grid");
    if (!grid) return;

    const planetColors = { mercury: "#eab308", venus: "#f97316", earth: "#3b82f6", mars: "#ef4444", jupiter: "#fb923c", saturn: "#facc15", uranus: "#06b6d4", neptune: "#2563eb" };
    const planetImages = { mercury: "/assets/images/mercury.png", venus: "/assets/images/venus.png", earth: "/assets/images/earth.png", mars: "/assets/images/mars.png", jupiter: "/assets/images/jupiter.png", saturn: "/assets/images/saturn.png", uranus: "/assets/images/uranus.png", neptune: "/assets/images/neptune.png" };

    grid.innerHTML = allPlanetsData.map(planet => {
        const nameLower = planet.englishName.toLowerCase();
        const color = planetColors[nameLower] || "#64748b";
        const image = planetImages[nameLower] || "";
        const distanceAU = (planet.semimajorAxis / 149597870.7).toFixed(2);

        return `
            <div class="planet-card bg-slate-800/50 border border-slate-700 rounded-2xl p-4 transition-all cursor-pointer group" 
                 data-planet-id="${planet.id}" 
                 onclick="handlePlanetClick('${planet.id}')"
                 onmouseover="this.style.borderColor='${color}'" 
                 onmouseout="this.style.borderColor='#334155'">
                <div class="relative mb-3 h-24 flex items-center justify-center">
                    <img class="w-20 h-20 object-contain group-hover:scale-110 transition-transform" src="${image}" alt="${planet.englishName}" />
                </div>
                <h4 class="font-semibold text-center text-sm">${planet.englishName}</h4>
                <p class="text-xs text-slate-400 text-center">${distanceAU} AU</p>
            </div>
        `;
    }).join("");
}

window.handlePlanetClick = function(id) {
    const planet = allPlanetsData.find(p => p.id === id);
    if (planet) displayPlanetDetails(planet);
};

function renderPlanetsComparisonTable() {
    const tableBody = document.getElementById("planet-comparison-tbody");
    if (!tableBody) return;

    const earth = allPlanetsData.find(p => p.englishName.toLowerCase() === "earth");
    const earthMass = earth ? earth.mass.massValue * Math.pow(10, earth.mass.massExponent) : 1;

    tableBody.innerHTML = allPlanetsData.map(planet => {
        const nameLower = planet.englishName.toLowerCase();
        const distAU = (planet.semimajorAxis / 149597870.7).toFixed(2);
        const diameter = (planet.meanRadius * 2).toFixed(0);
        const massRelative = planet.mass ? (planet.mass.massValue * Math.pow(10, planet.mass.massExponent) / earthMass).toFixed(3) : 0;
        
        let orbit = planet.sideralOrbit.toFixed(0);
        orbit = planet.sideralOrbit > 365 ? (planet.sideralOrbit / 365.25).toFixed(1) + " years" : orbit + " days";

        return `
            <tr class="hover:bg-slate-800/30 transition-colors ${nameLower === 'earth' ? 'bg-blue-500/5' : ''}">
                <td class="px-6 py-4 sticky left-0 bg-slate-800 font-semibold">${planet.englishName}</td>
                <td class="px-6 py-4 text-slate-300">${distAU}</td>
                <td class="px-6 py-4 text-slate-300">${parseInt(diameter).toLocaleString()} km</td>
                <td class="px-6 py-4 text-slate-300">${massRelative}</td>
                <td class="px-6 py-4 text-slate-300">${orbit}</td>
                <td class="px-6 py-4 text-slate-300">${planet.moons ? planet.moons.length : 0}</td>
            </tr>
        `;
    }).join("");
}

function displayPlanetDetails(planet) {
    const nameLower = planet.englishName.toLowerCase();
    const planetImages = { mercury: "/assets/images/mercury.png", venus: "/assets/images/venus.png", earth: "/assets/images/earth.png", mars: "/assets/images/mars.png", jupiter: "/assets/images/jupiter.png", saturn: "/assets/images/saturn.png", uranus: "/assets/images/uranus.png", neptune: "/assets/images/neptune.png" };

    const imgEl = document.getElementById("planet-detail-image");
    if (imgEl) { imgEl.src = planetImages[nameLower] || ""; imgEl.alt = planet.englishName; }
    
    const nameEl = document.getElementById("planet-detail-name");
    if (nameEl) nameEl.textContent = planet.englishName;

    const descEl = document.getElementById("planet-detail-description");
    if (descEl) descEl.textContent = getPlanetDescription(nameLower, planet.englishName);

    const statsMapping = {
        "planet-distance": (planet.semimajorAxis / 1e6).toFixed(1) + "M km",
        "planet-radius": planet.meanRadius.toFixed(0) + " km",
        "planet-mass": planet.mass ? `${planet.mass.massValue} × 10^${planet.mass.massExponent} kg` : "N/A",
        "planet-gravity": planet.gravity + " m/s²",
        "planet-orbital-period": planet.sideralOrbit.toFixed(0) + " days",
        "planet-temp": planet.avgTemp + "°C",
        "planet-moons": planet.moons ? planet.moons.length : 0
    };

    for (let id in statsMapping) {
        const el = document.getElementById(id);
        if (el) el.textContent = statsMapping[id];
    }
}

function getPlanetDescription(id, defaultName) {
    const descriptions = {
        earth: "Earth is the third planet from the Sun and the only astronomical object known to harbor life.",
        mars: "Mars is the fourth planet from the Sun and is often referred to as the 'Red Planet'.",
        jupiter: "Jupiter is the fifth planet from the Sun and the largest in the Solar System.",
        saturn: "Saturn is the sixth planet from the Sun, best known for its extensive ring system.",
        venus: "Venus is the second planet from the Sun and is the hottest planet in our solar system.",
        mercury: "Mercury is the smallest planet in the Solar System and the closest to the Sun.",
        uranus: "Uranus is the seventh planet from the Sun and rotates on its side.",
        neptune: "Neptune is the eighth and farthest known planet from the Sun."
    };
    return descriptions[id] || `${defaultName} is a fascinating celestial body in our Solar System.`;
}

function setupApodDateControls() {
    const dateInput = document.getElementById("apod-date-input");
    const loadBtn = document.getElementById("load-date-btn");
    const todayBtn = document.getElementById("today-apod-btn");
    const wrapper = document.querySelector(".date-input-wrapper");

    if (!dateInput || !loadBtn || !todayBtn) return;

    const today = new Date().toISOString().split("T")[0];
    dateInput.max = today;
    dateInput.value = today;

    function updateLabel(val) {
        if (!val) { wrapper.setAttribute("data-date", "Select a date"); return; }
        const formatted = new Date(val + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        wrapper.setAttribute("data-date", formatted);
    }

    updateLabel(today);

    dateInput.addEventListener("change", () => updateLabel(dateInput.value));
    loadBtn.addEventListener("click", () => { if (dateInput.value) fetchAstronomyPicture(dateInput.value); });
    todayBtn.addEventListener("click", () => { dateInput.value = today; updateLabel(today); fetchAstronomyPicture(null); });
}

function setupNavigation() {
    const links = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".app-section");

    function showSection(sectionId) {
        sections.forEach(s => s.classList.add("hidden"));
        document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(s => s.classList.remove("hidden"));

        links.forEach(link => {
            if (link.dataset.section === sectionId) {
                link.classList.add("bg-blue-500/10", "text-blue-400");
                link.classList.remove("text-slate-300");
            } else {
                link.classList.remove("bg-blue-500/10", "text-blue-400");
                link.classList.add("text-slate-300");
            }
        });
        window.scrollTo(0, 0);
    }

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
            if (window.closeSidebar) window.closeSidebar();
        });
    });

    showSection("today-in-space");
}


function setupSidebar() {
    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("sidebar-toggle");
    let overlay = null;

    if (!sidebar || !toggleBtn) return;

    function open() {
        sidebar.classList.add("sidebar-open");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "sidebar-overlay";
            overlay.onclick = close;
            document.body.appendChild(overlay);
        }
    }

    function close() {
        sidebar.classList.remove("sidebar-open");
        if (overlay) { overlay.remove(); overlay = null; }
    }

    toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        sidebar.classList.contains("sidebar-open") ? close() : open();
    });

    window.closeSidebar = close;
}

window.addEventListener("load", function() {
    setupNavigation();
    setupSidebar();
    setupApodDateControls();
    fetchAstronomyPicture();
    fetchPlanetsData();
    fetchUpcomingLaunches();
});