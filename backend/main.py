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

@app.post("/api/query")
async def query_intelligence(payload: dict):
    query = payload.get("query", "").lower()
    
    # Load context
    data_path = os.path.join(os.path.dirname(__file__), "..", "shared", "nexus_truth.json")
    context = {}
    if os.path.exists(data_path):
        with open(data_path, "r") as f:
            context = json.load(f)

    # Simplified heuristic-based intelligence for demo
    # (In production, this would call Claude API with context)
    if "jacket" in query or "101" in query:
        return {"response": "The Alpine Ridge Jacket (SKU-101) is the highest risk item. There is a 53-unit discrepancy between Shopify and WMS, resulting in $31,200 of capital sitting in limbo."}
    elif "vietnam" in query or "tariff" in query:
        return {"response": "Vietnam exposure is critical. With current inventory levels, a 32% tariff spike would increase annual landed costs by $145K. Relocating 23% of production to Mexico is the recommended mitigation strategy."}
    elif "returns" in query or "frozen" in query:
        return {"response": "The data fabric shows 15 returns currently stuck in 'Limbo' for an average of 24 days. This accounts for $40.8K in frozen asset value."}
    
    return {"response": "I've analyzed the NexusLink data fabric. I can provide specific insights on inventory discrepancies, tariff exposure, or frozen return values. What would you like to investigate?"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
