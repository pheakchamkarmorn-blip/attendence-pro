import React, { useState, useEffect, useRef } from "react";
import { MapPin, UserCheck, AlertTriangle, Play, HelpCircle, ArrowRightLeft, ShieldAlert } from "lucide-react";
import { Employee, SystemSettings, Attendance } from "../types";

interface CheckInProps {
  employees: Employee[];
  settings: SystemSettings;
  onCheckInSuccess: (data: { attendance: Attendance; telegramMsg: string }) => void;
}

export default function CheckIn({ employees, settings, onCheckInSuccess }: CheckInProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [isCheckOut, setIsCheckOut] = useState<boolean>(false);
  
  // Simulated Location State ( Phnom Penh Center default coordinates: near Independence Monument )
  const [currentLat, setCurrentLat] = useState<number>(11.5564);
  const [currentLng, setCurrentLng] = useState<number>(104.9282);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>("");
  
  // Geofence states
  const [distance, setDistance] = useState<number>(0);
  const [isInRange, setIsInRange] = useState<boolean>(true);
  
  // Alert logs response
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [telegramLogs, setTelegramLogs] = useState<any[]>([]);

  const mapInstanceRef = useRef<any>(null);
  const officeCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  // Haversine calculation client-side for dynamic feedback
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recalculate distance dynamically whenever currentLat/currentLng changes
  useEffect(() => {
    if (settings) {
      const dist = Math.round(getDistance(currentLat, currentLng, settings.officeLat, settings.officeLng));
      setDistance(dist);
      setIsInRange(dist <= settings.officeRadius);
    }
  }, [currentLat, currentLng, settings]);

  // Map initialization
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Destruct older instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current).setView([settings.officeLat, settings.officeLng], 17);
    mapInstanceRef.current = map;

    // Add CartoDB Voyager Tile layer (renders beautifully)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // 1. Office Location Pin (Red Icon)
    const officeIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      className: "hue-rotate-140" // Make it green/blue to distinguish
    });

    L.marker([settings.officeLat, settings.officeLng], { icon: officeIcon })
      .addTo(map)
      .bindPopup(`<b>ទីតាំងការិយាល័យ</b><br/>${settings.officeAddress}`)
      .openPopup();

    // 2. Allowed Range Circle (Radius 50m)
    const circle = L.circle([settings.officeLat, settings.officeLng], {
      color: "#22c55e",
      fillColor: "#3bf287",
      fillOpacity: 0.15,
      radius: settings.officeRadius,
      weight: 1.5,
    }).addTo(map);
    officeCircleRef.current = circle;

    // 3. User Mock/GPS Marker
    const userIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    const userMarker = L.marker([currentLat, currentLng], {
      icon: userIcon,
      draggable: true
    }).addTo(map);
    userMarkerRef.current = userMarker;

    userMarker.bindPopup(`<b>ទីតាំងបច្ចុប្បន្នរបស់អ្នក</b><br/>អូសដើម្បីផ្លាស់ទីទីតាំងសាកល្បង`).openPopup();

    // Event on dragging the user marker
    userMarker.on("dragend", (e: any) => {
      const marker = e.target;
      const position = marker.getLatLng();
      setCurrentLat(position.lat);
      setCurrentLng(position.lng);
    });

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [settings]);

  // Update user marker position when coordinates are simulated
  useEffect(() => {
    if (userMarkerRef.current && mapInstanceRef.current) {
      const latLng = [currentLat, currentLng];
      userMarkerRef.current.setLatLng(latLng);
      mapInstanceRef.current.panTo(latLng);
      userMarkerRef.current.getPopup().setContent(`<b>ទីតាំងរបស់អ្នក</b><br/>ចម្ងាយពីការិយាល័យ៖ ${distance} ម៉ែត្រ`).update();
    }
  }, [currentLat, currentLng, distance]);

  // HTML5 Geolocator Fetch with Khmer message handling
  const handleGPSDetect = () => {
    setLoadingLocation(true);
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("កម្មវិធីរុករក (Browser) របស់អ្នកមិនគាំទ្រប្រព័ន្ធ GPS ទេ។");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLat(position.coords.latitude);
        setCurrentLng(position.coords.longitude);
        setLoadingLocation(false);
      },
      (error) => {
        console.error(error);
        setGpsError("មិនអាចទាញយកទិន្នន័យ GPS ជាក់ស្តែងបានទេ (ប្រហែលការអនុញ្ញាតត្រូវបានបដិសេធ)។ សូមប្រើប្រាស់ឧបករណ៍ជំនួយការសាកល្បងកូអរដោនេខាងក្រោម។");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Pre-sets to easily simulate inside/outside zones
  const handleSimulateInside = () => {
    // Exactly 12 meters away from office
    setCurrentLat(settings.officeLat + 0.00008);
    setCurrentLng(settings.officeLng + 0.00008);
    setActionError("");
  };

  const handleSimulateOutside = () => {
    // Over 120 meters away
    setCurrentLat(settings.officeLat + 0.0012);
    setCurrentLng(settings.officeLng + 0.0012);
    setActionError("");
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    setActionSuccess("");

    if (!selectedEmpId) {
      setActionError("សូមជ្រើសរើសឈ្មោះបុគ្គលិកជាមុនសិន!");
      return;
    }

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          lat: currentLat,
          lng: currentLng,
          isCheckOut,
          forceLocationOverride: false // will trigger geofence check server-side
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        setActionError(resData.error || "ការចុះវត្តមានបរាជ័យ");
      } else {
        const empName = employees.find(e => e.id === selectedEmpId)?.name || "";
        setActionSuccess(`ចុះវត្តមាន ${isCheckOut ? "ចាកចេញ" : "ចូលធ្វើការ"} របស់ ${empName} បានជោគជ័យ!`);
        
        // Notify Parent component to update lists
        onCheckInSuccess({
          attendance: resData.attendance,
          telegramMsg: `Telegram Group: ${resData.telegramGroupStatus} | Private: ${resData.telegramPrivateStatus}`
        });
      }
    } catch (err: any) {
      setActionError("មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ (Server Connection failed)");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="checkin_interface">
      {/* Left Action Box */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between" id="action_panel">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/40">
              <UserCheck size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 tracking-tight">ស្កែនចុះវត្តមានទូរសព្ទ</h2>
              <p className="text-xs text-slate-400">Scan attendance via smartphone device simulation</p>
            </div>
          </div>

          <div className="border border-slate-200 p-3 bg-slate-50 rounded-xl text-xs space-y-1 mb-5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">ទីតាំងការិយាល័យ៖</span>
              <span className="font-bold text-slate-800 clamp-1">{settings.officeAddress.split("(")[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">កាំអនុញ្ញាត៖</span>
              <span className="font-extrabold text-blue-600 font-mono">{settings.officeRadius} ម៉ែត្រជុំវិញ</span>
            </div>
          </div>

          <form onSubmit={handleActionSubmit} className="space-y-4">
            {/* Employee selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">១. ជ្រើសរើសឈ្មោះបុគ្គលិក</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.position} - {emp.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in / Check-out status */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">២. ជ្រើសរើសសកម្មភាព</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckOut(false)}
                  className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    !isCheckOut
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${!isCheckOut ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                  កត់ត្រាម៉ោងចូល (In)
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckOut(true)}
                  className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isCheckOut
                      ? "border-amber-600 bg-amber-50 text-amber-700 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isCheckOut ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`}></span>
                  កត់ត្រាម៉ោងចេញ (Out)
                </button>
              </div>
            </div>

            {/* Distance Feedback visualizer */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
              isInRange 
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-950" 
                : "border-rose-200 bg-rose-50/70 text-rose-950"
            }`}>
              {isInRange ? (
                <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center animate-pulse shrink-0">
                  <MapPin size={18} />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <ShieldAlert size={18} alt="Ineligible distance warnings"/>
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[9.5px] uppercase font-bold tracking-wider opacity-60">ស្ថានភាពរយៈកម្ពស់ GPS</div>
                <div className="text-sm font-black font-mono">
                  ចម្ងាយ៖ {distance} ម៉ែត្រ
                </div>
                <div className="text-[11px] font-bold opacity-80 mt-0.5">
                  {isInRange 
                    ? "🟢 នៅក្នុងទីតាំងចុះវត្តមានបាន (In Range)" 
                    : `🔴 ក្រៅការិយាល័យ (បលា៖ >${settings.officeRadius}ម៉ែត្រ)`}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedEmpId}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !selectedEmpId 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : isCheckOut 
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10"
              }`}
            >
              <UserCheck size={18} />
              {isCheckOut ? "បញ្ជាក់ក្រាបម៉ោងចាកចេញ" : "បញ្ជាក់ក្រាបម៉ោងចូលធ្វើការ"}
            </button>
          </form>
        </div>

        {/* Feedback alerts */}
        <div className="mt-4">
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 rounded-lg text-xs font-medium text-rose-700 flex items-start gap-2 animate-fadeIn">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-250 border-l-4 border-l-emerald-500 rounded-lg text-xs font-semibold text-emerald-850 flex items-start gap-2 animate-fadeIn">
              <UserCheck size={16} className="shrink-0 mt-0.5" />
              <div>
                <div>{actionSuccess}</div>
                <div className="text-[10px] text-slate-500 font-normal mt-1">
                  🔔 Telegram notifications auto-fired to both group and personal.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Map Panel & Simulation Helper */}
      <div className="lg:col-span-8 flex flex-col gap-4" id="map_simulation_panel">
        {/* Map Container */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col h-[340px] md:h-[420px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <MapPin size={14} className="text-rose-500" />
              ការិយាល័យផែនទីការងារចុះវត្តមានទូរសព្ទ (Interactive Geofence Boundary)
            </span>
            <button
              onClick={handleGPSDetect}
              disabled={loadingLocation}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-650 text-slate-700 text-[11px] rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/50"
            >
              <Play size={12} className={loadingLocation ? "animate-spin" : ""} />
              {loadingLocation ? "កំពុងស្វែងរក..." : "ទាញយក GPS បច្ចុប្បន្ន"}
            </button>
          </div>
          
          <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-200">
            <div ref={mapContainerRef} className="h-full w-full" id="attendance_leaflet_map"></div>
          </div>
        </div>

        {/* Location Simulator Helper tools */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-3" id="mock_coordinator">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-blue-400 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ប្រអប់ឧបករណ៍ជំនួយតេស្តទីតាំង (Mock Coordinates Provider Panel)
            </h3>
          </div>

          <p className="text-[11.5px] leading-relaxed text-slate-300 font-normal">
            ឧបករណ៍នេះអនុញ្ញាតឱ្យអ្នកតេស្តការចុះវត្តមានដោយជោគជ័យ ឬធ្វើគម្រូជាក្រៅការិយាល័យ (&gt;៥០ម៉ែត្រ) ដើម្បីបញ្ជាក់ច្បាស់ពីសកម្មភាពប្រព័ន្ធ Geofencing របស់យើង។
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Quick adjusters */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulateInside}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-950/20 cursor-pointer"
              >
                <ArrowRightLeft size={13} />
                បន្ទប់ការិយាល័យ (12m)
              </button>
              <button
                type="button"
                onClick={handleSimulateOutside}
                className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-[11.5px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg shadow-rose-950/20 cursor-pointer"
              >
                <ArrowRightLeft size={13} />
                ក្រៅការិយាល័យ (120m)
              </button>
            </div>

            {/* Custom inputs */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center bg-slate-800 rounded-lg px-2 border border-slate-700">
                <span className="text-slate-500 font-mono pr-1.5 select-none font-bold">Lat</span>
                <input
                  type="number"
                  step="0.000001"
                  value={currentLat}
                  onChange={(e) => setCurrentLat(Number(e.target.value))}
                  className="bg-transparent text-white font-mono h-8 focus:outline-none w-full"
                />
              </div>
              <div className="flex items-center bg-slate-800 rounded-lg px-2 border border-slate-700">
                <span className="text-slate-500 font-mono pr-1.5 select-none font-bold">Lng</span>
                <input
                  type="number"
                  step="0.000001"
                  value={currentLng}
                  onChange={(e) => setCurrentLng(Number(e.target.value))}
                  className="bg-transparent text-white font-mono h-8 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>
          
          {gpsError && (
            <p className="text-[10px] text-amber-300 font-medium leading-normal bg-amber-950/30 p-2 rounded-lg border border-amber-900/30">
              ℹ️ {gpsError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
