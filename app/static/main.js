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
  // If a chart already exists on this canvas, destroy it first
  const existing = Chart.getChart(canvas);   // works with Chart.js v3+
  if (existing) existing.destroy();

  const ctx = canvas.getContext("2d");
  charts[canvasId] = new Chart(ctx, {
    type: "line",
    data: { labels, datasets: [{ label, data, tension: 0.25, fill: false }]},
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { ticks: { maxRotation: 0, autoSkip: true } } }
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

// Initial load
load().catch(()=>{});
