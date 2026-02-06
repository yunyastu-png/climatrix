import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { 
  Zap, LogOut, MapPin, Thermometer, Droplets, Wind, Cloud, 
  AlertTriangle, TrendingUp, TrendingDown, Mic, MicOff, 
  Send, Settings, Globe, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Slider } from "../components/ui/slider";
import { ScrollArea } from "../components/ui/scroll-area";
import { useAuth } from "../context/AuthContext";
import ClimateMap from "../components/ClimateMap";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const translations = {
  en: {
    dashboard: "Dashboard",
    climateIntel: "Climate Intelligence",
    currentConditions: "Current Conditions",
    temperature: "Temperature",
    humidity: "Humidity",
    rainfall: "Rainfall",
    windSpeed: "Wind Speed",
    riskAssessment: "Risk Assessment",
    droughtRisk: "Drought Risk",
    floodRisk: "Flood Risk",
    heatStress: "Heat Stress",
    overallRisk: "Overall Risk",
    confidence: "Confidence",
    sustainability: "Sustainability Trends",
    groundwater: "Groundwater Level",
    cropYield: "Crop Yield Index",
    tempAnomaly: "Temperature Anomaly",
    scenarioSimulator: "Scenario Simulator",
    rainfallChange: "Rainfall Change",
    tempChange: "Temperature Change",
    simulate: "Simulate",
    aiChat: "AI Climate Assistant",
    askClimate: "Ask about climate...",
    voiceInput: "Voice Input",
    listening: "Listening...",
    logout: "Logout",
    past: "Past",
    current: "Current",
    future: "Future",
    days: "days"
  },
  ta: {
    dashboard: "டாஷ்போர்டு",
    climateIntel: "காலநிலை நுண்ணறிவு",
    currentConditions: "தற்போதைய நிலைமைகள்",
    temperature: "வெப்பநிலை",
    humidity: "ஈரப்பதம்",
    rainfall: "மழைப்பொழிவு",
    windSpeed: "காற்றின் வேகம்",
    riskAssessment: "ஆபத்து மதிப்பீடு",
    droughtRisk: "வறட்சி ஆபத்து",
    floodRisk: "வெள்ள ஆபத்து",
    heatStress: "வெப்ப அழுத்தம்",
    overallRisk: "ஒட்டுமொத்த ஆபத்து",
    confidence: "நம்பகத்தன்மை",
    sustainability: "நிலைத்தன்மை போக்குகள்",
    groundwater: "நிலத்தடி நீர் மட்டம்",
    cropYield: "பயிர் விளைச்சல் குறியீடு",
    tempAnomaly: "வெப்பநிலை விலகல்",
    scenarioSimulator: "சூழ்நிலை உருவகப்படுத்தி",
    rainfallChange: "மழைப்பொழிவு மாற்றம்",
    tempChange: "வெப்பநிலை மாற்றம்",
    simulate: "உருவகப்படுத்து",
    aiChat: "AI காலநிலை உதவியாளர்",
    askClimate: "காலநிலை பற்றி கேளுங்கள்...",
    voiceInput: "குரல் உள்ளீடு",
    listening: "கேட்கிறது...",
    logout: "வெளியேறு",
    past: "கடந்த",
    current: "தற்போதைய",
    future: "எதிர்கால",
    days: "நாட்கள்"
  }
};

const Dashboard = () => {
  const { user, token, logout, updateLanguage } = useAuth();
  const [lang, setLang] = useState(user?.preferred_language || "en");
  const t = translations[lang];
  
  const [location, setLocation] = useState({ lat: 13.0827, lon: 80.2707 }); // Default: Chennai
  const [climateData, setClimateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timelineMode, setTimelineMode] = useState("current");
  const [timelineDays, setTimelineDays] = useState(0);
  
  // Scenario Simulator
  const [scenarioRainfall, setScenarioRainfall] = useState(0);
  const [scenarioTemp, setScenarioTemp] = useState(0);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [simulating, setSimulating] = useState(false);
  
  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  // Voice
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchClimateData = useCallback(async (lat, lon) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/climate/data`, { lat, lon }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClimateData(response.data);
    } catch (error) {
      console.error("Climate data error:", error);
      toast.error("Failed to fetch climate data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = { lat: position.coords.latitude, lon: position.coords.longitude };
          setLocation(newLoc);
          fetchClimateData(newLoc.lat, newLoc.lon);
        },
        () => {
          // Use default location if denied
          fetchClimateData(location.lat, location.lon);
        }
      );
    } else {
      fetchClimateData(location.lat, location.lon);
    }
  }, []);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = lang === "ta" ? "ta-IN" : "en-US";
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
      };
      
      recognitionInstance.onerror = () => {
        setIsListening(false);
        toast.error("Voice recognition error");
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, [lang]);

  const handleMapClick = (lat, lon) => {
    setLocation({ lat, lon });
    fetchClimateData(lat, lon);
    toast.success(`Location updated: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const response = await axios.post(`${API}/climate/scenario`, {
        lat: location.lat,
        lon: location.lon,
        rainfall_change: scenarioRainfall,
        temperature_change: scenarioTemp
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScenarioResult(response.data);
      toast.success("Scenario simulation complete");
    } catch (error) {
      toast.error("Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setChatLoading(true);
    
    try {
      const response = await axios.post(`${API}/chat`, {
        message: userMessage,
        language: lang
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.response,
        confidence: response.data.confidence
      }]);
      
      // Text-to-speech for response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response.data.response);
        utterance.lang = lang === "ta" ? "ta-IN" : "en-US";
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      toast.error("Chat error");
      setChatMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again.",
        error: true
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const handleLanguageChange = async (newLang) => {
    setLang(newLang);
    await updateLanguage(newLang);
    if (recognition) {
      recognition.lang = newLang === "ta" ? "ta-IN" : "en-US";
    }
  };

  const getRiskColor = (value) => {
    if (value >= 70) return "text-[#FF2E2E]";
    if (value >= 40) return "text-[#FFB800]";
    return "text-[#00FF94]";
  };

  const getRiskBg = (value) => {
    if (value >= 70) return "bg-[#FF2E2E]/20 border-[#FF2E2E]/40";
    if (value >= 40) return "bg-[#FFB800]/20 border-[#FFB800]/40";
    return "bg-[#00FF94]/20 border-[#00FF94]/40";
  };

  const getCurrentData = () => {
    if (!climateData) return null;
    
    if (timelineMode === "current") {
      return climateData.current;
    } else if (timelineMode === "past" && climateData.historical) {
      const index = Math.min(timelineDays - 1, climateData.historical.length - 1);
      return climateData.historical[climateData.historical.length - 1 - index] || climateData.current;
    } else if (timelineMode === "future" && climateData.forecast) {
      const index = Math.min(timelineDays - 1, climateData.forecast.length - 1);
      return climateData.forecast[index] || climateData.current;
    }
    return climateData.current;
  };

  const currentWeather = getCurrentData();
  const risk = climateData?.risk_assessment;
  const sustainability = climateData?.sustainability_trends;

  return (
    <div className="min-h-screen bg-[#02040A] flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : 280 }}
        className="bg-[#0D121F]/90 border-r border-[#00E0FF]/10 flex flex-col h-screen sticky top-0"
      >
        {/* Logo */}
        <div className="p-4 border-b border-[#00E0FF]/10 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#00FF94]" />
              <span className="font-rajdhani font-bold text-white">ClimateAI</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-[#00E0FF]/10 text-[#00E0FF] transition-colors"
            data-testid="toggle-sidebar-btn"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        
        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-[#00E0FF]/10">
            <p className="text-white font-medium truncate">{user?.name}</p>
            <p className="text-[#94A3B8] text-sm truncate">{user?.email || user?.phone}</p>
          </div>
        )}
        
        {/* Language Toggle */}
        <div className="p-4 border-b border-[#00E0FF]/10">
          {!sidebarCollapsed ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageChange("en")}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                  lang === "en" ? "bg-[#00FF94]/20 text-[#00FF94]" : "text-[#94A3B8] hover:bg-[#00E0FF]/10"
                }`}
                data-testid="lang-toggle-en"
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange("ta")}
                className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                  lang === "ta" ? "bg-[#00FF94]/20 text-[#00FF94]" : "text-[#94A3B8] hover:bg-[#00E0FF]/10"
                }`}
                data-testid="lang-toggle-ta"
              >
                தமிழ்
              </button>
            </div>
          ) : (
            <button className="w-full flex justify-center p-2 text-[#94A3B8] hover:text-white">
              <Globe className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Location */}
        <div className="p-4 flex-1">
          {!sidebarCollapsed && (
            <div className="glass-card rounded-lg p-3">
              <div className="flex items-center gap-2 text-[#00E0FF] mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Location</span>
              </div>
              <p className="font-mono text-sm text-white">
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </p>
            </div>
          )}
        </div>
        
        {/* Logout */}
        <div className="p-4 border-t border-[#00E0FF]/10">
          <button
            onClick={logout}
            className={`flex items-center gap-2 text-[#FF2E2E] hover:text-[#FF2E2E]/80 transition-colors ${
              sidebarCollapsed ? "justify-center w-full" : ""
            }`}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>{t.logout}</span>}
          </button>
        </div>
      </motion.aside>
      
      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-rajdhani font-bold text-white mb-2">
            {t.climateIntel}
          </h1>
          
          {/* Timeline Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-lg bg-[#0D121F] p-1">
              {["past", "current", "future"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setTimelineMode(mode); setTimelineDays(mode === "current" ? 0 : 1); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    timelineMode === mode
                      ? "bg-[#00E0FF]/20 text-[#00E0FF]"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                  data-testid={`timeline-${mode}`}
                >
                  {t[mode]}
                </button>
              ))}
            </div>
            
            {timelineMode !== "current" && (
              <div className="flex items-center gap-2">
                {[1, 5, 10].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimelineDays(days)}
                    className={`px-3 py-1.5 rounded text-sm transition-all ${
                      timelineDays === days
                        ? "bg-[#00FF94]/20 text-[#00FF94]"
                        : "bg-[#0D121F] text-[#94A3B8] hover:text-white"
                    }`}
                    data-testid={`timeline-days-${days}`}
                  >
                    {days} {t.days}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="w-8 h-8 text-[#00E0FF] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Map - Full Width on Mobile, Large on Desktop */}
            <div className="lg:col-span-8 order-1" data-testid="climate-map-container">
              <div className="glass-card rounded-xl overflow-hidden h-[400px] lg:h-[500px]">
                <ClimateMap
                  center={[location.lat, location.lon]}
                  onMapClick={handleMapClick}
                  climateData={currentWeather}
                />
              </div>
            </div>
            
            {/* Risk Assessment Panel */}
            <div className="lg:col-span-4 order-2" data-testid="risk-panel">
              <div className="glass-card rounded-xl p-5">
                <h2 className="text-lg font-rajdhani font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#FFB800]" />
                  {t.riskAssessment}
                </h2>
                
                {risk && (
                  <div className="space-y-4">
                    {/* Drought Risk */}
                    <div className={`p-4 rounded-lg border ${getRiskBg(risk.drought_risk)}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#94A3B8] text-sm">{t.droughtRisk}</span>
                        <span className={`text-2xl font-rajdhani font-bold ${getRiskColor(risk.drought_risk)}`}>
                          {risk.drought_risk}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#0D121F] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.drought_risk}%` }}
                          className="h-full rounded-full"
                          style={{ 
                            background: risk.drought_risk >= 70 ? "#FF2E2E" : 
                                       risk.drought_risk >= 40 ? "#FFB800" : "#00FF94"
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Flood Risk */}
                    <div className={`p-4 rounded-lg border ${getRiskBg(risk.flood_risk)}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#94A3B8] text-sm">{t.floodRisk}</span>
                        <span className={`text-2xl font-rajdhani font-bold ${getRiskColor(risk.flood_risk)}`}>
                          {risk.flood_risk}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#0D121F] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.flood_risk}%` }}
                          className="h-full rounded-full"
                          style={{ 
                            background: risk.flood_risk >= 70 ? "#FF2E2E" : 
                                       risk.flood_risk >= 40 ? "#FFB800" : "#00FF94"
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Heat Stress */}
                    <div className={`p-4 rounded-lg border ${getRiskBg(risk.heat_stress)}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#94A3B8] text-sm">{t.heatStress}</span>
                        <span className={`text-2xl font-rajdhani font-bold ${getRiskColor(risk.heat_stress)}`}>
                          {risk.heat_stress}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#0D121F] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${risk.heat_stress}%` }}
                          className="h-full rounded-full"
                          style={{ 
                            background: risk.heat_stress >= 70 ? "#FF2E2E" : 
                                       risk.heat_stress >= 40 ? "#FFB800" : "#00FF94"
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Confidence */}
                    <div className="mt-4 p-3 bg-[#0D121F] rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#94A3B8]">{t.confidence}</span>
                        <span className="text-[#00E0FF] font-mono">{risk.confidence}%</span>
                      </div>
                    </div>
                    
                    {/* Assumptions */}
                    {risk.assumptions && (
                      <div className="text-xs text-[#64748B] space-y-1 mt-2">
                        {risk.assumptions.slice(0, 2).map((a, i) => (
                          <p key={i}>• {a}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Current Conditions */}
            <div className="lg:col-span-4 order-3" data-testid="current-conditions">
              <div className="glass-card rounded-xl p-5">
                <h2 className="text-lg font-rajdhani font-semibold text-white mb-4">
                  {t.currentConditions}
                </h2>
                
                {currentWeather && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#0D121F] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-[#FF2E2E] mb-1">
                        <Thermometer className="w-4 h-4" />
                        <span className="text-xs">{t.temperature}</span>
                      </div>
                      <p className="text-xl font-rajdhani font-bold text-white">
                        {currentWeather.temperature}°C
                      </p>
                    </div>
                    
                    <div className="bg-[#0D121F] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-[#00E0FF] mb-1">
                        <Droplets className="w-4 h-4" />
                        <span className="text-xs">{t.humidity}</span>
                      </div>
                      <p className="text-xl font-rajdhani font-bold text-white">
                        {currentWeather.humidity}%
                      </p>
                    </div>
                    
                    <div className="bg-[#0D121F] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-[#00FF94] mb-1">
                        <Cloud className="w-4 h-4" />
                        <span className="text-xs">{t.rainfall}</span>
                      </div>
                      <p className="text-xl font-rajdhani font-bold text-white">
                        {currentWeather.rainfall}mm
                      </p>
                    </div>
                    
                    <div className="bg-[#0D121F] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-[#FFB800] mb-1">
                        <Wind className="w-4 h-4" />
                        <span className="text-xs">{t.windSpeed}</span>
                      </div>
                      <p className="text-xl font-rajdhani font-bold text-white">
                        {currentWeather.wind_speed} km/h
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Sustainability Trends */}
            <div className="lg:col-span-4 order-4" data-testid="sustainability-panel">
              <div className="glass-card rounded-xl p-5">
                <h2 className="text-lg font-rajdhani font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00FF94]" />
                  {t.sustainability}
                </h2>
                
                {sustainability && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#0D121F] rounded-lg">
                      <span className="text-sm text-[#94A3B8]">{t.groundwater}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{sustainability.groundwater_level.current}m</span>
                        {sustainability.groundwater_level.change_percent < 0 ? (
                          <TrendingDown className="w-4 h-4 text-[#FF2E2E]" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-[#00FF94]" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#0D121F] rounded-lg">
                      <span className="text-sm text-[#94A3B8]">{t.cropYield}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">{sustainability.crop_yield_index.current}</span>
                        {sustainability.crop_yield_index.change_percent < 0 ? (
                          <TrendingDown className="w-4 h-4 text-[#FF2E2E]" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-[#00FF94]" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#0D121F] rounded-lg">
                      <span className="text-sm text-[#94A3B8]">{t.tempAnomaly}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">+{sustainability.temperature_anomaly.current}°C</span>
                        <TrendingUp className="w-4 h-4 text-[#FF2E2E]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Scenario Simulator */}
            <div className="lg:col-span-4 order-5" data-testid="scenario-simulator">
              <div className="glass-card rounded-xl p-5">
                <h2 className="text-lg font-rajdhani font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#00E0FF]" />
                  {t.scenarioSimulator}
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#94A3B8]">{t.rainfallChange}</span>
                      <span className="text-[#00E0FF] font-mono">{scenarioRainfall > 0 ? "+" : ""}{scenarioRainfall}%</span>
                    </div>
                    <Slider
                      value={[scenarioRainfall]}
                      onValueChange={([val]) => setScenarioRainfall(val)}
                      min={-100}
                      max={100}
                      step={5}
                      className="[&_[role=slider]]:bg-[#00E0FF]"
                      data-testid="rainfall-slider"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#94A3B8]">{t.tempChange}</span>
                      <span className="text-[#FF2E2E] font-mono">{scenarioTemp > 0 ? "+" : ""}{scenarioTemp}°C</span>
                    </div>
                    <Slider
                      value={[scenarioTemp]}
                      onValueChange={([val]) => setScenarioTemp(val)}
                      min={-10}
                      max={10}
                      step={0.5}
                      className="[&_[role=slider]]:bg-[#FF2E2E]"
                      data-testid="temp-slider"
                    />
                  </div>
                  
                  <Button
                    onClick={handleSimulate}
                    disabled={simulating}
                    className="w-full cyber-btn"
                    data-testid="simulate-btn"
                  >
                    {simulating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {t.simulate}
                  </Button>
                  
                  {scenarioResult && (
                    <div className="mt-4 p-3 bg-[#0D121F] rounded-lg text-sm space-y-2">
                      <p className="text-[#94A3B8]">Impact Analysis:</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[#FFB800] font-mono text-xs">Drought</p>
                          <p className={scenarioResult.scenario_impact.drought_risk_change > 0 ? "text-[#FF2E2E]" : "text-[#00FF94]"}>
                            {scenarioResult.scenario_impact.drought_risk_change > 0 ? "+" : ""}
                            {scenarioResult.scenario_impact.drought_risk_change}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[#00E0FF] font-mono text-xs">Flood</p>
                          <p className={scenarioResult.scenario_impact.flood_risk_change > 0 ? "text-[#FF2E2E]" : "text-[#00FF94]"}>
                            {scenarioResult.scenario_impact.flood_risk_change > 0 ? "+" : ""}
                            {scenarioResult.scenario_impact.flood_risk_change}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[#FF2E2E] font-mono text-xs">Heat</p>
                          <p className={scenarioResult.scenario_impact.heat_stress_change > 0 ? "text-[#FF2E2E]" : "text-[#00FF94]"}>
                            {scenarioResult.scenario_impact.heat_stress_change > 0 ? "+" : ""}
                            {scenarioResult.scenario_impact.heat_stress_change}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* AI Chat Panel */}
            <div className="lg:col-span-8 order-6" data-testid="chat-panel">
              <div className="glass-card rounded-xl p-5 h-[400px] flex flex-col">
                <h2 className="text-lg font-rajdhani font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#00FF94]" />
                  {t.aiChat}
                </h2>
                
                <ScrollArea className="flex-1 pr-4 mb-4">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="text-center text-[#64748B] py-8">
                        <p>Ask me anything about climate, risks, or sustainability!</p>
                        <p className="text-sm mt-2">Try: "What's the flood risk outlook?" or "வறட்சி ஆபத்து என்ன?"</p>
                      </div>
                    )}
                    
                    {chatMessages.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] p-3 rounded-xl ${
                          msg.role === "user"
                            ? "bg-[#00FF94]/20 text-white"
                            : msg.error
                            ? "bg-[#FF2E2E]/20 text-white"
                            : "bg-[#0D121F] text-white"
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          {msg.confidence && (
                            <p className="text-xs text-[#00E0FF] mt-1">
                              Confidence: {msg.confidence}%
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#0D121F] p-3 rounded-xl">
                          <div className="voice-wave">
                            <span /><span /><span /><span /><span />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2">
                  <button
                    onClick={toggleVoice}
                    className={`p-3 rounded-xl transition-all ${
                      isListening
                        ? "bg-[#FF2E2E] text-white glow-red"
                        : "bg-[#0D121F] text-[#94A3B8] hover:text-white"
                    }`}
                    data-testid="voice-btn"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChat()}
                    placeholder={isListening ? t.listening : t.askClimate}
                    className="flex-1 bg-[#0D121F] border border-[#00E0FF]/20 rounded-xl px-4 py-3 text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#00FF94]"
                    data-testid="chat-input"
                  />
                  
                  <Button
                    onClick={handleChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="cyber-btn px-4"
                    data-testid="send-chat-btn"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
