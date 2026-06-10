import React, { useState, useEffect } from "react";
import { LayoutDashboard, UserCheck, Users, DollarSign, Settings, Bell, Calendar, ChevronRight, Menu, X, Landmark } from "lucide-react";
import { Employee, Attendance, Payroll, SystemSettings } from "./types";

// Import Modular Subcomponents
import Dashboard from "./components/Dashboard";
import CheckIn from "./components/CheckIn";
import EmployeeManager from "./components/EmployeeManager";
import PayrollManager from "./components/PayrollManager";
import SettingsManager from "./components/SettingsManager";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Global State Engine
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [payrollList, setPayrollList] = useState<Payroll[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    officeLat: 11.5564,
    officeLng: 104.9282,
    officeRadius: 50,
    officeAddress: "វិមានឯករាជ្យ, Phnom Penh",
    telegramBotToken: "",
    telegramGroupId: "",
    workStartTime: "08:00",
    workEndTime: "17:00",
    deductionRateLateMin: 0.1,
    deductionRateAbsent: 15,
    autoCalculateDeductions: true,
  });

  // Load and refresh state APIs
  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed loading employees:", err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch("/api/attendance");
      if (response.ok) {
        const data = await response.json();
        setAttendanceLogs(data);
      }
    } catch (err) {
      console.error("Failed loading attendance:", err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const response = await fetch("/api/payroll");
      if (response.ok) {
        const data = await response.json();
        setPayrollList(data);
      }
    } catch (err) {
      console.error("Failed loading payroll:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed loading settings:", err);
    }
  };

  const handleUpdateSettings = async (newSettings: SystemSettings) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Refresh calculations
        fetchPayroll();
      }
    } catch (err) {
      console.error("Failed updating settings:", err);
      throw err;
    }
  };

  // Employee Add, edits, deletes, imports
  const handleAddEmployee = async (newEmp: Omit<Employee, "id">) => {
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmp),
    });
    if (response.ok) {
      fetchEmployees();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || "Failed adding employee");
    }
  };

  const handleBulkImport = async (list: Omit<Employee, "id">[]) => {
    const response = await fetch("/api/employees/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list),
    });
    if (response.ok) {
      fetchEmployees();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || "Bulk import failed");
    }
  };

  const handleUpdateEmployee = async (id: string, updated: Partial<Employee>) => {
    const response = await fetch(`/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (response.ok) {
      fetchEmployees();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || "Failed updating employee file");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const response = await fetch(`/api/employees/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      fetchEmployees();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || "Failed deleting employee record");
    }
  };

  // Payroll calculate & disbursements
  const handleCalculatePayroll = async (month: string) => {
    const response = await fetch("/api/payroll/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month }),
    });
    if (response.ok) {
      fetchPayroll();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || "Failed calculating payroll");
    }
  };

  const handleUpdatePayrollSlip = async (id: string, updatedFields: Partial<Payroll>) => {
    const response = await fetch(`/api/payroll/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    });
    if (response.ok) {
      fetchPayroll();
    } else {
      const errData = await response.json();
      throw new Error(errData.error || "Failed saving payroll updates");
    }
  };

  const handleClearAttendanceRecords = async () => {
    const response = await fetch("/api/attendance/clear-all", {
      method: "POST",
    });
    if (response.ok) {
      fetchAttendance();
      fetchPayroll();
    } else {
      throw new Error("Failed wiping attendance archives");
    }
  };

  // Auto initialize values on load
  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    fetchPayroll();
    fetchSettings();
  }, []);

  const menuItems = [
    { id: "dashboard", label: "ផ្ទាំងគ្រប់គ្រងដំបូង", sub: "Dashboard analytics", icon: LayoutDashboard },
    { id: "checkin", label: "ស្កែនចុះវត្តមាន GPS", sub: "Check-in simulation", icon: UserCheck },
    { id: "employees", label: "បុគ្គលិក & Excel", sub: "Manager & bulk import", icon: Users },
    { id: "payroll", label: "គណនាបើកប្រាក់ខែ", sub: "Payslip & manual inputs", icon: DollarSign },
    { id: "settings", label: "ការកំណត់ & ផែនទី", sub: "Settings & telegram bot", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row" id="app_frame">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-xs">A</div>
          <span className="font-sans font-bold text-sm tracking-wide">Attendance PRO</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 hover:bg-slate-800 rounded-lg transition-all"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Navigation Sidebar Drawer */}
      <aside className={`bg-slate-900 text-slate-300 w-64 flex flex-col justify-between shrink-0 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-out md:translate-x-0 md:relative h-screen ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Upper Sidebar Logo */}
        <div>
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-base">A</div>
              <div>
                <h1 className="text-white font-bold tracking-tight text-[15px] leading-none">Attendance PRO</h1>
                <span className="text-[10px] text-slate-500 font-bold block mt-1 tracking-wider uppercase">HR ASSISTANT PRO</span>
              </div>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="p-4 space-y-1.5" id="navigation_drawer">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-left flex items-center justify-between transition-all group border-l-4 ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 border-blue-500 font-bold shadow-xs"
                      : "border-transparent hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp size={16} className={isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"} />
                    <div>
                      <span className="text-xs leading-none block">{item.label}</span>
                      <span className={`text-[9px] block font-medium mt-0.5 ${isActive ? "text-blue-300/75" : "text-slate-500"}`}>
                        {item.sub}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={12} className={`transition-transform duration-200 ${isActive ? "translate-x-0.5 text-blue-400 opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar details */}
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-3 text-[10px] space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>SQLite DB</span>
              <span className="text-emerald-500 font-bold">● REST API</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Cloud Run Platform</span>
              <span className="text-blue-400 font-bold">● Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay backdrop for mobile drawers */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 z-35 md:hidden"
        ></div>
      )}

      {/* Main workspace view slot */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto" id="root_viewport">
        {/* Header toolbar */}
        <header className="bg-white h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden md:block">
            {menuItems.find((item) => item.id === activeTab)?.label}
          </div>
          <div className="flex items-center gap-4">
            {/* Quick action details info */}
            <div className="flex items-center gap-1.5 text-[11px] bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ប្រព័ន្ធសុវត្ថិភាព Geofencing សកម្ម
            </div>
          </div>
        </header>

        {/* Dynamic page container view */}
        <div className="p-6 max-w-7xl w-full mx-auto flex-1">
          {activeTab === "dashboard" && (
            <Dashboard
              employees={employees}
              attendance={attendanceLogs}
              onPageChange={(page) => setActiveTab(page)}
            />
          )}

          {activeTab === "checkin" && (
            <CheckIn
              employees={employees}
              settings={settings}
              onCheckInSuccess={() => {
                fetchAttendance();
                fetchPayroll();
              }}
            />
          )}

          {activeTab === "employees" && (
            <EmployeeManager
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onBulkImport={handleBulkImport}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {activeTab === "payroll" && (
            <PayrollManager
              employees={employees}
              payrollList={payrollList}
              settings={settings}
              onCalculatePayroll={handleCalculatePayroll}
              onUpdatePayrollSlip={handleUpdatePayrollSlip}
            />
          )}

          {activeTab === "settings" && (
            <SettingsManager
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onClearAttendance={handleClearAttendanceRecords}
            />
          )}
        </div>
      </main>
    </div>
  );
}
