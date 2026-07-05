from contextlib import asynccontextmanager
from typing import List, Optional
from bson import ObjectId
from fastapi import FastAPI, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field

# ==========================================
# 1. DATABASE CONFIGURATION & LIFESPAN
# ==========================================
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "coffee_rating_app"


# Global client & db reference
db_client: Optional[AsyncIOMotorClient] = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles connection startup and graceful shutdown."""
    global db_client, db
    # Startup: Connect to MongoDB
    db_client = AsyncIOMotorClient(MONGODB_URL)
    db = db_client[DATABASE_NAME]
    print("Connected to MongoDB!")
    
    yield  # Application runs here
    
    # Shutdown: Close MongoDB connection
    if db_client:
        db_client.close()
        print("Disconnected from MongoDB.")

app = FastAPI(
    title="Coffee Rating API",
    description="Backend for rating coffee items using vote counting.",
    lifespan=lifespan
)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. PYDANTIC MODELS
# ==========================================
class CoffeeCreate(BaseModel):
    name: str = Field(..., min_length=2, example="Ethiopian Yirgacheffe")
    roast: str = Field(..., example="Light Roast")
    origin: Optional[str] = Field(None, example="Ethiopia")

class CoffeeResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    roast: str
    origin: Optional[str] = None
    votes: int = 0

    model_config = ConfigDict(populate_by_name=True)

# Helper function to serialize MongoDB documents to JSON
def format_doc(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc

# ==========================================
# 3. API ENDPOINTS
# ==========================================

@app.get("/api/coffees", response_model=List[CoffeeResponse],response_model_by_alias=False)
async def get_all_coffees():
    """Retrieve all coffee items sorted by highest votes."""
    coffees_cursor = db.coffees.find().sort("votes", -1)
    coffees = await coffees_cursor.to_list(length=100)
    return [format_doc(coffee) for coffee in coffees]


@app.post("/api/coffees", response_model=CoffeeResponse, status_code=status.HTTP_201_CREATED,response_model_by_alias=False)
async def create_coffee(coffee: CoffeeCreate):
    """Add a new coffee item to the menu with 0 initial votes."""
    coffee_dict = coffee.model_dump()
    coffee_dict["votes"] = 0  # Initialize vote count
    
    result = await db.coffees.insert_one(coffee_dict)
    
    # Fetch and return the inserted document
    created_coffee = await db.coffees.find_one({"_id": result.inserted_id})
    return format_doc(created_coffee)


@app.post("/api/coffees/{coffee_id}/vote", response_model=CoffeeResponse,response_model_by_alias=False)
async def vote_for_coffee(coffee_id: str):
    """
    Increment the vote count for a specific coffee item.
    Uses MongoDB atomic '$inc' operator to prevent race conditions during concurrent clicks.
    """
    if not ObjectId.is_valid(coffee_id):
        raise HTTPException(status_code=400, detail="Invalid Coffee ID format.")

    # Atomically increment the 'votes' field by 1 and return the updated document
    updated_coffee = await db.coffees.find_one_and_update(
        {"_id": ObjectId(coffee_id)},
        {"$inc": {"votes": 1}},
        return_document=True  # Returns the modified document after update
    )

    if not updated_coffee:
        raise HTTPException(status_code=404, detail="Coffee item not found.")

    return format_doc(updated_coffee)