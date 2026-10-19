'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, CheckCircle2 } from 'lucide-react';

export interface PhotonFeature {
  type: string;
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface SelectedLocation {
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (loc: SelectedLocation) => void;
  placeholder?: string;
  className?: string;
  hasCoordinates?: boolean;
}

export function formatPhotonFeature(feature: PhotonFeature) {
  const p = feature.properties || {};
  const [lon, lat] = feature.geometry.coordinates;

  const streetWithNumber = [p.housenumber, p.street].filter(Boolean).join(' ');
  const primary = p.name || streetWithNumber || p.locality || p.district || p.city || 'Location';

  const contextParts = [
    p.name !== streetWithNumber ? streetWithNumber : null,
    p.locality || p.district || p.suburb,
    p.city || p.county,
    p.state,
    p.postcode,
    p.country,
  ].filter(Boolean) as string[];

  const secondaryParts = Array.from(new Set(contextParts)).filter((part) => part !== primary);
  const secondary = secondaryParts.join(', ');

  const addressParts = [
    p.name,
    streetWithNumber,
    p.locality || p.district || p.suburb,
  ].filter(Boolean) as string[];
  const addressLine = Array.from(new Set(addressParts)).join(', ') || primary;

  return {
    primary,
    secondary,
    addressLine,
    city: p.city || p.county || (p.type === 'city' ? p.name : undefined),
    state: p.state,
    postalCode: p.postcode,
    country: p.country,
    latitude: lat,
    longitude: lon,
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Start typing hotel address or landmark (e.g. Connaught Place)...',
  className = '',
  hasCoordinates = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSelectionRef = useRef(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (isSelectionRef.current) {
      isSelectionRef.current = false;
      return;
    }

    const trimmed = value.trim();

    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(false);
    const currentRequestId = ++activeRequestIdRef.current;

    const timer = setTimeout(async () => {
      // Abort previous inflight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5&lang=en`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`Photon API HTTP ${res.status}`);
        }

        const data = await res.json();

        // Prevent stale responses from overwriting newer search results
        if (currentRequestId === activeRequestIdRef.current) {
          setSuggestions(data.features || []);
          setIsOpen(true);
          setHasSearched(true);
          setActiveIndex(-1);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Photon address search error:', err);
          if (currentRequestId === activeRequestIdRef.current) {
            setSuggestions([]);
            setHasSearched(true);
          }
        }
      } finally {
        if (currentRequestId === activeRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  const handleSelect = (feature: PhotonFeature) => {
    isSelectionRef.current = true;
    const formatted = formatPhotonFeature(feature);

    onChange(formatted.addressLine);
    onSelectLocation({
      address: formatted.addressLine,
      city: formatted.city,
      state: formatted.state,
      postalCode: formatted.postalCode,
      country: formatted.country,
      latitude: formatted.latitude,
      longitude: formatted.longitude,
    });

    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full pl-9 pr-9 py-2.5 text-xs rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-blue ${className}`}
        />
        <div className="absolute left-3 top-3 pointer-events-none text-content-secondary-light">
          <MapPin className="w-4 h-4" />
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
          )}
          {!isLoading && hasCoordinates && (
            <span title="GPS Coordinates Pinned" className="text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      {/* Autocomplete Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-border-light rounded-xl shadow-xl z-50 overflow-hidden text-xs">
          {suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto divide-y divide-border-light">
              {suggestions.map((item, index) => {
                const formatted = formatPhotonFeature(item);
                const isSelected = index === activeIndex;

                return (
                  <li
                    key={`${item.properties.osm_id || index}-${index}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`px-3.5 py-2.5 cursor-pointer flex items-start gap-2.5 transition ${
                      isSelected
                        ? 'bg-blue-50 text-brand-blue'
                        : 'hover:bg-slate-50 text-content-primary-light'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-brand-blue">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">
                        {formatted.primary}
                      </div>
                      {formatted.secondary && (
                        <div className="text-[11px] text-content-secondary-light truncate mt-0.5">
                          {formatted.secondary}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : hasSearched && !isLoading ? (
            <div className="p-3 text-center text-content-secondary-light text-[11px]">
              No matching locations found. You can continue typing the address manually.
            </div>
          ) : null}

          {/* Attribution & Search Tip */}
          <div className="px-3 py-1.5 bg-surface-light border-t border-border-light text-[10px] text-content-secondary-light flex items-center justify-between">
            <span>Powered by Photon (OpenStreetMap)</span>
            <span className="text-[9px] text-slate-400">↑↓ to navigate • ↵ to select</span>
          </div>
        </div>
      )}
    </div>
  );
}
