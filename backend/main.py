from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI(title="NexusLink API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "NexusLink Supply Chain Data Fabric API is active"}

@app.get("/inventory")
async def get_inventory():
    # Placeholder for canonical data model
    data_path = os.path.join(os.path.dirname(__file__), "..", "shared", "nexus_truth.json")
    if os.path.exists(data_path):
        with open(data_path, "r") as f:
            return json.load(f)
    return {"error": "Data model not yet initialized"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
