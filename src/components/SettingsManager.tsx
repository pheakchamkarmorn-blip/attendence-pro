import React, { useState, useEffect, useRef } from "react";
import { Sliders, MapPin, MessageSquare, ShieldAlert, Send, Save, BookOpen, Clock, HelpCircle, HardDrive, Database, Link, Copy, Check, Terminal, ExternalLink, ShieldCheck } from "lucide-react";
import { SystemSettings } from "../types";

interface SettingsManagerProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => Promise<void>;
  onClearAttendance: () => Promise<void>;
}

export default function SettingsManager({ settings, onUpdateSettings, onClearAttendance }: SettingsManagerProps) {
  // Office Geofence Inputs state
  const [officeLat, setOfficeLat] = useState<number>(11.5564);
  const [officeLng, setOfficeLng] = useState<number>(104.9282);
  const [officeRadius, setOfficeRadius] = useState<number>(50);
  const [officeAddress, setOfficeAddress] = useState<string>("");

  // Work times & money cut rules
  const [workStartTime, setWorkStartTime] = useState<string>("08:00");
  const [workEndTime, setWorkEndTime] = useState<string>("17:00");
  const [deductionRateLateMin, setDeductionRateLateMin] = useState<number>(0.1);
  const [deductionRateAbsent, setDeductionRateAbsent] = useState<number>(15);
  const [autoCalculateDeductions, setAutoCalculateDeductions] = useState<boolean>(true);

  // Telegram credentials states
  const [telegramBotToken, setTelegramBotToken] = useState<string>("");
  const [telegramGroupId, setTelegramGroupId] = useState<string>("");

  // Telegram logs and testing states
  const [testMsg, setTestMsg] = useState<string>("🔔 បរិយាកាសការិយាល័យកំពុងត្រូវតេស្តការតភ្ជាប់ប្រព័ន្ធតេឡេក្រាម Telegram Bot Gateway ជោគជ័យ!");
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [telegramLogs, setTelegramLogs] = useState<any[]>([]);

  // Supabase Integration States
  const [supabaseConfig, setSupabaseConfig] = useState<{
    hasUrl: boolean;
    hasAnonKey: boolean;
    supabaseUrl: string;
    isConnected: boolean;
    sqlSchema: string;
    limitHandlingExplanations: string;
  } | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [supabaseTestMsg, setSupabaseTestMsg] = useState<{ success: boolean; message: string; subText?: string } | null>(null);
  const [showSchema, setShowSchema] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const settingsMapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const settingsMarkerRef = useRef<any>(null);
  const settingsCircleRef = useRef<any>(null);

  // Initial Sync from settings props
  useEffect(() => {
    if (settings) {
      setOfficeLat(settings.officeLat);
      setOfficeLng(settings.officeLng);
      setOfficeRadius(settings.officeRadius);
      setOfficeAddress(settings.officeAddress);
      setWorkStartTime(settings.workStartTime);
      setWorkEndTime(settings.workEndTime);
      setDeductionRateLateMin(settings.deductionRateLateMin);
      setDeductionRateAbsent(settings.deductionRateAbsent);
      setAutoCalculateDeductions(settings.autoCalculateDeductions);
      setTelegramBotToken(settings.telegramBotToken);
      setTelegramGroupId(settings.telegramGroupId);
    }
  }, [settings]);

  // Read Telegram alerts logs
  const fetchTelegramLogs = async () => {
    try {
      const response = await fetch("/api/telegram-logs");
      if (response.ok) {
        const data = await response.json();
        setTelegramLogs(data);
      }
    } catch (err) {
      console.error("Failed loading telegram logs:", err);
    }
  };

  useEffect(() => {
    fetchTelegramLogs();
    const timer = setInterval(fetchTelegramLogs, 8000);
    return () => clearInterval(timer);
  }, []);

  // Load Supabase Configurations from Server status API
  const fetchSupabaseConfig = async () => {
    try {
      const response = await fetch("/api/supabase/config");
      if (response.ok) {
        const data = await response.json();
        setSupabaseConfig(data);
      }
    } catch (err) {
      console.error("Failed loading Supabase configuration:", err);
    }
  };

  useEffect(() => {
    fetchSupabaseConfig();
  }, []);

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestMsg(null);
    try {
      const response = await fetch("/api/supabase/test");
      const data = await response.json();
      setSupabaseTestMsg({
        success: data.success,
        message: data.message,
        subText: data.employeeCountFetched !== undefined 
          ? `គណនីទាញយក៖ ${data.rowsRetrieveLimitMethodUsed} (ស្កេនទាញបានពី Supabase៖ ${data.employeeCountFetched} ជួរ)`
          : undefined
      });
      fetchSupabaseConfig();
    } catch (err: any) {
      setSupabaseTestMsg({ success: false, message: "ការតភ្ជាប់មានកំហុស៖ " + err.message });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSyncSupabase = async () => {
    if (!confirm("⚠️ តើអ្នកចង់បញ្ជូនទិន្នន័យពី local JSON Database ឡើងទៅកាន់ Supabase ដែរឬទេ? ទិន្នន័យចាស់ដែលមាន ID ដូចគ្នានឹងត្រូវធ្វើសមកាលកម្ម Upsert ជាន់គ្នា។")) {
      return;
    }
    setIsSyncingSupabase(true);
    setSupabaseTestMsg(null);
    try {
      const response = await fetch("/api/supabase/sync", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setSupabaseTestMsg({
          success: true,
          message: data.message,
          subText: `បុគ្គលិកសមកាលជោគជ័យ៖ ${data.report.employees.synced}/${data.report.employees.total} ជួរ | វត្តមាន៖ ${data.report.attendance.synced}/${data.report.attendance.total} ជួរ | ប្រាក់ខែ៖ ${data.report.payroll.synced}/${data.report.payroll.total} ជួរ`
        });
      } else {
        setSupabaseTestMsg({ success: false, message: "កំហុស៖ " + (data.error || "ការសមកាលបរាជ័យ") });
      }
      fetchSupabaseConfig();
    } catch (err: any) {
      setSupabaseTestMsg({ success: false, message: "ការសមកាលមានកំហុស៖ " + err.message });
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const copySqlToClipboard = () => {
    if (!supabaseConfig?.sqlSchema) return;
    navigator.clipboard.writeText(supabaseConfig.sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Map Initialization for settings coordinates picking
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (settingsMapRef.current) {
      settingsMapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current).setView([officeLat, officeLng], 17);
    settingsMapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap & CARTO',
      maxZoom: 20
    }).addTo(map);

    const markerIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    const marker = L.marker([officeLat, officeLng], {
      icon: markerIcon,
      draggable: true
    }).addTo(map);
    settingsMarkerRef.current = marker;

    marker.bindPopup("<b>ទីតាំងការិយាល័យ</b><br/>អូសដើម្បីផ្លាស់ប្តូរកូអរដោនេទីតាំងស្កេន").openPopup();

    const circle = L.circle([officeLat, officeLng], {
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      radius: officeRadius,
      weight: 1.5,
    }).addTo(map);
    settingsCircleRef.current = circle;

    // React on Drag end
    marker.on("dragend", (e: any) => {
      const pos = e.target.getLatLng();
      setOfficeLat(pos.lat);
      setOfficeLng(pos.lng);
    });

    // React on Map click to move PIN
    map.on("click", (e: any) => {
      const pos = e.latlng;
      marker.setLatLng(pos);
      setOfficeLat(pos.lat);
      setOfficeLng(pos.lng);
    });

    return () => {
      if (settingsMapRef.current) {
        settingsMapRef.current.remove();
        settingsMapRef.current = null;
      }
    };
  }, [settings]);

  // Dynamically update map elements when inputs are typed in manually
  useEffect(() => {
    if (settingsMarkerRef.current && settingsCircleRef.current && settingsMapRef.current) {
      const latLng = [officeLat, officeLng];
      settingsMarkerRef.current.setLatLng(latLng);
      settingsCircleRef.current.setLatLng(latLng);
      settingsCircleRef.current.setRadius(officeRadius);
      settingsMapRef.current.panTo(latLng);
    }
  }, [officeLat, officeLng, officeRadius]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: SystemSettings = {
      officeLat,
      officeLng,
      officeRadius: Number(officeRadius) || 50,
      officeAddress: officeAddress || "ទីតាំងការិយាល័យ",
      workStartTime,
      workEndTime,
      deductionRateLateMin: Number(deductionRateLateMin) || 0,
      deductionRateAbsent: Number(deductionRateAbsent) || 0,
      autoCalculateDeductions,
      telegramBotToken,
      telegramGroupId,
    };

    try {
      await onUpdateSettings(payload);
      alert("រក្សាទុកការកំណត់ប្រព័ន្ធរួមបានជោគជ័យ!");
    } catch (err: any) {
      alert("បរាជ័យក្នុងការរក្សា៖ " + err.message);
    }
  };

  const handleTelegramTest = async () => {
    if (!testMsg.trim()) return;
    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMsg })
      });

      const res = await response.json();
      if (response.ok) {
        setTestResult(res);
        fetchTelegramLogs();
      } else {
        setTestResult({ success: false, message: res.error || "Failed sending Telegram message." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "Server connection failed: " + err.message });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClearRecords = async () => {
    if (confirm("⚠️ ប្រុងប្រយ័ត្ន៖ តើអ្នកចង់លុបទិន្នន័យវត្តមានបុគ្គលិកទាំងអស់ដែលមានក្នុងប្រព័ន្ធមែនទេ? សកម្មភាពនេះមិនអាចជួសជុលវិញបានទេ។")) {
      try {
        await onClearAttendance();
        alert("សម្អាតវត្តមានទាំងអស់រួចរាល់!");
        fetchTelegramLogs();
      } catch (err: any) {
        alert("កំហុស៖ " + err.message);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="settings_subsystem">
      {/* Left Form: Configurations */}
      <form onSubmit={handleSaveSettings} className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6" id="settings_form">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/40">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm leading-none">ការកំណត់ប្រព័ន្ធរួម (System Configurations)</h2>
            <p className="text-[11px] text-slate-500 mt-1 font-normal">Configure Geofence office boundaries and automated telegram bot variables</p>
          </div>
        </div>

        {/* Section 1: Geofence details */}
        <div className="space-y-4">
          <span className="text-xs font-black text-blue-600 uppercase tracking-wider block">១. ទីតាំងការិយាល័យ & Geofencing</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">រយៈបណ្តោយ Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={officeLat}
                onChange={(e) => setOfficeLat(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">រយៈទទឹង Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={officeLng}
                onChange={(e) => setOfficeLng(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">កាំស្កេនអនុញ្ញាត (រង្វង់ម៉ែត្រ)</label>
              <input
                type="number"
                value={officeRadius}
                onChange={(e) => setOfficeRadius(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">ឈ្មោះអាសយដ្ឋានការិយាល័យ (Office Name)</label>
            <input
              type="text"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              placeholder="ឧ. វិមានឯករាជ្យ មហាវិថីព្រះសីហនុ..."
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Section 2: Work Rules / Calculations */}
        <div className="space-y-4">
          <span className="text-xs font-black text-blue-600 uppercase tracking-wider block">២. ពេលវេលាការងារ & ច្បាប់ផាកពិន័យ</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">ម៉ោងចូលការងារ (Work Start Time)</label>
              <input
                type="text"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                placeholder="08:00"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">ម៉ោងចេញការងារ (Work End Time)</label>
              <input
                type="text"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                placeholder="17:00"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">ផាកពិន័យយឺត (USD ក្នុងមួយនាទី) *</label>
              <input
                type="number"
                step="0.01"
                value={deductionRateLateMin}
                onChange={(e) => setDeductionRateLateMin(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">ផាកពិន័យអវត្តមាន (USD ក្នុងមួយថ្ងៃ) *</label>
              <input
                type="number"
                value={deductionRateAbsent}
                onChange={(e) => setDeductionRateAbsent(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1.5">
            <input
              type="checkbox"
              id="autoCalcCheck"
              checked={autoCalculateDeductions}
              onChange={(e) => setAutoCalculateDeductions(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500/40 cursor-pointer"
            />
            <label htmlFor="autoCalcCheck" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              គណនាប្រាក់ដកកាត់វត្តមានយឺត/អវត្តមានរៀបចំអូតូ (Auto Deduct Active)
            </label>
          </div>
        </div>

        {/* Section 3: Telegram API Integrations */}
        <div className="space-y-4">
          <span className="text-xs font-black text-blue-600 uppercase tracking-wider block">៣. តំណភ្ជាប់ប្រព័ន្ធ Telegram Automation Bot</span>
          
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Telegram Bot Token (From @BotFather)</label>
            <input
              type="password"
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              placeholder="754129853:AAGY_8pT..."
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">Telegram Group Chat ID (For Dynamic Team Reports Logs)</label>
            <input
              type="text"
              value={telegramGroupId}
              onChange={(e) => setTelegramGroupId(e.target.value)}
              placeholder="-1003445566..."
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl focus:bg-slate-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-5 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClearRecords}
            className="py-2.5 px-3.5 border border-rose-200 bg-rose-50 hover:bg-rose-100/80 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            សម្អាតទិន្នន័យវត្តមានរួម
          </button>

          <button
            type="submit"
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Save size={15} />
            រក្សាការកំណត់ទាំងអស់
          </button>
        </div>
      </form>

      {/* Right Column: Interaction Maps & Telegram Bot Logs Feeds */}
      <div className="lg:col-span-5 space-y-6" id="settings_interactive_helps">
        {/* Geographic location picking picker container */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[280px]">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2 select-none">
            <MapPin size={14} className="text-blue-600" />
            ផែនទីកំណត់ទីតាំងការិយាល័យ (Click/drag pin to office)
          </span>
          <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-100 z-10">
            <div ref={mapContainerRef} className="h-full w-full"></div>
          </div>
        </div>

        {/* Supabase Connection Setup Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4" id="supabase_integration_panel">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Database size={16} />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">សមកាលកម្ម Supabase Database</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Connect and sync with Supabase PostgreSQL</p>
              </div>
            </div>
            {supabaseConfig?.isConnected ? (
              <span className="inline-flex items-center gap-1 py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ភ្ជាប់រួចរាល់
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 py-0.5 px-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                មិនទាន់ភ្ជាប់
              </span>
            )}
          </div>

          {/* Connection Stats / Help */}
          <div className="space-y-2.5 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">ស្ថានភាព API Client៖</span>
                <span className={`font-bold ${supabaseConfig?.isConnected ? "text-emerald-600" : "text-amber-600"}`}>
                  {supabaseConfig?.isConnected ? "Active (ដំណើរការ)" : "Unconfigured (មិនទាន់រៀបចំ)"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10.5px]">
                <span className="font-bold text-slate-500">កូអរដោនេ URL៖</span>
                <span className="font-mono text-slate-700 font-bold max-w-44 truncate">
                  {supabaseConfig?.hasUrl ? supabaseConfig.supabaseUrl : "Unset (.env.example)"}
                </span>
              </div>
            </div>

            {/* Instruction about adding to Vercel and Free plan row bypass conditions */}
            <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/60 text-[11px] leading-relaxed text-indigo-900 space-y-2">
              <div className="flex gap-1.5 items-start">
                <ShieldCheck size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="font-medium text-slate-700">
                  <strong className="text-indigo-950 block mb-0.5">💡 ការណែនាំរៀបចំទៅកាន់ Vercel៖</strong>
                  ដើម្បីដំណើរការកម្មវិធី និងទិន្នន័យលើ Vercel សូមចម្លងយកតម្លៃ <code className="bg-white px-1 py-0.5 border border-slate-200/60 rounded text-[10px] font-mono text-rose-600">SUPABASE_URL</code> និង <code className="bg-white px-1 py-0.5 border border-slate-200/60 rounded text-[10px] font-mono text-rose-600">SUPABASE_ANON_KEY</code> ទៅដាក់ក្នុង <strong className="text-indigo-950">Vercel Environment Variables</strong> របស់ Project របស់អ្នក។
                </p>
              </div>

              <div className="flex gap-1.5 items-start border-t border-indigo-100/50 pt-2 mt-1">
                <Sliders size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="font-medium text-slate-700 text-[10.5px]">
                  <strong className="text-indigo-950 block mb-0.5">✨ ដោះស្រាយបញ្ហា Free Plan ទាញទិន្នន័យ &gt; ១០០០ ជួរ៖</strong>
                  គម្រោង Free standard API របស់ Supabase កំណត់ការទាញយកទិន្នន័យត្រឹម ១០០០ ជួរក្នុងមួយដង។ វិស្វករយើងបានបង្កើកលក្ខខណ្ឌ <strong className="text-indigo-950">Pagination Range Looping API</strong> លើ backend រួចរាល់ ដើម្បីអាចស្កេនទាញទិន្នន័យបានខ្ពស់គ្មានដែនកំណត់ បម្រើដល់ទិន្នន័យបុគ្គលិកដ៏ច្រើន!
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
            <button
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="py-2 px-3 border border-slate-200 hover:border-blue-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Terminal size={13} className={isTestingSupabase ? "animate-spin" : ""} />
              {isTestingSupabase ? "កំពុងតេស្ត..." : "តេស្តការតភ្ជាប់"}
            </button>

            <button
              onClick={handleSyncSupabase}
              disabled={isSyncingSupabase}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Database size={13} className={isSyncingSupabase ? "animate-spin" : ""} />
              {isSyncingSupabase ? "កំពុងបញ្ជូន..." : "បញ្ជូនទិន្នន័យ (Sync)"}
            </button>
          </div>

          {supabaseTestMsg && (
            <div className={`p-3 rounded-xl border text-[11px] font-sans leading-relaxed space-y-1 ${
              supabaseTestMsg.success 
                ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                : "bg-rose-50 text-rose-800 border-rose-100"
            }`}>
              <p className="font-bold flex items-center gap-1">
                <span>{supabaseTestMsg.success ? "✅ ជោគជ័យ៖" : "❌ បរាជ័យ៖"}</span>
                <span>{supabaseTestMsg.message}</span>
              </p>
              {supabaseTestMsg.subText && (
                <p className="text-[10px] text-slate-500 font-mono leading-tight bg-slate-100/80 p-2 rounded-lg mt-1 select-all">
                  {supabaseTestMsg.subText}
                </p>
              )}
            </div>
          )}

          {/* Schema generator component */}
          <div className="border-t border-slate-100 pt-3">
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="w-full flex items-center justify-between text-slate-500 hover:text-indigo-600 text-[11px] font-black transition-all cursor-pointer select-none"
            >
              <span className="flex items-center gap-1.5">
                <Terminal size={12} className="text-indigo-600" />
                កូដ SQL សម្រាប់បង្កើតតារាង Supabase (Copy schema)
              </span>
              <span className="text-xs">{showSchema ? "▲ លាក់" : "▼ បង្ហាញ"}</span>
            </button>

            {showSchema && supabaseConfig?.sqlSchema && (
              <div className="mt-2.5 space-y-2">
                <p className="text-[10px] text-slate-400 select-none leading-normal">
                  សូមចម្លងកូដ SQL ខាងក្រោម ហើយយកទៅដំណើរការជម្រើស SQL editor លើ Supabase Dashboard គណនីរបស់អ្នក ដើម្បីរៀបចំរចនាសម្ព័ន្ធតារាង៖
                </p>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[9.5px] font-mono leading-relaxed h-48 select-all">
                    {supabaseConfig.sqlSchema}
                  </pre>
                  <button
                    onClick={copySqlToClipboard}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition-all cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Telegram Link Instructions Tutorial Book */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xs space-y-4" id="instructions_manual">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-blue-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-400">របៀបបង្កើត និងភ្ជាប់ Telegram Bot ខ្មែរ</h3>
          </div>

          <ol className="text-[11px] leading-relaxed text-slate-300 list-decimal pl-4 space-y-1.5 font-sans font-medium">
            <li>
              ស្វែងរក Bot ឈ្មោះ <span className="font-mono text-blue-400 font-bold">@BotFather</span> ក្នុង Telegram រួចវាយពាក្យ <span className="font-mono bg-slate-800 text-white px-1 py-0.5 rounded">/newbot</span> ដើម្បីបង្កើត Bot។
            </li>
            <li>
              កូពីយកកូដ <span className="text-blue-400 font-bold">HTTP API Token</span> មកដាក់ក្នុងប្រអប់ "Telegram Bot Token" ខាងលើ។
            </li>
            <li>
              បង្កើត <span className="font-bold text-blue-300">Telegram Group ឬ Channel</span> រួចទាញយកប្រព័ន្ធ Bot របស់យើងជា Admin ក្នុងក្រុមនោះ។
            </li>
            <li>
              ស្វែងរក Chat ID របស់ក្រុមដោយប្រើ <span className="font-mono text-blue-400 font-bold">@userinfobot</span> រួចវាយ Telegram Chat ID ក្បាលជាមួយសញ្ញាដក។
            </li>
          </ol>

          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">
              <span>សាកល្បងផ្ញើសារសាកល្បង Telegram Test (Gateway Connector)</span>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl text-xs p-2.5 focus:outline-none flex-1 text-slate-300 h-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
              <button
                onClick={handleTelegramTest}
                disabled={testingConnection}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer shrink-0"
                title="Send active test alert"
              >
                <Send size={14} className={testingConnection ? "animate-spin" : ""} />
              </button>
            </div>

            {testResult && (
              <p className={`text-[10.5px] font-bold leading-tight p-2.5 rounded-xl border ${
                testResult.success 
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/40" 
                  : "bg-rose-950/40 text-rose-300 border-rose-900/40"
              }`}>
                {testResult.success ? "✅ ជោគជ័យ៖ " : "❌ បរាជ័យ៖ "} {testResult.message}
              </p>
            )}
          </div>
        </div>

        {/* Telegram dynamic system logs container */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3" id="active_alerts_logger">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 select-none">
            <MessageSquare size={14} className="text-blue-600" />
            ប្រអប់ត្រួតពិនិត្យសាររបស់ Bot (Live Telegram Sent Feed)
          </span>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1" id="scrolling_telegram_feed">
            {telegramLogs.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-8 font-medium">
                មិនទាន់មានសកម្មភាពផ្ញើសារទៅកាន់ Telegram bot ឡើយ។ សាកល្បងចុះវត្តមានដើម្បីឃើញដំណើរការ logs!
              </p>
            ) : (
              telegramLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-1 text-[11px]">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800 text-xs">{log.recipient} ({log.chatId})</span>
                    <span className={log.success ? "text-emerald-600" : "text-rose-500"}>
                      {log.success ? "🟢 Sent" : "🔴 Error"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                    {log.message.replace(/<[^>]*>/g, '')}
                  </p>
                  <div className="text-[9px] text-slate-400 flex justify-between items-center">
                    <span>{new Date(log.timestamp).toTimeString().split(" ")[0]}</span>
                    <span className="italic truncate block max-w-44">{log.statusMessage}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
