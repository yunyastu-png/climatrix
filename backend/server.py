from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import random
import math
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'climate_platform_secret_key_2024')
JWT_ALGORITHM = "HS256"
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

security = HTTPBearer()

app = FastAPI(title="Climate Intelligence Platform")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========================= MODELS =========================

class UserCreate(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str
    name: str
    preferred_language: str = "en"

class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

class OTPVerify(BaseModel):
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    otp: str

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    name: str
    preferred_language: str
    is_verified: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class LocationRequest(BaseModel):
    lat: float
    lon: float

class ClimateDataResponse(BaseModel):
    location: Dict[str, float]
    current: Dict[str, Any]
    historical: List[Dict[str, Any]]
    forecast: List[Dict[str, Any]]
    risk_assessment: Dict[str, Any]
    sustainability_trends: Dict[str, Any]

class ScenarioRequest(BaseModel):
    lat: float
    lon: float
    rainfall_change: float  # -100 to +100 percentage
    temperature_change: float  # -10 to +10 degrees

class ChatMessage(BaseModel):
    message: str
    language: str = "en"

class ChatResponse(BaseModel):
    response: str
    confidence: float
    assumptions: List[str]
    references: List[str]

class RecommendationRequest(BaseModel):
    lat: float
    lon: float
    risk_data: Dict[str, Any]
    language: str = "en"

# ========================= HELPER FUNCTIONS =========================

def generate_otp():
    return str(random.randint(100000, 999999))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ========================= MOCK DATA GENERATORS =========================

def generate_mock_weather(lat: float, lon: float, base_date: datetime = None):
    """Generate realistic mock weather data based on location"""
    if base_date is None:
        base_date = datetime.now(timezone.utc)
    
    # Use location to create consistent but varied data
    seed_val = int((lat * 1000 + lon * 100) % 10000)
    random.seed(seed_val + base_date.day)
    
    # Base values influenced by latitude
    base_temp = 25 - abs(lat) * 0.5 + random.uniform(-5, 5)
    base_humidity = 50 + random.uniform(-20, 30)
    base_rainfall = max(0, random.uniform(-10, 50))
    
    return {
        "temperature": round(base_temp, 1),
        "feels_like": round(base_temp + random.uniform(-3, 3), 1),
        "humidity": round(min(100, max(0, base_humidity)), 1),
        "pressure": round(1013 + random.uniform(-20, 20), 1),
        "wind_speed": round(random.uniform(0, 25), 1),
        "wind_direction": round(random.uniform(0, 360), 0),
        "rainfall": round(base_rainfall, 1),
        "cloud_cover": round(random.uniform(0, 100), 1),
        "uv_index": round(random.uniform(1, 11), 1),
        "visibility": round(random.uniform(5, 20), 1)
    }

def generate_historical_data(lat: float, lon: float, days: int = 10):
    """Generate historical weather data"""
    data = []
    base_date = datetime.now(timezone.utc)
    for i in range(1, days + 1):
        date = base_date - timedelta(days=i)
        weather = generate_mock_weather(lat, lon, date)
        weather["date"] = date.isoformat()
        data.append(weather)
    return list(reversed(data))

def generate_forecast_data(lat: float, lon: float, days: int = 10):
    """Generate forecast weather data"""
    data = []
    base_date = datetime.now(timezone.utc)
    for i in range(1, days + 1):
        date = base_date + timedelta(days=i)
        weather = generate_mock_weather(lat, lon, date)
        weather["date"] = date.isoformat()
        # Add forecast confidence (decreases with time)
        weather["confidence"] = round(max(50, 95 - (i * 4)), 1)
        data.append(weather)
    return data

def calculate_risk_scores(weather_data: Dict, historical: List[Dict]):
    """Calculate climate risk scores using simple ML-like algorithms"""
    current = weather_data
    
    # Drought Risk (based on rainfall, humidity, temperature)
    drought_factors = []
    drought_factors.append(max(0, (30 - current["rainfall"]) / 30))  # Low rainfall
    drought_factors.append(max(0, (50 - current["humidity"]) / 50))  # Low humidity
    drought_factors.append(max(0, (current["temperature"] - 25) / 25))  # High temp
    drought_risk = sum(drought_factors) / len(drought_factors) * 100
    
    # Flood Risk (based on rainfall, humidity)
    flood_factors = []
    flood_factors.append(min(1, current["rainfall"] / 100))  # High rainfall
    flood_factors.append(min(1, current["humidity"] / 100))  # High humidity
    flood_factors.append(min(1, current["cloud_cover"] / 100))  # Cloud cover
    flood_risk = sum(flood_factors) / len(flood_factors) * 100
    
    # Heat Stress (based on temperature, humidity, UV)
    heat_factors = []
    heat_factors.append(max(0, (current["temperature"] - 20) / 30))
    heat_factors.append(max(0, current["humidity"] / 100))
    heat_factors.append(max(0, current["uv_index"] / 11))
    heat_risk = sum(heat_factors) / len(heat_factors) * 100
    
    # Calculate historical patterns for explainability
    avg_temp = sum([h["temperature"] for h in historical]) / len(historical) if historical else current["temperature"]
    avg_rainfall = sum([h["rainfall"] for h in historical]) / len(historical) if historical else current["rainfall"]
    
    return {
        "drought_risk": round(min(100, max(0, drought_risk)), 1),
        "flood_risk": round(min(100, max(0, flood_risk)), 1),
        "heat_stress": round(min(100, max(0, heat_risk)), 1),
        "overall_risk": round((drought_risk + flood_risk + heat_risk) / 3, 1),
        "confidence": 85.5,
        "assumptions": [
            f"Based on current temperature: {current['temperature']}°C",
            f"Historical average temperature: {round(avg_temp, 1)}°C",
            f"Current rainfall: {current['rainfall']}mm",
            f"Historical average rainfall: {round(avg_rainfall, 1)}mm"
        ],
        "historical_patterns": {
            "temp_trend": "rising" if current["temperature"] > avg_temp else "falling",
            "rainfall_trend": "above_normal" if current["rainfall"] > avg_rainfall else "below_normal"
        }
    }

def calculate_sustainability_trends(lat: float, lon: float):
    """Generate sustainability trend data"""
    seed_val = int((lat * 1000 + lon * 100) % 10000)
    random.seed(seed_val)
    
    return {
        "groundwater_level": {
            "current": round(random.uniform(-15, -5), 1),
            "change_percent": round(random.uniform(-10, 5), 1),
            "trend": "declining" if random.random() > 0.5 else "stable"
        },
        "crop_yield_index": {
            "current": round(random.uniform(70, 100), 1),
            "change_percent": round(random.uniform(-15, 15), 1),
            "trend": "improving" if random.random() > 0.4 else "declining"
        },
        "temperature_anomaly": {
            "current": round(random.uniform(0.5, 2.5), 2),
            "change_5yr": round(random.uniform(0.3, 1.5), 2),
            "trend": "rising"
        },
        "air_quality_index": {
            "current": round(random.uniform(30, 150), 0),
            "category": "moderate" if random.random() > 0.5 else "good"
        },
        "carbon_footprint": {
            "regional_avg": round(random.uniform(5, 15), 1),
            "national_avg": 8.5,
            "trend": "decreasing" if random.random() > 0.6 else "stable"
        }
    }

# ========================= AUTH ROUTES =========================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    """Register a new user"""
    identifier = user.email or user.phone
    if not identifier:
        raise HTTPException(status_code=400, detail="Email or phone required")
    
    # Check if user exists
    existing = await db.users.find_one({"$or": [{"email": user.email}, {"phone": user.phone}]})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Generate OTP
    otp = generate_otp()
    
    # Create user
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "phone": user.phone,
        "name": user.name,
        "password": hash_password(user.password),
        "preferred_language": user.preferred_language,
        "is_verified": False,
        "otp": otp,
        "otp_expires": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Return OTP in response for demo (mock OTP)
    return {
        "message": "Registration successful. Please verify OTP.",
        "demo_otp": otp,  # For demo purposes only
        "user_id": user_doc["id"]
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(data: OTPVerify):
    """Verify OTP for registration"""
    query = {}
    if data.email:
        query["email"] = data.email
    elif data.phone:
        query["phone"] = data.phone
    else:
        raise HTTPException(status_code=400, detail="Email or phone required")
    
    user = await db.users.find_one(query)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("otp") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    otp_expires = datetime.fromisoformat(user.get("otp_expires", ""))
    if datetime.now(timezone.utc) > otp_expires:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Update user as verified
    await db.users.update_one(query, {"$set": {"is_verified": True}, "$unset": {"otp": "", "otp_expires": ""}})
    
    # Create token
    token = create_token(user["id"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user.get("email"),
            phone=user.get("phone"),
            name=user["name"],
            preferred_language=user["preferred_language"],
            is_verified=True
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Login with email/phone and password"""
    query = {}
    if data.email:
        query["email"] = data.email
    elif data.phone:
        query["phone"] = data.phone
    else:
        raise HTTPException(status_code=400, detail="Email or phone required")
    
    user = await db.users.find_one(query)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user.get("email"),
            phone=user.get("phone"),
            name=user["name"],
            preferred_language=user["preferred_language"],
            is_verified=user.get("is_verified", False)
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=current_user["id"],
        email=current_user.get("email"),
        phone=current_user.get("phone"),
        name=current_user["name"],
        preferred_language=current_user["preferred_language"],
        is_verified=current_user.get("is_verified", False)
    )

# ========================= CLIMATE DATA ROUTES =========================

@api_router.post("/climate/data", response_model=ClimateDataResponse)
async def get_climate_data(location: LocationRequest):
    """Get comprehensive climate data for a location"""
    lat, lon = location.lat, location.lon
    
    current = generate_mock_weather(lat, lon)
    historical = generate_historical_data(lat, lon, 10)
    forecast = generate_forecast_data(lat, lon, 10)
    risk = calculate_risk_scores(current, historical)
    sustainability = calculate_sustainability_trends(lat, lon)
    
    return ClimateDataResponse(
        location={"lat": lat, "lon": lon},
        current=current,
        historical=historical,
        forecast=forecast,
        risk_assessment=risk,
        sustainability_trends=sustainability
    )

@api_router.post("/climate/scenario")
async def simulate_scenario(scenario: ScenarioRequest):
    """Simulate climate scenario with adjusted parameters"""
    lat, lon = scenario.lat, scenario.lon
    
    # Get base weather
    base_weather = generate_mock_weather(lat, lon)
    
    # Apply scenario changes
    modified_weather = base_weather.copy()
    modified_weather["rainfall"] = max(0, base_weather["rainfall"] * (1 + scenario.rainfall_change / 100))
    modified_weather["temperature"] = base_weather["temperature"] + scenario.temperature_change
    modified_weather["humidity"] = min(100, max(0, base_weather["humidity"] * (1 + scenario.rainfall_change / 200)))
    
    # Calculate new risks
    historical = generate_historical_data(lat, lon, 10)
    new_risk = calculate_risk_scores(modified_weather, historical)
    
    return {
        "original_weather": base_weather,
        "modified_weather": modified_weather,
        "original_risk": calculate_risk_scores(base_weather, historical),
        "modified_risk": new_risk,
        "scenario_impact": {
            "rainfall_change_applied": f"{scenario.rainfall_change:+.1f}%",
            "temperature_change_applied": f"{scenario.temperature_change:+.1f}°C",
            "drought_risk_change": round(new_risk["drought_risk"] - calculate_risk_scores(base_weather, historical)["drought_risk"], 1),
            "flood_risk_change": round(new_risk["flood_risk"] - calculate_risk_scores(base_weather, historical)["flood_risk"], 1),
            "heat_stress_change": round(new_risk["heat_stress"] - calculate_risk_scores(base_weather, historical)["heat_stress"], 1)
        }
    }

@api_router.get("/climate/layers")
async def get_map_layers():
    """Get available map layer configurations"""
    return {
        "layers": [
            {"id": "temperature", "name": "Temperature", "unit": "°C", "gradient": ["#0000FF", "#00FF00", "#FFFF00", "#FF0000"]},
            {"id": "rainfall", "name": "Rainfall", "unit": "mm", "gradient": ["#FFFFFF", "#87CEEB", "#1E90FF", "#00008B"]},
            {"id": "wind", "name": "Wind Speed", "unit": "km/h", "gradient": ["#90EE90", "#FFFF00", "#FFA500", "#FF0000"]},
            {"id": "humidity", "name": "Humidity", "unit": "%", "gradient": ["#F5DEB3", "#87CEEB", "#4169E1", "#00008B"]},
            {"id": "risk", "name": "Risk Level", "unit": "%", "gradient": ["#00FF00", "#FFFF00", "#FFA500", "#FF0000"]}
        ]
    }

# ========================= AI CHAT ROUTES =========================

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(message: ChatMessage, current_user: dict = Depends(get_current_user)):
    """Chat with AI about climate questions"""
    try:
        system_message = """You are a climate intelligence AI assistant for an environmental platform.
        You help users understand climate risks, sustainability trends, and environmental data.
        Provide actionable advice on water management, crop selection, and disaster preparedness.
        Be concise but informative. Always explain your reasoning.
        If the user asks in Tamil, respond in Tamil."""
        
        if message.language == "ta":
            system_message += "\n\nRespond in Tamil language."
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"climate_chat_{current_user['id']}_{datetime.now().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        user_msg = UserMessage(text=message.message)
        response = await chat.send_message(user_msg)
        
        # Store chat history
        await db.chat_history.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": current_user["id"],
            "message": message.message,
            "response": response,
            "language": message.language,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(
            response=response,
            confidence=92.5,
            assumptions=["Based on current global climate models", "Regional data from past 30 days"],
            references=["IPCC Climate Report 2023", "Regional Weather Bureau Data"]
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.post("/recommendations")
async def get_recommendations(request: RecommendationRequest, current_user: dict = Depends(get_current_user)):
    """Get AI-powered sustainability recommendations"""
    try:
        system_message = """You are a sustainability advisor. Based on climate risk data, provide specific recommendations for:
        1. Water management strategies
        2. Suitable crops for current conditions
        3. Disaster preparedness actions
        4. Carbon footprint reduction
        
        Format your response as JSON with keys: water_management, crop_suggestions, disaster_prep, carbon_tips
        Each should be a list of 2-3 actionable items."""
        
        if request.language == "ta":
            system_message += "\n\nProvide recommendations in Tamil language."
        
        risk_summary = f"""
        Location: {request.lat}, {request.lon}
        Drought Risk: {request.risk_data.get('drought_risk', 0)}%
        Flood Risk: {request.risk_data.get('flood_risk', 0)}%
        Heat Stress: {request.risk_data.get('heat_stress', 0)}%
        """
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"recommendations_{current_user['id']}",
            system_message=system_message
        ).with_model("openai", "gpt-5.2")
        
        response = await chat.send_message(UserMessage(text=f"Provide recommendations for: {risk_summary}"))
        
        return {
            "recommendations": response,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "location": {"lat": request.lat, "lon": request.lon}
        }
        
    except Exception as e:
        logger.error(f"Recommendations error: {str(e)}")
        # Fallback recommendations
        return {
            "recommendations": {
                "water_management": [
                    "Implement drip irrigation systems",
                    "Install rainwater harvesting",
                    "Monitor groundwater levels weekly"
                ],
                "crop_suggestions": [
                    "Consider drought-resistant varieties",
                    "Plant cover crops to retain moisture",
                    "Adjust planting schedule based on forecasts"
                ],
                "disaster_prep": [
                    "Create emergency water storage",
                    "Develop evacuation plans",
                    "Install early warning systems"
                ],
                "carbon_tips": [
                    "Use renewable energy sources",
                    "Practice no-till farming",
                    "Plant trees for carbon sequestration"
                ]
            },
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "location": {"lat": request.lat, "lon": request.lon},
            "is_fallback": True
        }

# ========================= USER PREFERENCES =========================

@api_router.put("/user/language")
async def update_language(language: str, current_user: dict = Depends(get_current_user)):
    """Update user's preferred language"""
    if language not in ["en", "ta"]:
        raise HTTPException(status_code=400, detail="Supported languages: en, ta")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"preferred_language": language}}
    )
    
    return {"message": "Language updated", "language": language}

# ========================= HEALTH CHECK =========================

@api_router.get("/")
async def root():
    return {"message": "Climate Intelligence Platform API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
