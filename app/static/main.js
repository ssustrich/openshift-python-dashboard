// Keep a private registry (optional, but handy)
const charts = {};

async function fetchWeather(lat, lon, days){
  const params = new URLSearchParams({
    latitude: lat, longitude: lon, forecast_days: days,
    hourly: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
    timezone: "auto"
  });
  const res = await fetch(`/api/weather?${params.toString()}`);
  if(!res.ok){ throw new Error("Weather API error"); }
  return res.json();
}

function buildChart(canvasId, labels, data, label){
  const canvas = document.getElementById(canvasId);
  const box = canvas.parentElement; // .chartbox

  // Destroy any existing chart on this canvas
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();

  // Make the canvas wide enough to show many labels, enable horizontal scroll.
  // ~12px per label is a good starting point; tweak as desired.
  const minPerLabel = 12;
  const desiredWidth = Math.max(box.clientWidth, labels.length * minPerLabel);
  canvas.style.width = desiredWidth + "px";
  canvas.style.height = "100%"; // will fill the 260px box height

  // Build the chart (turn off 'responsive' since we control size manually)
  const ctx = canvas.getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label, data, tension: 0.25, fill: false }] },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxRotation: 0, autoSkip: true } }
      },
      animation: false
    }
  });
}
async function load(){
  const lat = parseFloat(document.getElementById("lat").value);
  const lon = parseFloat(document.getElementById("lon").value);
  const days = parseInt(document.getElementById("days").value, 10);

  const data = await fetchWeather(lat, lon, days);
  const hours = data.hourly.time.map(t => t.replace("T"," "));

  buildChart("tempChart", hours, data.hourly.temperature_2m, "°C");
  buildChart("windChart", hours, data.hourly.wind_speed_10m, "m/s");
  buildChart("humidityChart", hours, data.hourly.relative_humidity_2m, "%");
  buildChart("precipChart", hours, data.hourly.precipitation, "mm");
}

document.getElementById("locForm").addEventListener("submit", (e)=>{
  e.preventDefault();
  load().catch(err => alert(err.message));
});

window.addEventListener("resize", () => {
  // re-run load() to rebuild charts with the current labels & container width
  load().catch(()=>{});
});

// Initial load
load().catch(()=>{});
