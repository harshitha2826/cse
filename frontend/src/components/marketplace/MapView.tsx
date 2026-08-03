// src/components/marketplace/MapView.tsx
import React from 'react';
import { MapPin, Navigation, ExternalLink, Building } from 'lucide-react';

export interface LocationData {
  address?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

interface MapViewProps {
  location?: LocationData;
  className?: string;
}

export const MapView: React.FC<MapViewProps> = ({ location, className = '' }) => {
  if (!location || (!location.city && !location.address && !location.lat)) {
    return (
      <div className={`p-4 bg-surface rounded-xl text-center text-xs text-muted-foreground border border-border ${className}`}>
        <MapPin className="w-5 h-5 mx-auto mb-1 text-gray-400" />
        No specific offline location details provided.
      </div>
    );
  }

  const city = location.city || 'Local Community Venue';
  const address = location.address || '';
  const lat = location.lat ?? 40.7128; // default NYC fallback coords if not provided
  const lng = location.lng ?? -74.0060;

  // OpenStreetMap embed URL with marker
  const bboxDelta = 0.015;
  const bbox = `${lng - bboxDelta},${lat - bboxDelta},${lng + bboxDelta},${lat + bboxDelta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const externalMapUrl = location.lat && location.lng 
    ? `https://www.google.com/maps?q=${lat},${lng}` 
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address} ${city}`)}`;

  return (
    <div className={`space-y-3 glass p-4 rounded-xl border border-border ${className}`}>
      {/* Location Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide">
            <Building className="w-3.5 h-3.5 text-rose-500" />
            <span>Offline Meeting Location</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-0.5">{city}</p>
          {address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              {address}
            </p>
          )}
        </div>

        <a
          href={externalMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-light transition-colors flex items-center gap-1 shrink-0 shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Get Directions</span>
          <ExternalLink className="w-3 h-3 opacity-70 ml-0.5" />
        </a>
      </div>

      {/* Interactive OpenStreetMap Iframe */}
      <div className="relative w-full h-44 rounded-lg overflow-hidden border border-gray-300 dark:border-zinc-700 shadow-inner group">
        <iframe
          title="Offline Skill Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={osmEmbedUrl}
          className="w-full h-full filter contrast-[0.95]"
        />
        
        {/* Floating Overlay Badge */}
        <div className="absolute bottom-2 left-2 bg-background/90 dark:bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-foreground flex items-center gap-1 shadow-md border border-border">
          <MapPin className="w-3 h-3 text-rose-500 animate-bounce" />
          <span>{address ? `${address}, ${city}` : city}</span>
        </div>
      </div>
    </div>
  );
};
