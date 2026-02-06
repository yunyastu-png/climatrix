import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import { motion } from "framer-motion";
import { Layers, Thermometer, Droplets, Wind, Cloud, Satellite, Radio } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon
const customIcon = new L.DivIcon({
  className: "custom-marker",
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #00FF94;
      border: 3px solid #02040A;
      border-radius: 50%;
      box-shadow: 0 0 15px rgba(0, 255, 148, 0.6);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MapClickHandler = ({ onClick }) => {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const layers = [
  { id: "standard", name: "Standard", icon: Layers },
  { id: "satellite", name: "Satellite", icon: Satellite },
  { id: "temperature", name: "Temperature", icon: Thermometer },
  { id: "precipitation", name: "Precipitation", icon: Droplets },
  { id: "wind", name: "Wind", icon: Wind },
  { id: "clouds", name: "Clouds", icon: Cloud },
];

const tileUrls = {
  standard: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  temperature: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  precipitation: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  wind: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  clouds: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const ClimateMap = ({ center, onMapClick, climateData }) => {
  const [activeLayer, setActiveLayer] = useState("standard");
  const [showLayerPanel, setShowLayerPanel] = useState(false);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url={tileUrls[activeLayer]}
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        
        <MapClickHandler onClick={onMapClick} />
        <MapUpdater center={center} />
        
        <Marker position={center} icon={customIcon}>
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-rajdhani font-bold text-lg mb-2">Location Data</h3>
              {climateData && (
                <div className="space-y-1 text-sm">
                  <p><span className="text-[#FF2E2E]">🌡</span> Temp: {climateData.temperature}°C</p>
                  <p><span className="text-[#00E0FF]">💧</span> Humidity: {climateData.humidity}%</p>
                  <p><span className="text-[#00FF94]">🌧</span> Rainfall: {climateData.rainfall}mm</p>
                  <p><span className="text-[#FFB800]">💨</span> Wind: {climateData.wind_speed} km/h</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2 font-mono">
                {center[0].toFixed(4)}, {center[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Layer Control Panel */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="glass-card p-3 rounded-lg hover:bg-[#00E0FF]/10 transition-colors"
          data-testid="layer-toggle-btn"
        >
          <Layers className="w-5 h-5 text-[#00E0FF]" />
        </button>
        
        {showLayerPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-lg p-2 mt-2 min-w-[150px]"
          >
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  setActiveLayer(layer.id);
                  setShowLayerPanel(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                  activeLayer === layer.id
                    ? "bg-[#00FF94]/20 text-[#00FF94]"
                    : "text-[#94A3B8] hover:bg-[#00E0FF]/10 hover:text-white"
                }`}
                data-testid={`layer-${layer.id}`}
              >
                <layer.icon className="w-4 h-4" />
                {layer.name}
              </button>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Location Indicator */}
      <div className="absolute bottom-4 left-4 z-[1000] glass-card rounded-lg px-3 py-2">
        <p className="text-xs text-[#94A3B8]">Click anywhere on map to analyze</p>
      </div>
      
      {/* Weather Overlay Indicator */}
      {activeLayer !== "standard" && activeLayer !== "satellite" && (
        <div className="absolute top-4 left-4 z-[1000] glass-card rounded-lg px-3 py-2">
          <p className="text-xs text-[#00E0FF] uppercase tracking-wider">
            {activeLayer} Layer Active
          </p>
        </div>
      )}
    </div>
  );
};

export default ClimateMap;
