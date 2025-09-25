

# Weather Dashboard (FastAPI on UBI9) — OpenShift Sandbox Build

## TODO   fix the disconnect with the https routing
## TODO   Add webhooks to cause openshift to redeploy my image on a repo change

This repo is structured to **build entirely inside the OpenShift Developer Sandbox** using the **Python 3.11 UBI9 S2I** builder image. No local Docker/Podman 
needed.

## Files of note
- `app/main.py` — FastAPI app (serves `/` and `/api/weather`)
- `app/templates/index.html` + `app/static/*` — basic UI + Chart.js
- `requirements.txt` — dependencies
- `.s2i/environment` — tells the S2I image to run `python app/main.py` on port 8080

## Deploy in the Sandbox (CLI)
```bash
# 1) Log in to your Sandbox cluster (copy login command from web console)
oc login --token=... --server=https://api.sandbox-...openshiftapps.com:6443

# 2) Create/select a project
oc new-project weather-demo || oc project weather-demo

# 3) Start an in-cluster build and deploy using Source-to-Image (S2I)
oc new-app \
  registry.access.redhat.com/ubi9/python-311:latest~https://<your-git-host>/<your-user>/openshift-weather-dashboard-s2i.git \
  --name=weather-dashboard

# 4) Create a public Route
oc expose service weather-dashboard

# 5) Get the URL
oc get route weather-dashboard -o jsonpath='{.spec.host}{"\n"}'
# visit: https://<the-host>/
```

### Using the Web Console
- **Developer** → **+Add** → **Import from Git**  
- Git repo URL: `https://<your-git-host>/<your-user>/openshift-weather-dashboard-s2i.git`  
- **Builder Image**: *Python* (3.11 on UBI9)  
- **Name**: `weather-dashboard`  
- Create → Open the **Route** once the deployment is ready

## Redeploy after code changes
Push changes to your Git repo, then:
```bash
oc start-build bc/weather-dashboard --wait
oc rollout status deploy/weather-dashboard
```

## Troubleshooting
- If the pod can’t start: check logs
```bash
oc logs deploy/weather-dashboard -f
oc logs $(oc get pods -l app=weather-dashboard -o name | head -n1) -f
```
- If the Route shows a 503, wait for the ReadinessProbe to pass or check `oc describe route/weather-dashboard` for backend status.
