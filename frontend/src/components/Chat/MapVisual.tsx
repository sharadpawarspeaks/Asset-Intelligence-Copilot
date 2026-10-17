import React, { useEffect, useRef, useState } from 'react';
import { MapData, MapPin } from '../../types';
import { MapPin as PinIcon, Navigation, ExternalLink } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  data: MapData;
  onSelectWell?: (wellId: string) => void;
}

export const MapVisual: React.FC<Props> = ({ data, onSelectWell }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [activePin, setActivePin] = useState<MapPin | null>(data.pins?.[0] || null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView(
      [data.center_lat || 32.15, data.center_lon || -102.16],
      data.zoom || 11
    );

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #ef4444; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239,68,68,0.8);"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    data.pins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lon], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        setActivePin(pin);
      });
      marker.bindTooltip(`<strong>${pin.asset_id}</strong><br/>${pin.barrels || ''} bbl (${pin.date || ''})`, {
        direction: 'top',
        className: 'bg-slate-900 text-slate-100 text-xs border border-slate-700 px-2 py-1 rounded shadow'
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [data]);

  return (
    <div className="rounded-xl glass-card border border-slate-700/60 p-5 shadow-xl my-3 text-slate-100 max-w-2xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
          <Navigation className="w-4 h-4" /> {data.title}
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          {data.pins.length} Incident Locations
        </span>
      </div>

      {/* Leaflet map container */}
      <div className="h-64 w-full rounded-lg overflow-hidden border border-slate-800 relative z-0">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Pin cards list */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {data.pins.map((pin, i) => {
          const isSelected = activePin?.asset_id === pin.asset_id;
          return (
            <div
              key={i}
              onClick={() => {
                setActivePin(pin);
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.panTo([pin.lat, pin.lon]);
                }
              }}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-sky-950/40 border-sky-500 shadow-md' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWell && onSelectWell(pin.asset_id);
                  }}
                  className="font-bold text-sky-400 hover:underline flex items-center gap-1"
                >
                  {pin.asset_id}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </span>
                <span className="font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                  {pin.barrels} bbl
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Date: {pin.date}</span>
                <span className="font-mono text-slate-500">{pin.lat.toFixed(4)}, {pin.lon.toFixed(4)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
