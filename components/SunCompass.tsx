"use client";

import { useState, useEffect, useCallback } from "react";
import { Compass, Sun, Moon, Smartphone } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { getSunPosition, getCardinalDirection, SunPosition } from "@/lib/utils/calculations";
import { GlassCard } from "./ui/GlassCard";

interface SunCompassProps {
  lat: number;
  lon: number;
  timezone?: string;
}

export function SunCompass({ lat, lon, timezone }: SunCompassProps) {
  const { t } = useLanguage();
  const [sunPosition, setSunPosition] = useState<SunPosition | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [hasOrientationPermission, setHasOrientationPermission] = useState<boolean | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update sun position every minute
  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      setCurrentTime(now);
      const position = getSunPosition(lat, lon, now);
      setSunPosition(position);
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lat, lon]);

  // Handle device orientation for mobile compass rotation
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // Use webkitCompassHeading for iOS, or alpha for others
    let heading: number | null = null;
    
    if ("webkitCompassHeading" in event) {
      heading = (event as DeviceOrientationEvent & { webkitCompassHeading: number }).webkitCompassHeading;
    } else if (event.alpha !== null) {
      // For Android, alpha is the compass direction but needs to be inverted
      heading = (360 - event.alpha) % 360;
    }
    
    if (heading !== null) {
      setDeviceHeading(heading);
    }
  }, []);

  // Request device orientation permission (needed for iOS 13+)
  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== "undefined" && 
        "requestPermission" in DeviceOrientationEvent &&
        typeof (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        setHasOrientationPermission(permission === "granted");
        if (permission === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        }
      } catch {
        setHasOrientationPermission(false);
      }
    } else {
      // Non-iOS devices, try to add listener directly
      window.addEventListener("deviceorientation", handleOrientation);
      setHasOrientationPermission(true);
    }
  };

  useEffect(() => {
    // Check if device orientation is available
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      // For non-iOS, we can try to listen immediately
      if (typeof DeviceOrientationEvent !== "undefined" && 
          !("requestPermission" in DeviceOrientationEvent)) {
        window.addEventListener("deviceorientation", handleOrientation);
        setHasOrientationPermission(true);
      }
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [handleOrientation]);

  if (!sunPosition) return null;

  // Calculate sun position on the compass
  // Azimuth: 0 = North, 90 = East, 180 = South, 270 = West
  // Elevation: maps to distance from center (90° = center, 0° = edge)
  const compassRotation = deviceHeading !== null ? -deviceHeading : 0;
  
  // Map elevation to radius (higher elevation = closer to center)
  // At 90° elevation, sun is at center; at 0° it's at the edge
  const maxRadius = 42; // percentage from center
  const elevationNormalized = Math.max(0, Math.min(90, sunPosition.elevation)) / 90;
  const sunRadius = maxRadius * (1 - elevationNormalized * 0.7); // Keep some distance even at zenith
  
  // Convert azimuth to x,y coordinates
  // SVG: 0° is at top (North), goes clockwise
  const sunAngleRad = (sunPosition.azimuth - 90) * (Math.PI / 180);
  const sunX = 50 + sunRadius * Math.cos(sunAngleRad);
  const sunY = 50 + sunRadius * Math.sin(sunAngleRad);

  // Shadow direction (opposite to sun)
  const shadowAzimuth = (sunPosition.azimuth + 180) % 360;
  const shadowAngleRad = (shadowAzimuth - 90) * (Math.PI / 180);
  const shadowX = 50 + 35 * Math.cos(shadowAngleRad);
  const shadowY = 50 + 35 * Math.sin(shadowAngleRad);

  const cardinalDirection = getCardinalDirection(sunPosition.azimuth);
  const isNight = !sunPosition.isAboveHorizon;

  return (
    <GlassCard variant="primary" className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="icon-container icon-container-blue">
          <Compass className="w-5 h-5 text-blue-300" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-shadow-sm">
            {t.compass?.title || "Sun Compass"}
          </h3>
          <p className="text-white/60 text-xs">
            {t.compass?.sunDirection || "Sun direction"}: {cardinalDirection} ({Math.round(sunPosition.azimuth)}°)
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* SVG Compass */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{ transform: `rotate(${compassRotation}deg)`, transition: "transform 0.3s ease-out" }}
          >
            {/* Background circle with gradient */}
            <defs>
              <radialGradient id="compassBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isNight ? "#1e3a5f" : "#87ceeb"} stopOpacity="0.3" />
                <stop offset="100%" stopColor={isNight ? "#0f1a2e" : "#4a90c2"} stopOpacity="0.5" />
              </radialGradient>
              <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Main circle */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="url(#compassBg)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.5"
            />

            {/* Concentric rings for elevation reference */}
            {[15, 30, 45].map((r) => (
              <circle
                key={r}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.3"
                strokeDasharray="2,2"
              />
            ))}

            {/* Cardinal direction lines */}
            {[0, 90, 180, 270].map((angle) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const x2 = 50 + 48 * Math.cos(rad);
              const y2 = 50 + 48 * Math.sin(rad);
              return (
                <line
                  key={angle}
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* Intercardinal tick marks */}
            {[45, 135, 225, 315].map((angle) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const x1 = 50 + 42 * Math.cos(rad);
              const y1 = 50 + 42 * Math.sin(rad);
              const x2 = 50 + 48 * Math.cos(rad);
              const y2 = 50 + 48 * Math.sin(rad);
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.3"
                />
              );
            })}

            {/* Cardinal direction labels */}
            <text x="50" y="8" textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="bold" className="select-none">
              {t.compass?.north || "N"}
            </text>
            <text x="50" y="96" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="5" fontWeight="bold" className="select-none">
              {t.compass?.south || "S"}
            </text>
            <text x="94" y="52" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="5" fontWeight="bold" className="select-none">
              {t.compass?.east || "E"}
            </text>
            <text x="6" y="52" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="5" fontWeight="bold" className="select-none">
              {t.compass?.west || "W"}
            </text>

            {/* Shadow direction line (when sun is above horizon) */}
            {sunPosition.isAboveHorizon && (
              <line
                x1="50"
                y1="50"
                x2={shadowX}
                y2={shadowY}
                stroke="rgba(100,100,100,0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="3,2"
              />
            )}

            {/* Sun/Moon indicator */}
            {sunPosition.isAboveHorizon ? (
              <g filter="url(#sunGlow)">
                <circle
                  cx={sunX}
                  cy={sunY}
                  r="5"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="0.5"
                />
                {/* Sun rays */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = sunX + 6 * Math.cos(rad);
                  const y1 = sunY + 6 * Math.sin(rad);
                  const x2 = sunX + 8 * Math.cos(rad);
                  const y2 = sunY + 8 * Math.sin(rad);
                  return (
                    <line
                      key={angle}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#fbbf24"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            ) : (
              <g>
                <circle
                  cx={sunX}
                  cy={sunY}
                  r="4"
                  fill="#94a3b8"
                  stroke="#64748b"
                  strokeWidth="0.5"
                />
                {/* Moon crescent effect */}
                <circle
                  cx={sunX - 1.5}
                  cy={sunY - 1}
                  r="3"
                  fill={isNight ? "#1e3a5f" : "#4a90c2"}
                />
              </g>
            )}

            {/* Center dot */}
            <circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.5)" />
          </svg>

          {/* Device orientation indicator */}
          {deviceHeading !== null && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500/20 backdrop-blur-sm rounded-full px-2 py-0.5 border border-green-500/30">
              <span className="text-green-400 text-[10px] font-medium">
                {t.compass?.live || "LIVE"}
              </span>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex-1 space-y-3 text-sm">
          {/* Elevation */}
          <div className="glass-card-subtle p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-white/60">{t.compass?.elevation || "Elevation"}</span>
              <span className="text-white font-semibold">
                {sunPosition.elevation.toFixed(1)}°
              </span>
            </div>
            <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, (sunPosition.elevation / 90) * 100)}%` }}
              />
            </div>
          </div>

          {/* Azimuth */}
          <div className="glass-card-subtle p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-white/60">{t.compass?.azimuth || "Azimuth"}</span>
              <span className="text-white font-semibold">
                {Math.round(sunPosition.azimuth)}° {cardinalDirection}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="glass-card-subtle p-3 rounded-xl">
            <div className="flex items-center gap-2">
              {sunPosition.isAboveHorizon ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="text-white/80">{t.compass?.sunAboveHorizon || "Sun above horizon"}</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-400" />
                  <span className="text-white/80">{t.compass?.sunBelowHorizon || "Sun below horizon"}</span>
                </>
              )}
            </div>
          </div>

          {/* Device orientation button (for iOS) */}
          {hasOrientationPermission === null && typeof window !== "undefined" && "DeviceOrientationEvent" in window && (
            <button
              onClick={requestOrientationPermission}
              className="w-full flex items-center justify-center gap-2 glass-card-subtle p-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs">{t.compass?.enableCompass || "Enable live compass"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Shadow tip */}
      {sunPosition.isAboveHorizon && (
        <p className="text-white/40 text-xs mt-4 text-center">
          {t.compass?.shadowTip || "Dashed line shows shadow direction"}
        </p>
      )}
    </GlassCard>
  );
}
