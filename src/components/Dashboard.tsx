import React, { useState, useEffect } from "react";
import { Users, Clock, Award, Sparkles, RefreshCw, Send, DollarSign, Calendar, Sliders } from "lucide-react";
import { Employee, Attendance } from "../types";
import { motion } from "motion/react";

interface DashboardProps {
  employees: Employee[];
  attendance: Attendance[];
  onPageChange: (page: string) => void;
}

export default function Dashboard({ employees, attendance, onPageChange }: DashboardProps) {
  const [aiReport, setAiReport] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const khmerMonths = [
      "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
      "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
    ];
    const khmerDay = today.getDate();
    const khmerMonth = khmerMonths[today.getMonth()];
    const khmerYear = today.getFullYear() + 544; // Buddhist calendar year optionally or normal
    setCurrentDate(`ថ្ងៃពុធ ទី${khmerDay} ខែ${khmerMonth} ឆ្នាំ២០២៦`);
  }, []);

  // Compute metrics
  const totalEmployees = employees.length;
  const todayStr = "2026-06-10"; // Match system clock constraint date or dynamically use latest logs
  const todayLogs = attendance.filter((a) => a.date === todayStr);
  const todayPresent = todayLogs.filter(a => a.status === "on_time" || a.status === "late").length;
  const todayLate = todayLogs.filter((a) => a.status === "late").length;
  const todayAbsent = todayLogs.filter((a) => a.status === "absent").length;
  const todayLeave = todayLogs.filter((a) => a.status === "leave").length;

  const presentPercentage = totalEmployees > 0 ? Math.round((todayPresent / totalEmployees) * 100) : 0;
  
  // Calculate total monthly payroll cost base
  const totalBasePayroll = employees.reduce((acc, curr) => acc + curr.salary, 0);

  // Load Gemini Audit Report
  const generateAiAudit = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch("/api/reports/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok) {
        setAiReport(data.analysis);
      } else {
        setAiReport("បរាជ័យក្នុងការវិភាគ៖ " + (data.error || "Unknown server issue"));
      }
    } catch (err: any) {
      setAiReport("មិនអាចភ្ជាប់ទៅកាន់ API វិភាគបានឡើយ៖ " + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    generateAiAudit();
  }, []);

  // Attendance rate over past several days for chart
  const lastWorkingDays = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-08", "2026-06-09", "2026-06-10"];
  const dayStats = lastWorkingDays.map(day => {
    const dayLogs = attendance.filter(a => a.date === day);
    const present = dayLogs.filter(a => a.status === "on_time" || a.status === "late").length;
    const late = dayLogs.filter(a => a.status === "late").length;
    const absent = dayLogs.filter(a => a.status === "absent").length;
    return {
      dayStr: day.substring(8), // just DD
      present,
      late,
      absent
    };
  });

  return (
    <div className="space-y-6" id="dashboard_panel">
      {/* Date Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs" id="welcome_banner">
        <div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50/80 px-3.5 py-1.5 rounded-lg uppercase tracking-wider border border-blue-100">
            បច្ចុប្បន្នភាពទិន្នន័យជាក់ស្តែង
          </span>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-3 font-sans tracking-tight">
            របាយការណ៍វត្តមាន និងប្រាក់ខែបុគ្គលិកជារួម
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Realtime Attendance & Smart Payroll System Dashboard for Executive Review
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-xl text-slate-705 text-slate-700 shrink-0 font-bold">
          <Calendar size={15} className="text-blue-500" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* KPI Cards GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="kpi_grid">
        {/* Total staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/30">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">ចំនួនបុគ្គលិកសរុប</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">{totalEmployees} នាក់</div>
            <button 
              onClick={() => onPageChange("employees")}
              className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-0.5 mt-1 font-bold"
            >
              គ្រប់គ្រងបញ្ជី &rarr;
            </button>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/30">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">វត្តមានសម្រាប់ថ្ងៃនេះ</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
              {todayPresent} / {totalEmployees} <span className="text-xs font-normal text-slate-400">({presentPercentage}%)</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-semibold">
              <span className="text-emerald-600 font-bold">ទៀង៖ {todayPresent - todayLate}</span>
              <span className="text-amber-600 font-bold">យឺត៖ {todayLate}</span>
            </div>
          </div>
        </div>

        {/* Absences */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/30">
            <Clock size={22} className="rotate-180" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">អវត្តមាន / ច្បាប់</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">{todayAbsent} / {todayLeave} នាក់</div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 font-semibold">
              <span className="text-rose-600 font-bold">គ្មានច្បាប់៖ {todayAbsent}</span>
              <span className="text-blue-600 font-bold">សុំច្បាប់៖ {todayLeave}</span>
            </div>
          </div>
        </div>

        {/* Base payroll cost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/50">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">ខ្ទង់ប្រាក់ខែគោលសរុប</span>
            <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">${totalBasePayroll.toLocaleString()}</div>
            <button 
              onClick={() => onPageChange("payroll")}
              className="text-[10px] text-slate-600 hover:text-slate-800 hover:underline flex items-center gap-0.5 mt-1 font-bold"
            >
              ទូទាត់ប្រាក់ខែប្រចាំខែ &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main Row: Graphic chart & AI Audit Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard_graphic_analysis">
        {/* Left column: SVG Chart & Today state */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="attendance_chart_section">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800">និន្នាការវត្តមាន និងការមិនទៀងទាត់</h3>
                <p className="text-xs text-slate-400">Employee presence values across last 8 active days</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> វត្តមាន</span>
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> យឺត</span>
                <span className="flex items-center gap-0.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> អវត្តមាន</span>
              </div>
            </div>

            {/* Premium Visual SVG Chart Block */}
            <div className="h-64 flex items-end pt-5 relative border-b border-l border-slate-100 pb-2 pl-2">
              {/* Background gridlines */}
              <div className="absolute left-0 right-0 top-1/4 border-t border-slate-100/70 border-dashed"></div>
              <div className="absolute left-0 right-0 top-2/4 border-t border-slate-100/70 border-dashed"></div>
              <div className="absolute left-0 right-0 top-3/4 border-t border-slate-100/70 border-dashed"></div>

              {/* Dynamic Bar Charts columns */}
              <div className="w-full flex justify-around items-end h-full relative z-10">
                {dayStats.map((stat, idx) => {
                  const maxLimit = totalEmployees || 5;
                  const presHeight = Math.min((stat.present / maxLimit) * 100, 100);
                  const lateHeight = Math.min((stat.late / maxLimit) * 100, 100);
                  const absHeight = Math.min((stat.absent / maxLimit) * 100, 100);

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1.5 w-1/8 group">
                      <div className="h-44 flex items-end justify-center gap-1 w-full relative">
                        {/* Tooltip on Hover */}
                        <div className="absolute -top-12 scale-0 group-hover:scale-100 bg-slate-950 text-white text-[9.5px] px-2 py-1 rounded-md z-30 transition-all shadow-lg pointer-events-none font-mono">
                          <div>ទៀងជាតិ៖ {stat.present - stat.late}</div>
                          <div className="text-amber-400">យឺត៖ {stat.late}</div>
                          <div className="text-rose-400">អវត្តមាន៖ {stat.absent}</div>
                        </div>

                        {/* Bar Segment: Present (Green) */}
                        <div 
                          style={{ height: `${presHeight}%` }}
                          className="w-3 bg-emerald-500 rounded-t-sm transition-all duration-500 relative flex items-end justify-center"
                        >
                          {/* Inner segment: Late index */}
                          <div 
                            style={{ height: `${(stat.late / (stat.present || 1)) * 100}%` }}
                            className="w-full bg-amber-500 rounded-t-sm"
                          ></div>
                        </div>

                        {/* Bar Segment: Absent (Rose) */}
                        {stat.absent > 0 && (
                          <div 
                            style={{ height: `${absHeight}%` }}
                            className="w-3 bg-rose-400 rounded-t-sm transition-all duration-500"
                          ></div>
                        )}
                      </div>
                      
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {stat.dayStr} មិថុនា
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 bg-slate-50 border border-slate-200/75 rounded-xl flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-slate-800">តើអ្នកចង់សាកល្បងចុះវត្តមានដែរឬទេ?</span>
              <p className="text-slate-505 text-slate-500 text-[11px] mt-0.5">Mock and test mobile check-ins right inside your browser window.</p>
            </div>
            <button 
              onClick={() => onPageChange("checkin")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              ទស្សនាទំព័រស្កែនវត្តមាន
            </button>
          </div>
        </div>

        {/* Right column: Gemini AI Smart Action Audit report */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between" id="ai_reports_section">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-tr from-blue-600 to-teal-500 text-white rounded-xl">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">ការវិភាគវឌ្ឍនភាពវត្តមានដោយ AI</h3>
                  <p className="text-xs text-slate-400">Gemini 3.5 HR Smart Audit Engine</p>
                </div>
              </div>
              <button
                onClick={generateAiAudit}
                disabled={loadingAi}
                className="p-1.5 hover:bg-slate-50 border border-slate-200 text-slate-500 rounded-lg transition-all cursor-pointer"
                title="Refresh audit"
              >
                <RefreshCw size={14} className={loadingAi ? "animate-spin" : ""} />
              </button>
            </div>

            {loadingAi ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xs text-slate-400 font-semibold text-center mt-2">កំពុងទាញយកការវិភាគពី Gemini...</div>
              </div>
            ) : (
              <div className="text-xs text-slate-600 leading-relaxed font-normal overflow-y-auto max-h-[300px] pr-1 space-y-3 prose text-justify" id="gemini_html_output">
                {aiReport ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: aiReport.replace(/\n/g, '<br/>') }} 
                    className="space-y-2"
                  />
                ) : (
                  <div className="text-slate-400 text-center py-10">
                    មិនទាន់មានរបាយការណ៍នៅឡើយទេ។ សូមចុចប៊ូតុង Refresh ដើម្បីបង្កើតការវិភាគវត្តមានបុគ្គលិក។
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by Gemini-3.5-Flash</span>
            <span className="font-mono text-[10px] text-blue-600 font-bold">Status: Analysis Sync Successful</span>
          </div>
        </div>
      </div>
    </div>
  );
}
