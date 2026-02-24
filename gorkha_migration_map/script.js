console.log("Mapbox:", mapboxgl);

mapboxgl.accessToken =
  "pk.eyJ1IjoicmluanVsYWhoIiwiYSI6ImNta2NtbmUyZjAyOTczZXNmazQ0YzFwbXYifQ.zH7crTXgOiyQas7lZDdj_w";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/outdoors-v12",
  center: [88.5, 26.8], //Darjeeling–Dooars region 
  zoom: 4.5
});

// Controls
map.addControl(new mapboxgl.NavigationControl(), "top-right");
map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

// Timeline data 
const nepaliLanguageTimeline = {
  1850: 3,   // early presence
  1870: 5,   // tea garden migration begins
  1900: 8,   // strong foothold in Darjeeling
  1920: 12,  // expansion into Dooars + Kalimpong
  1947: 18,  // pre-independence spread
  1992: 30,  // Nepali becomes official language of India
  2015: 38,  // post-constitutional strengthening
  2024: 50   // current widespread presence
};

// ----------------------------------------------------
// MAIN MAP LOAD BLOCK — EVERYTHING GOES INSIDE HERE
// ----------------------------------------------------
map.on("load", () => {

  // -----------------------------
  // FIND FIRST SYMBOL LAYER
  // -----------------------------
  const layers = map.getStyle().layers;
  const firstSymbolId = layers.find(l => l.type === "symbol").id;


  // -----------------------------
  // HISTORICAL THEME
  // -----------------------------
  map.setPaintProperty("land", "background-color", "#e8d9b5");
  map.setPaintProperty("water", "fill-color", "#8aa1b1");
  map.setPaintProperty("road-primary", "line-color", "#4a3a2a");
  map.setPaintProperty("road-secondary", "line-color", "#6b5644");
  map.setPaintProperty("road-tertiary", "line-color", "#8a725e");
  map.setPaintProperty("admin-0-boundary", "line-color", "#3b2f2f");
  map.setPaintProperty("admin-1-boundary", "line-color", "#5a4a3b");
  map.setPaintProperty("landcover", "fill-color", "#c8d1b0");
  map.setPaintProperty("place-label", "text-color", "#2f241d");
  map.setPaintProperty("road-label", "text-color", "#3b2f2f");
  map.setPaintProperty("water-label", "text-color", "#3b2f2f");

  map.setLayoutProperty("road-primary", "visibility", "visible");
  map.setLayoutProperty("road-secondary", "visibility", "visible");
  map.setLayoutProperty("road-tertiary", "visibility", "visible");
  map.setLayoutProperty("building", "visibility", "visible");
  map.setLayoutProperty("poi-label", "visibility", "visible");


  // -----------------------------
  fetch("gadm41_IND_2.json")
  .then(res => res.json())
  .then(data => {
    const targetStates = [
      "West Bengal",
      "Sikkim",
      "Assam",
      "Arunachal Pradesh",
      "Nagaland",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Tripura"
    ];

    const filtered = {
      type: "FeatureCollection",
      features: data.features.filter(
        f => targetStates.includes(f.properties.NAME_1)
      )
    };

    const centroidFeatures = filtered.features.map(f => {
      const c = turf.centroid(f);
      c.properties = {
        district: f.properties.NAME_2,
        state: f.properties.NAME_1
      };
      return c;
    });

    centroids = {
      type: "FeatureCollection",
      features: centroidFeatures
    };

    map.addSource("district_centroids", {
      type: "geojson",
      data: centroids
    });

    map.addLayer({
      id: "district_centroids_layer",
      type: "circle",
      source: "district_centroids",
      paint: {
        "circle-radius": 0,
        "circle-color": "#b33a3a",
        "circle-opacity": 0.35,
        "circle-blur": 0.8
      }
    });
  });

  // HILLSHADE
  // -----------------------------
  map.addSource("terrain", {
    type: "raster-dem",
    url: "mapbox://mapbox.terrain-rgb"
  });

  map.addLayer({
    id: "hillshade",
    type: "hillshade",
    source: "terrain",
    paint: {
      "hillshade-exaggeration": 0.2,
      "hillshade-shadow-color": "#6b5a4a",
      "hillshade-highlight-color": "#f5e9d2"
    }
  });


  // -----------------------------
  // MIGRATION ROUTE
  // -----------------------------
  const migrationRoute = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: [
        [86.0750, 27.6670],
        [86.0000, 27.5000],
        [85.9500, 27.3500],
        [85.9714, 27.2550],
        [85.9500, 27.0000],
        [85.9400, 26.8500],
        [85.9240, 26.7280],
        [86.5000, 26.7000],
        [87.0000, 26.6800],
        [87.2740, 26.6590],
        [87.4500, 26.6500],
        [87.6990, 26.6570],
        [88.0000, 26.6800],
        [88.2500, 26.7000],
        [88.4300, 26.7270],
        [88.4500, 26.8500],
        [88.4600, 26.9500],
        [88.4750, 27.0700],
        [88.7000, 26.9500],
        [88.8500, 26.9000],
        [88.9800, 26.8900]
      ]
    }
  };

  map.addSource("migration-route", {
    type: "geojson",
    data: migrationRoute
  });

  map.addLayer({
    id: "migration-route-line",
    type: "line",
    source: "migration-route",
    paint: {
      "line-color": "#b33a3a",
      "line-width": 2.2,
      "line-dasharray": [2, 2],
      "line-opacity": 0.9
    }
  });


  // -----------------------------
  // SMALL MARKERS
  // -----------------------------
  const stops = [
    { coords: [86.0750, 27.6670], name: "Charikot (Origin)" },
    { coords: [85.9714, 27.2550], name: "Kamalamai" },
    { coords: [85.9240, 26.7280], name: "Janakpur" },
    { coords: [87.2740, 26.6590], name: "Itahari" },
    { coords: [87.6990, 26.6570], name: "Damak" },
    { coords: [88.4300, 26.7270], name: "Siliguri" },
    { coords: [88.4750, 27.0700], name: "Kalimpong" },
    { coords: [88.9800, 26.8900], name: "Luksan Tea Busty" }
  ];

  stops.forEach(stop => {
    new mapboxgl.Marker({ color: "#4a3a2a", scale: 0.4 })
      .setLngLat(stop.coords)
      .setPopup(new mapboxgl.Popup().setHTML(`<b>${stop.name}</b>`))
  
      .addTo(map);
    const langSlider = document.getElementById("language-slider");
const langYearLabel = document.getElementById("language-year");

langSlider.addEventListener("input", () => {
  const year = parseInt(langSlider.value);
  langYearLabel.textContent = year;

  const definedYears = Object.keys(nepaliLanguageTimeline).map(Number);
  let closest = definedYears.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );

  const radius = nepaliLanguageTimeline[closest];

  map.setPaintProperty("nepali-language-layer", "circle-radius", radius);
});
  });
  
// language data 
  
  // -----------------------------
// NEPALI LANGUAGE SPREAD POINT
// -----------------------------
const nepaliLanguagePoint = {
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [88.2627, 27.0360] // Darjeeling
  }
};

map.addSource("nepali-language", {
  type: "geojson",
  data: nepaliLanguagePoint
});

map.addLayer({
  id: "nepali-language-layer",
  type: "circle",
  source: "nepali-language",
  paint: {
    "circle-radius": 0,
    "circle-color": "#b33a3a",
    "circle-opacity": 0.35
  }
});

// smooth animation
map.setPaintProperty("nepali-language-layer", "circle-radius-transition", {
  duration: 600,
  delay: 0
});
  const langSlider = document.getElementById("language-slider");
const langYearLabel = document.getElementById("language-year");

langSlider.addEventListener("input", () => {
  const year = parseInt(langSlider.value);
  langYearLabel.textContent = year;

  // find nearest defined year
  const definedYears = Object.keys(nepaliLanguageTimeline).map(Number);
  let closest = definedYears.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );

  const radius = nepaliLanguageTimeline[closest];

  map.setPaintProperty("nepali-language-layer", "circle-radius", radius);
});


  // -----------------------------
  // REGION FILLS
  // -----------------------------

  // --- NEPAL ---
  map.addSource("nepal", {
    type: "vector",
    url: "mapbox://rinjulahh.76xlwvlu"
  });

  map.addLayer({
    id: "nepal-fill",
    type: "fill",
    source: "nepal",
    "source-layer": "nepal_states_simplified_geojs-612k5g",
    paint: {
      "fill-color": "#d9d9d9",
      "fill-opacity": 0.25
    }
  }, firstSymbolId);


  // --- NE INDIA ---
  map.addSource("ne_india", {
    type: "vector",
    url: "mapbox://rinjulahh.2yl5wbdp"
  });

  map.addLayer({
    id: "ne_india-fill",
    type: "fill",
    source: "ne_india",
    "source-layer": "ne_india_simplified_geojson02-8qy62g",
    paint: {
      "fill-color": "#d9d9d9",
      "fill-opacity": 0.25
    }
  }, "nepal-fill");


  // --- WEST BENGAL ---
  map.addSource("west_bengal", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/Rinjula/westbengal_state02/refs/heads/main/westbengal_state02.geojson"
  });

  map.addLayer({
    id: "west_bengal-fill",
    type: "fill",
    source: "west_bengal",
    paint: {
      "fill-color": "#d9d9d9",
      "fill-opacity": 0.25
    }
  }, "ne_india-fill");


  // -----------------------------
  // CENTROIDS
  // -----------------------------

  // --- NEPAL CENTROIDS ---
  map.addSource("nepal_centroids", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/Rinjula/nepal_centroids/refs/heads/main/nepal_centroids02.geojson"
  });

  map.addLayer({
    id: "nepal_centroids-layer",
    type: "circle",
    source: "nepal_centroids",
    paint: {
      "circle-radius": 6,
      "circle-color": "#b24a2b",
      "circle-stroke-width": 0,
      "circle-stroke-color": "#ffffff"
    }
  }, "west_bengal-fill");


  // --- NE INDIA CENTROIDS ---
  map.addSource("ne_india_centroids", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/Rinjula/ne_india_centroids/refs/heads/main/ne_india_centroids02.geojson"
  });

  map.addLayer({
    id: "ne_india_centroids-layer",
    type: "circle",
    source: "ne_india_centroids",
    paint: {
      "circle-radius": 6,
      "circle-color": "#3b6ea5",
      "circle-stroke-width": 0,
      "circle-stroke-color": "#ffffff"
    }
  }, "nepal_centroids-layer");


  // --- WEST BENGAL CENTROIDS ---
  map.addSource("wb_centroids", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/Rinjula/westbengal_centroids02/refs/heads/main/westbengal_centroids.geojson"
  });

  map.addLayer({
    id: "wb_centroids-layer",
    type: "circle",
    source: "wb_centroids",
    paint: {
      "circle-radius": 6,
      "circle-color": "#4f8a4c",
      "circle-stroke-width": 0,
      "circle-stroke-color": "#ffffff"
    }
  }, "ne_india_centroids-layer");

}); // END OF MAP LOAD BLOCK



// ----------------------------------------------------
// NAVIGATION TABS
// ----------------------------------------------------
const tabs = document.querySelectorAll(".nav-item");
const searchPanel = document.getElementById("search-panel");
const infoPanel = document.getElementById("info-panel");
const aboutPanel = document.getElementById("about-panel");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {

    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const selected = tab.dataset.tab;

    infoPanel.style.display = "none";
    searchPanel.style.display = "none";
    aboutPanel.style.display = "none";

    if (selected === "home") infoPanel.style.display = "block";
    if (selected === "search") searchPanel.style.display = "block";
    if (selected === "about") aboutPanel.style.display = "block";
  });
});


// ----------------------------------------------------
// INFO PANEL TOGGLE
// ----------------------------------------------------
const infoToggle = document.getElementById("info-toggle");
const showInfo = document.getElementById("show-info");

infoToggle.addEventListener("click", () => {
  infoPanel.style.display = "none";
  showInfo.style.display = "block";
});

showInfo.addEventListener("click", () => {
  infoPanel.style.display = "block";
  showInfo.style.display = "none";
});


// ----------------------------------------------------
// SEARCH SYSTEM
// ----------------------------------------------------
const searchInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("suggestions");
const searchBtn = document.getElementById("search-btn");
const clearBtn = document.getElementById("clear-btn");

async function searchPlaces(query) {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&autocomplete=true&limit=5`;
  const response = await fetch(url);
  const data = await response.json();
  return data.features;
}

// AUTOCOMPLETE
searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  suggestionsBox.innerHTML = "";

  if (query.length === 0) {
    suggestionsBox.style.display = "none";
    searchBtn.style.display = "none";
    clearBtn.style.display = "inline-block";
    return;
  }

  searchBtn.style.display = "inline-block";
  clearBtn.style.display = "none";

  const results = await searchPlaces(query);

  if (results.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  results.forEach(place => {
    const div = document.createElement("div");
    div.textContent = place.place_name;

    div.addEventListener("click", () => {
      searchInput.value = place.place_name;
      searchInput.dataset.lng = place.center[0];
      searchInput.dataset.lat = place.center[1];

      suggestionsBox.style.display = "none";
      searchBtn.style.display = "inline-block";
      clearBtn.style.display = "none";
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = "block";
});

// CLEAR BUTTON
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  delete searchInput.dataset.lng;
  delete searchInput.dataset.lat;

  suggestionsBox.style.display = "none";
  clearBtn.style.display = "inline-block";
  searchBtn.style.display = "none";
});

// SEARCH BUTTON → ZOOM + MARKER
let searchMarker = null;

searchBtn.addEventListener("click", () => {
  const lng = parseFloat(searchInput.dataset.lng);
  const lat = parseFloat(searchInput.dataset.lat);

  if (!isNaN(lng) && !isNaN(lat)) {

    if (searchMarker) searchMarker.remove();

    searchMarker = new mapboxgl.Marker({
      color: "#ff5733"
    })
      .setLngLat([lng, lat])
      .addTo(map);

    map.flyTo({
      center: [lng, lat],
      zoom: 14,
      speed: 0.7,
      essential: true
    });

  } else {
    alert("Please select a place from the suggestions.");
  }
});
const langSlider = document.getElementById("language-slider");
const langYearLabel = document.getElementById("language-year");

langSlider.addEventListener("input", () => {
  const year = parseInt(langSlider.value);
  langYearLabel.textContent = year;

  // find nearest defined year
  const definedYears = Object.keys(nepaliLanguageTimeline).map(Number);
  let closest = definedYears.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );

  const radius = nepaliLanguageTimeline[closest];

  map.setPaintProperty("nepali-language-layer", "circle-radius", radius);
});
map.on("load", () => {

  // Load centroid GeoJSON
  fetch("https://raw.githubusercontent.com/Rinjula/westbengal_centroids02/main/westbengal_centroids.geojson")
    .then(res => res.json())
    .then(data => {

      window.originalCentroids = data;

      data.features.forEach(f => {
        const name = f.properties.DISTRICT;
        f.properties.current_lang = languageData[name]?.[1900] || 0;
      });

      map.addSource("wb_centroids_dynamic", {
        type: "geojson",
        data: data
      });

      map.addLayer({
        id: "wb_centroids_dynamic_layer",
        type: "circle",
        source: "wb_centroids_dynamic",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "current_lang"],
            0, 4,
            100, 22
          ],
          "circle-color": "#4CAF50"
        }
      });
    });
});
  // SLIDER WORKS ONLY AFTER SOURCE EXISTS
     document.getElementById("language-slider").addEventListener("input", (e) => {
  const year = e.target.value;

  const updated = {
    ...originalCentroids,
    features: originalCentroids.features.map(f => {
langSlider.addEventListener("input", () => {
  const year = parseInt(langSlider.value);
  langYearLabel.textContent = year;

  // find nearest defined year
  const definedYears = Object.keys(nepaliLanguageTimeline).map(Number);
  let closest = definedYears.reduce((prev, curr) =>
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );

  // radius MUST be defined BEFORE you use it
  const radius = nepaliLanguageTimeline[closest];

  // Darjeeling
  map.setPaintProperty("nepali-language-layer", "circle-radius", radius);

  // ALL OTHER CENTROIDS
  map.setPaintProperty("nepal_centroids-layer", "circle-radius", radius);
  map.setPaintProperty("ne_india_centroids-layer", "circle-radius", radius);
  map.setPaintProperty("wb_centroids-layer", "circle-radius", radius);
});
// FIX: use the correct name field
      const name = f.properties.DISTRICT;

      const langValue = languageData[name]?.[year] || 0;

      return {
        ...f,
        properties: {
          ...f.properties,
          current_lang: langValue
        }
      };
    })
  };

  map.getSource("wb_centroids_dynamic").setData(updated);

  document.getElementById("language-year").textContent = year;
});
 document.getElementById("language-slider").addEventListener("input", (e) => {
        const year = e.target.value;

        const updated = {
  ...originalCentroids,
  features: originalCentroids.features.map(f => {

    const name = getCentroidName(f.properties);

    const langValue = languageData[name]?.[year] || 0;

    return {
      ...f,
      properties: {
        ...f.properties,
        current_lang: langValue
      }
    };
  })
};

   // NOW the source exists → no more error
        document.getElementById("language-year").textContent = year;
      });
function getCentroidName(props) {
  return (
    props.DISTRICT ||
    props.Subdivision ||
    props.SUBDIVISION ||
    props.NAME_2 ||
    props.Name ||
    props.AC_NAME ||
    props.Block ||
    props.place ||
    null
  );
}

const languageData = {
  "Darjeeling":   {1900: 45, 1950: 60, 2000: 78},
  "Kalimpong":    {1900: 40, 1950: 58, 2000: 75},
  "Kurseong":     {1900: 35, 1950: 52, 2000: 70},
  "Siliguri":     {1900: 12, 1950: 28, 2000: 58},
  "Jalpaiguri":   {1900: 18, 1950: 32, 2000: 55},
  "Alipurduar":   {1900: 15, 1950: 28, 2000: 52}
};
// Load GADM level-2 (district) polygons
fetch("gadm41_IND_2.json")
  .then(res => res.json())
  .then(data => {
    const targetStates = [
      "West Bengal",
      "Sikkim",
      "Assam",
      "Arunachal Pradesh",
      "Nagaland",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Tripura"
    ];

    // Filter only NE India + WB districts
    const filtered = {
      type: "FeatureCollection",
      features: data.features.filter(
        f => targetStates.includes(f.properties.NAME_1)
      )
    };

    // Compute centroids
    const centroidFeatures = filtered.features.map(f => {
      const c = turf.centroid(f);
      c.properties = {
        district: f.properties.NAME_2,
        state: f.properties.NAME_1
      };
      return c;
    });

    const centroids = {
      type: "FeatureCollection",
      features: centroidFeatures
    };

    // Add to map
    map.addSource("district_centroids", {
      type: "geojson",
      data: centroids
    });

    map.addLayer({
      id: "district_centroids_layer",
      type: "circle",
      source: "district_centroids",
      paint: {
        "circle-radius": 0,
        "circle-color": "#b33a3a",
        "circle-opacity": 0.35,
        "circle-blur": 0.8
      }
    });
  });
 document.querySelectorAll(".info-header").forEach(header => {
  header.addEventListener("click", () => {
    const item = header.parentElement;
    item.classList.toggle("open");
  });
});
// --- CIRCLE DIAGRAM (Data section) ---
const circleCtx = document.getElementById("circleChart");

new Chart(circleCtx, {
  type: "doughnut",
  data: {
    labels: ["0–20%", "20–50%", "50–100%"],
    datasets: [{
      data: [20, 30, 50],
      backgroundColor: ["#b3e5fc", "#4fc3f7", "#0288d1"],
      borderWidth: 0
    }]
  },
  options: {
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12 }
      }
    }
  }
});

// --- LINE GRAPH (Graphs section) ---
const lineCtx = document.getElementById("lineChart");

new Chart(lineCtx, {
  type: "line",
  data: {
    labels: ["1850", "1870", "1900", "1920", "1947", "1992", "2015", "2024"],
    datasets: [{
      label: "Nepali Language % (Darjeeling example)",
      data: [10, 18, 45, 55, 60, 72, 78, 82],
      borderColor: "#4CAF50",
      backgroundColor: "rgba(76, 175, 80, 0.2)",
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3
    }]
  },
  options: {
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  }
});
let chartsRendered = false;

function renderCharts() {
  if (chartsRendered) return;
  chartsRendered = true;

  // CIRCLE CHART
  const circleCtx = document.getElementById("circleChart");
  new Chart(circleCtx, {
    type: "doughnut",
    data: {
      labels: ["0–20%", "20–50%", "50–100%"],
      datasets: [{
        data: [20, 30, 50],
        backgroundColor: ["#FFF9C4", "#FFE082", "#FFC107"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "60%",
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });

  // LINE CHART
  const lineCtx = document.getElementById("lineChart");
  new Chart(lineCtx, {
    type: "line",
    data: {
      labels: ["1850", "1870", "1900", "1920", "1947", "1992", "2015", "2024"],
      datasets: [{
        label: "Nepali Language %",
        data: [10, 18, 45, 55, 60, 72, 78, 82],
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}
map.on("load", () => {
  map.flyTo({
    center: [88.73, 26.88],
    zoom: 8,
    speed: 0.6,
    curve: 1.4
  });
});
map.on("load", () => {
  map.setPaintProperty("your-layer", "circle-opacity", 0);

  setTimeout(() => {
    map.setPaintProperty("your-layer", "circle-opacity", 1);
  }, 500);
});

