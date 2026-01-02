from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class UserSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: Optional[str] = None
    nationality: Optional[str] = None
    nationality_code: Optional[str] = None
    notifications_enabled: bool = True
    onboarding_completed: bool = False
    trial_start: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    subscription_status: str = "trial"  # trial | active | expired
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UserSettingsUpdate(BaseModel):
    first_name: Optional[str] = None
    nationality: Optional[str] = None
    nationality_code: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    onboarding_completed: Optional[bool] = None
    subscription_status: Optional[str] = None

class Trip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    country: str
    country_code: str
    visa_type: str
    entry_date: str
    exit_date: str
    total_days: int
    extensions_available: int = 0
    status: str = "active"  # active | completed | expired
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TripCreate(BaseModel):
    user_id: str
    country: str
    country_code: str
    visa_type: str
    entry_date: str
    exit_date: str
    extensions_available: int = 0

class VisaCheckRequest(BaseModel):
    nationality_code: str
    destination_code: str
    travel_purpose: str = "tourism"  # tourism | business | transit

class VisaRequirement(BaseModel):
    verdict: str  # visa_free | evisa | visa_on_arrival | embassy_visa
    permitted_days: Optional[int] = None
    conditions: List[str] = []
    cost_usd: Optional[float] = None
    processing_days: Optional[str] = None
    last_updated: str
    application_link: Optional[str] = None

# ============== VISA REQUIREMENTS DATABASE ==============

VISA_REQUIREMENTS: Dict[str, Dict[str, Any]] = {
    # US Citizens
    "US-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months", "Proof of onward travel", "Proof of accommodation"], "last_updated": "2025-01-15"},
    "US-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay", "Return ticket required"], "last_updated": "2025-01-15"},
    "US-GB": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "US-FR": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Schengen zone - 90 days within 180 days"], "last_updated": "2025-01-15"},
    "US-DE": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Schengen zone - 90 days within 180 days"], "last_updated": "2025-01-15"},
    "US-IT": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Schengen zone - 90 days within 180 days"], "last_updated": "2025-01-15"},
    "US-ES": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Schengen zone - 90 days within 180 days"], "last_updated": "2025-01-15"},
    "US-MX": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid 6+ months", "Tourist card (FMM) required"], "last_updated": "2025-01-15"},
    "US-CA": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "US-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required", "Passport valid 6+ months"], "cost_usd": 20, "processing_days": "1-2", "application_link": "https://www.eta.homeaffairs.gov.au", "last_updated": "2025-01-15"},
    "US-ID": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months", "Entry via designated airports"], "last_updated": "2025-01-15"},
    "US-VN": {"verdict": "evisa", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "cost_usd": 25, "processing_days": "3-5", "application_link": "https://evisa.xuatnhapcanh.gov.vn", "last_updated": "2025-01-15"},
    "US-IN": {"verdict": "evisa", "permitted_days": 60, "conditions": ["Passport valid 6+ months", "2 blank pages required"], "cost_usd": 25, "processing_days": "1-3", "application_link": "https://indianvisaonline.gov.in", "last_updated": "2025-01-15"},
    "US-CN": {"verdict": "embassy_visa", "permitted_days": 30, "conditions": ["Apply at Chinese embassy", "Invitation letter may be required"], "cost_usd": 140, "processing_days": "4-7", "last_updated": "2025-01-15"},
    "US-RU": {"verdict": "embassy_visa", "permitted_days": 30, "conditions": ["Apply at Russian embassy", "Invitation letter required"], "cost_usd": 160, "processing_days": "5-10", "last_updated": "2025-01-15"},
    "US-BR": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "US-AE": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "US-SG": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "US-KR": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["K-ETA required", "Passport valid 6+ months"], "cost_usd": 10, "processing_days": "1", "application_link": "https://www.k-eta.go.kr", "last_updated": "2025-01-15"},
    "US-PH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months", "Return ticket required"], "last_updated": "2025-01-15"},
    
    # UK Citizens
    "GB-US": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ESTA required", "Passport valid throughout stay"], "cost_usd": 21, "processing_days": "1", "application_link": "https://esta.cbp.dhs.gov", "last_updated": "2025-01-15"},
    "GB-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months", "Proof of onward travel"], "last_updated": "2025-01-15"},
    "GB-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "GB-FR": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Schengen zone - 90 days within 180 days"], "last_updated": "2025-01-15"},
    "GB-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required"], "cost_usd": 20, "processing_days": "1-2", "application_link": "https://www.eta.homeaffairs.gov.au", "last_updated": "2025-01-15"},
    "GB-MX": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "GB-CA": {"verdict": "evisa", "permitted_days": 180, "conditions": ["eTA required"], "cost_usd": 7, "processing_days": "1", "application_link": "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html", "last_updated": "2025-01-15"},
    "GB-IN": {"verdict": "evisa", "permitted_days": 60, "conditions": ["Passport valid 6+ months"], "cost_usd": 25, "processing_days": "1-3", "application_link": "https://indianvisaonline.gov.in", "last_updated": "2025-01-15"},
    
    # Canadian Citizens
    "CA-US": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Valid passport or enhanced driver's license"], "last_updated": "2025-01-15"},
    "CA-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "CA-MX": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "CA-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "CA-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required"], "cost_usd": 20, "processing_days": "1-2", "application_link": "https://www.eta.homeaffairs.gov.au", "last_updated": "2025-01-15"},
    "CA-GB": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "CA-FR": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Schengen zone - 90 days within 180 days"], "last_updated": "2025-01-15"},
    
    # Australian Citizens
    "AU-US": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ESTA required"], "cost_usd": 21, "processing_days": "1", "application_link": "https://esta.cbp.dhs.gov", "last_updated": "2025-01-15"},
    "AU-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "AU-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "AU-ID": {"verdict": "visa_on_arrival", "permitted_days": 30, "conditions": ["Passport valid 6+ months", "Payment at airport"], "cost_usd": 35, "last_updated": "2025-01-15"},
    "AU-NZ": {"verdict": "visa_free", "permitted_days": 0, "conditions": ["Unlimited stay for Australian citizens"], "last_updated": "2025-01-15"},
    "AU-GB": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "AU-SG": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    
    # German Citizens
    "DE-US": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ESTA required"], "cost_usd": 21, "processing_days": "1", "application_link": "https://esta.cbp.dhs.gov", "last_updated": "2025-01-15"},
    "DE-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "DE-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "DE-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required"], "cost_usd": 20, "processing_days": "1-2", "application_link": "https://www.eta.homeaffairs.gov.au", "last_updated": "2025-01-15"},
    "DE-CA": {"verdict": "evisa", "permitted_days": 180, "conditions": ["eTA required"], "cost_usd": 7, "processing_days": "1", "application_link": "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html", "last_updated": "2025-01-15"},
    
    # Indian Citizens
    "IN-US": {"verdict": "embassy_visa", "permitted_days": 180, "conditions": ["B1/B2 visa required", "Interview at embassy"], "cost_usd": 185, "processing_days": "5-30", "last_updated": "2025-01-15"},
    "IN-TH": {"verdict": "visa_on_arrival", "permitted_days": 15, "conditions": ["Passport valid 6+ months", "10,000 THB in cash"], "cost_usd": 60, "last_updated": "2025-01-15"},
    "IN-GB": {"verdict": "embassy_visa", "permitted_days": 180, "conditions": ["Standard visitor visa", "Apply online"], "cost_usd": 130, "processing_days": "15-20", "last_updated": "2025-01-15"},
    "IN-SG": {"verdict": "evisa", "permitted_days": 30, "conditions": ["Apply through authorized agent"], "cost_usd": 30, "processing_days": "3-5", "last_updated": "2025-01-15"},
    "IN-AE": {"verdict": "evisa", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "cost_usd": 90, "processing_days": "3-5", "last_updated": "2025-01-15"},
    "IN-JP": {"verdict": "embassy_visa", "permitted_days": 15, "conditions": ["Apply at embassy", "Itinerary required"], "cost_usd": 30, "processing_days": "5-7", "last_updated": "2025-01-15"},
    "IN-AU": {"verdict": "embassy_visa", "permitted_days": 90, "conditions": ["Apply online", "Health requirements may apply"], "cost_usd": 145, "processing_days": "15-30", "last_updated": "2025-01-15"},
    "IN-ID": {"verdict": "visa_on_arrival", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "cost_usd": 35, "last_updated": "2025-01-15"},
    
    # French Citizens
    "FR-US": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ESTA required"], "cost_usd": 21, "processing_days": "1", "application_link": "https://esta.cbp.dhs.gov", "last_updated": "2025-01-15"},
    "FR-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "FR-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "FR-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required"], "cost_usd": 20, "processing_days": "1-2", "application_link": "https://www.eta.homeaffairs.gov.au", "last_updated": "2025-01-15"},
    "FR-CA": {"verdict": "evisa", "permitted_days": 180, "conditions": ["eTA required"], "cost_usd": 7, "processing_days": "1", "last_updated": "2025-01-15"},
    
    # Japanese Citizens  
    "JP-US": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ESTA required"], "cost_usd": 21, "processing_days": "1", "application_link": "https://esta.cbp.dhs.gov", "last_updated": "2025-01-15"},
    "JP-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "JP-GB": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "JP-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required"], "cost_usd": 20, "processing_days": "1-2", "application_link": "https://www.eta.homeaffairs.gov.au", "last_updated": "2025-01-15"},
    "JP-KR": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid 3+ months"], "last_updated": "2025-01-15"},
    "JP-SG": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    
    # Brazilian Citizens
    "BR-US": {"verdict": "embassy_visa", "permitted_days": 180, "conditions": ["B1/B2 visa required", "Interview at embassy"], "cost_usd": 185, "processing_days": "5-30", "last_updated": "2025-01-15"},
    "BR-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "BR-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "BR-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required"], "cost_usd": 20, "processing_days": "1-2", "last_updated": "2025-01-15"},
    
    # Chinese Citizens
    "CN-US": {"verdict": "embassy_visa", "permitted_days": 180, "conditions": ["B1/B2 visa required", "Interview at embassy"], "cost_usd": 185, "processing_days": "5-30", "last_updated": "2025-01-15"},
    "CN-TH": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "CN-JP": {"verdict": "embassy_visa", "permitted_days": 15, "conditions": ["Apply at embassy", "Financial proof required"], "cost_usd": 30, "processing_days": "5-7", "last_updated": "2025-01-15"},
    "CN-SG": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "CN-AE": {"verdict": "visa_free", "permitted_days": 30, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    
    # Korean Citizens
    "KR-US": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ESTA required"], "cost_usd": 21, "processing_days": "1", "application_link": "https://esta.cbp.dhs.gov", "last_updated": "2025-01-15"},
    "KR-TH": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid 6+ months"], "last_updated": "2025-01-15"},
    "KR-JP": {"verdict": "visa_free", "permitted_days": 90, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
    "KR-AU": {"verdict": "evisa", "permitted_days": 90, "conditions": ["ETA required"], "cost_usd": 20, "processing_days": "1-2", "last_updated": "2025-01-15"},
    "KR-GB": {"verdict": "visa_free", "permitted_days": 180, "conditions": ["Passport valid throughout stay"], "last_updated": "2025-01-15"},
}

# Countries list for dropdowns
COUNTRIES = [
    {"code": "US", "name": "United States"},
    {"code": "GB", "name": "United Kingdom"},
    {"code": "CA", "name": "Canada"},
    {"code": "AU", "name": "Australia"},
    {"code": "DE", "name": "Germany"},
    {"code": "FR", "name": "France"},
    {"code": "IT", "name": "Italy"},
    {"code": "ES", "name": "Spain"},
    {"code": "JP", "name": "Japan"},
    {"code": "KR", "name": "South Korea"},
    {"code": "CN", "name": "China"},
    {"code": "IN", "name": "India"},
    {"code": "TH", "name": "Thailand"},
    {"code": "ID", "name": "Indonesia"},
    {"code": "VN", "name": "Vietnam"},
    {"code": "PH", "name": "Philippines"},
    {"code": "SG", "name": "Singapore"},
    {"code": "MY", "name": "Malaysia"},
    {"code": "MX", "name": "Mexico"},
    {"code": "BR", "name": "Brazil"},
    {"code": "AR", "name": "Argentina"},
    {"code": "AE", "name": "United Arab Emirates"},
    {"code": "SA", "name": "Saudi Arabia"},
    {"code": "RU", "name": "Russia"},
    {"code": "NZ", "name": "New Zealand"},
    {"code": "ZA", "name": "South Africa"},
    {"code": "NL", "name": "Netherlands"},
    {"code": "BE", "name": "Belgium"},
    {"code": "CH", "name": "Switzerland"},
    {"code": "AT", "name": "Austria"},
    {"code": "SE", "name": "Sweden"},
    {"code": "NO", "name": "Norway"},
    {"code": "DK", "name": "Denmark"},
    {"code": "FI", "name": "Finland"},
    {"code": "IE", "name": "Ireland"},
    {"code": "PT", "name": "Portugal"},
    {"code": "GR", "name": "Greece"},
    {"code": "PL", "name": "Poland"},
    {"code": "CZ", "name": "Czech Republic"},
    {"code": "HU", "name": "Hungary"},
    {"code": "TR", "name": "Turkey"},
    {"code": "EG", "name": "Egypt"},
    {"code": "IL", "name": "Israel"},
    {"code": "NG", "name": "Nigeria"},
    {"code": "KE", "name": "Kenya"},
    {"code": "CO", "name": "Colombia"},
    {"code": "CL", "name": "Chile"},
    {"code": "PE", "name": "Peru"},
    {"code": "HK", "name": "Hong Kong"},
    {"code": "TW", "name": "Taiwan"},
]

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "VisaFlow API v1.0"}

@api_router.get("/countries")
async def get_countries():
    return COUNTRIES

# User Settings
@api_router.post("/users", response_model=UserSettings)
async def create_user():
    user = UserSettings()
    doc = user.model_dump()
    await db.users.insert_one(doc)
    return user

@api_router.get("/users/{user_id}", response_model=UserSettings)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.patch("/users/{user_id}", response_model=UserSettings)
async def update_user(user_id: str, update: UserSettingsUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return user

# Trips
@api_router.post("/trips", response_model=Trip)
async def create_trip(trip_data: TripCreate):
    # Calculate total days
    entry = datetime.fromisoformat(trip_data.entry_date)
    exit_date = datetime.fromisoformat(trip_data.exit_date)
    total_days = (exit_date - entry).days
    
    trip = Trip(
        user_id=trip_data.user_id,
        country=trip_data.country,
        country_code=trip_data.country_code,
        visa_type=trip_data.visa_type,
        entry_date=trip_data.entry_date,
        exit_date=trip_data.exit_date,
        total_days=total_days,
        extensions_available=trip_data.extensions_available
    )
    
    doc = trip.model_dump()
    await db.trips.insert_one(doc)
    return trip

@api_router.get("/trips/{user_id}", response_model=List[Trip])
async def get_user_trips(user_id: str):
    trips = await db.trips.find({"user_id": user_id, "status": "active"}, {"_id": 0}).to_list(100)
    return trips

@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str):
    result = await db.trips.delete_one({"id": trip_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted successfully"}

@api_router.patch("/trips/{trip_id}/complete")
async def complete_trip(trip_id: str):
    result = await db.trips.update_one({"id": trip_id}, {"$set": {"status": "completed"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip marked as completed"}

# Visa Requirements Check
@api_router.post("/check-requirements")
async def check_visa_requirements(request: VisaCheckRequest):
    key = f"{request.nationality_code}-{request.destination_code}"
    
    if key in VISA_REQUIREMENTS:
        req = VISA_REQUIREMENTS[key]
        return {
            "found": True,
            "nationality_code": request.nationality_code,
            "destination_code": request.destination_code,
            **req
        }
    else:
        # Return a default response for unknown combinations
        return {
            "found": False,
            "nationality_code": request.nationality_code,
            "destination_code": request.destination_code,
            "verdict": "unknown",
            "message": "Visa requirements not found in our database. Please check with the embassy.",
            "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d")
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
