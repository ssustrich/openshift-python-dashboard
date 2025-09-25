import os
from fastapi import FastAPI, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import httpx

app = FastAPI(title="Weather Dashboard (OpenShift Sandbox)")

BASE_DIR = os.path.dirname(__file__)
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/weather")
async def weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    hourly: str = Query("temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"),
    forecast_days: int = Query(1, ge=1, le=7),
    timezone: str = Query("auto")
):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": hourly,
        "forecast_days": forecast_days,
        "timezone": timezone
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(OPEN_METEO_URL, params=params)
        r.raise_for_status()
        data = r.json()
    return JSONResponse(data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT","8080")))
