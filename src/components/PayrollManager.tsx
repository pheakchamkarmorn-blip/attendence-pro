import React, { useState, useEffect } from "react";
import { DollarSign, Percent, Calculator, Sparkles, Send, CheckCircle2, ChevronDown, ListFilter, Printer, X, PencilLine, ClipboardCheck } from "lucide-react";
import { Employee, Payroll, SystemSettings } from "../types";

interface PayrollManagerProps {
  employees: Employee[];
  payrollList: Payroll[];
  settings: SystemSettings;
  onCalculatePayroll: (month: string) => Promise<void>;
  onUpdatePayrollSlip: (id: string, slipData: Partial<Payroll>) => Promise<void>;
}

export default function PayrollManager({
  employees,
  payrollList,
  settings,
  onCalculatePayroll,
  onUpdatePayrollSlip,
}: PayrollManagerProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-06");
  const [loadingCalc, setLoadingCalc] = useState<boolean>(false);
  
  // Edit Slip Inline States
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [allowanceInput, setAllowanceInput] = useState<number>(0);
  const [allowanceExplanation, setAllowanceExplanation] = useState<string>("");
  const [deductionInput, setDeductionInput] = useState<number>(0);
  const [deductionExplanation, setDeductionExplanation] = useState<string>("");

  // Payslip Slip Detail Card Modal
  const [viewingSlip, setViewingSlip] = useState<Payroll | null>(null);

  // Filter list by selected month
  const activeSlips = payrollList.filter((p) => p.month === selectedMonth);

  // Trigger calculation when mounting or change of month
  const handleCalculate = async () => {
    setLoadingCalc(true);
    try {
      await onCalculatePayroll(selectedMonth);
    } catch (err: any) {
      alert("បរាជ័យក្នុងការប្រមាណប្រាក់ខែ៖ " + err.message);
    } finally {
      setLoadingCalc(false);
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      // Calculate automatically for the month if no slips exist yet
      const slipsExist = payrollList.some(p => p.month === selectedMonth);
      if (!slipsExist) {
        handleCalculate();
      }
    }
  }, [selectedMonth, employees]);

  const handleEditInlineClick = (slip: Payroll) => {
    setEditingSlipId(slip.id);
    setAllowanceInput(slip.allowances);
    setAllowanceExplanation(slip.allowancesExplanation || "គ្មានការបញ្ជាក់");
    setDeductionInput(slip.deductions);
    setDeductionExplanation(slip.deductionsExplanation || "គ្មានការបញ្ជាក់");
  };

  const handleSaveInline = async (id: string) => {
    try {
      await onUpdatePayrollSlip(id, {
        allowances: Number(allowanceInput) || 0,
        allowancesExplanation: allowanceExplanation || "គ្មានការបញ្ជាក់",
        deductions: Number(deductionInput) || 0,
        deductionsExplanation: deductionExplanation || "គ្មានការបញ្ជាក់",
      });
      setEditingSlipId(null);
    } catch (err: any) {
      alert("មិនអាចរក្សាការសម្រេចបានឡើយ៖ " + err.message);
    }
  };

  const handleDisbursePayment = async (slip: Payroll, employeeName: string) => {
    if (confirm(`តើអ្នកពិតជាចង់ទូទាត់បើកប្រាក់ខែជូន "${employeeName}" សម្រាប់ខែ ${selectedMonth} នេះមែនទេ?\nប្រព័ន្ធនឹងផ្ញើវិក្កយបត្រជាសម្ភារៈទៅកាន់ Telegram របស់សាមីខ្លួន និង Telegram Group របស់ក្រុមហ៊ុនអូតូ។`)) {
      try {
        await onUpdatePayrollSlip(slip.id, {
          status: "paid",
        });
        alert(`ទូទាត់ប្រាក់ខែជូន ${employeeName} បានជោគជ័យ!`);
      } catch (err: any) {
        alert("កំហុសក្នុងការទូទាត់៖ " + err.message);
      }
    }
  };

  // Convert USD to Khmer Riel (4100 KHR / USD estimated equivalent rate)
  const toRiel = (usd: number) => {
    return Math.round(usd * 4100).toLocaleString() + " ៛";
  };

  return (
    <div className="space-y-6" id="payroll_management_panel">
      {/* Month Picker Selection and triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/40">
              <DollarSign size={22} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">ទូទាត់ និងកំណត់ប្រាក់ខែបុគ្គលិក</h1>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                គ្រប់គ្រងការដកប្រាក់ខែ (Deductions) ថែមរង្វាន់ (Allowances) និងទូទាត់តាម Telegram
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 text-right">ជ្រើសរើសខែទូទាត់</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200 focus:bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold text-slate-700 font-mono"
            >
              <option value="2026-05">ឧសភា ២០២៦ (2026-05)</option>
              <option value="2026-06">មិថុនា ២០២៦ (2026-06)</option>
              <option value="2026-07">កក្កដា ២០២៦ (2026-07)</option>
            </select>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loadingCalc}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs align-bottom self-end cursor-pointer"
          >
            <Calculator size={15} className={loadingCalc ? "animate-spin" : ""} />
            {loadingCalc ? "កំពុងគណនា..." : "គណនាឡើងវិញអូតូ"}
          </button>
        </div>
      </div>

      {/* Rules Overview Warning Info Alert box */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3 text-xs text-amber-950" id="deductions_rules_summary_alerts">
        <Sparkles size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-amber-900">💡 ព័ត៌មានពីការគណនាដក/ថែមប្រាក់ខែអូតូ (Attendance Deductions Rules)</span>
          <p className="text-slate-650 text-slate-700 leading-relaxed mt-1 max-w-4xl font-normal">
            បច្ចុប្បន្នភាពប្រព័ន្ធកំណត់ឱ្យ៖ <b>អវត្តមានគ្មានច្បាប់</b> កាត់ប្រាក់ខែ <span className="font-extrabold text-rose-600">${settings.deductionRateAbsent.toFixed(2)} / ថ្ងៃ</span> និង <b>ការចុះវត្តមានយឺត</b> កាត់ប្រាក់ខែ <span className="font-extrabold text-amber-700">${settings.deductionRateLateMin.toFixed(2)} / នាទី</span> {settings.autoCalculateDeductions ? " (សកម្មភាព៖ ដកប្រាក់ខែអូតូត្រូវបានបើកដំណើរការ)" : " (សកម្មភាព៖ ដកប្រាក់ខែអូតូត្រូវបានបិទ)"}។
          </p>
        </div>
      </div>

      {/* Paysheet Grid Listing */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="payouts_table_section">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-4 px-5">ឈ្មោះបុគ្គលិក</th>
                <th className="py-4 px-5">ប្រាក់ខែគោល</th>
                <th className="py-4 px-5">ប្រាក់បន្ថែម (+) (Allowances)</th>
                <th className="py-4 px-5">ប្រាក់ផាក/កាត់ (-) (Deductions)</th>
                <th className="py-4 px-5">ប្រាក់ខែទទួលពិត (Net)</th>
                <th className="py-4 px-5">ស្ថានភាពទូទាត់</th>
                <th className="py-4 px-5 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activeSlips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    មិនទាន់បានគណនាវត្តមានប្រាក់ខែសម្រាប់ខែ {selectedMonth} នេះនៅឡើយទេ។ សូមចុចប៊ូតុង "គណនាឡើងវិញអូតូ" ខាងលើ!
                  </td>
                </tr>
              ) : (
                activeSlips.map((slip) => {
                  const emp = employees.find((e) => e.id === slip.employeeId);
                  const isEditing = editingSlipId === slip.id;

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name Card */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 text-xs">{emp?.name || "បុគ្គលិកចាស់"}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">ID: {slip.employeeId} - Position: {emp?.position}</div>
                      </td>

                      {/* Base Pay */}
                      <td className="py-3.5 px-5 font-bold font-mono text-slate-800">
                        ${slip.baseSalary.toFixed(2)}
                      </td>

                      {/* Allowances additions columns with toggles */}
                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <div className="space-y-1.5 shrink-0 max-w-[150px]">
                            <div className="relative">
                              <span className="absolute left-2 top-1.5 text-slate-400 font-mono text-[10px]">$</span>
                              <input
                                type="number"
                                value={allowanceInput}
                                onChange={(e) => setAllowanceInput(Number(e.target.value))}
                                className="w-full h-7 pl-5 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <input
                              type="text"
                              value={allowanceExplanation}
                              onChange={(e) => setAllowanceExplanation(e.target.value)}
                              placeholder="មូលហេតុបន្ថែម..."
                              className="w-full h-7 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-emerald-600 font-mono">+${slip.allowances.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 italic max-w-[150px] truncate" title={slip.allowancesExplanation}>
                              {slip.allowancesExplanation || "គ្មានការបន្ថែម"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Deductions column */}
                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <div className="space-y-1.5 shrink-0 max-w-[150px]">
                            <div className="relative">
                              <span className="absolute left-2 top-1.5 text-slate-400 font-mono text-[10px]">$</span>
                              <input
                                type="number"
                                value={deductionInput}
                                onChange={(e) => setDeductionInput(Number(e.target.value))}
                                className="w-full h-7 pl-5 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <input
                              type="text"
                              value={deductionExplanation}
                              onChange={(e) => setDeductionExplanation(e.target.value)}
                              placeholder="មូលហេតុកាត់..."
                              className="w-full h-7 px-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-rose-500 font-mono">-${slip.deductions.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-400 italic max-w-[150px] truncate" title={slip.deductionsExplanation}>
                              {slip.deductionsExplanation || "គ្មានការផាកពិន័យ"}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Net Real Pay calculation */}
                      <td className="py-3.5 px-5">
                        <div className="font-black text-slate-900 font-mono block text-sm">
                          ${slip.netSalary.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          {toRiel(slip.netSalary)}
                        </div>
                      </td>

                      {/* Status label */}
                      <td className="py-3.5 px-5">
                        {slip.status === "paid" ? (
                          <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-850 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 w-max border border-emerald-100">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            ទូទាត់រួចហើយ (Paid)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1.5 bg-amber-50 text-amber-850 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 w-max border border-amber-100 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            នៅសល់ (Pending)
                          </span>
                        )}
                      </td>

                      {/* Actions Trigger List */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveInline(slip.id)}
                                className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                រក្សាទុក
                              </button>
                              <button
                                onClick={() => setEditingSlipId(null)}
                                className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                              >
                                មោឃៈ
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditInlineClick(slip)}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="កំណត់កាត់ប្រាក់ខែ ឬបន្ថែមប្រាក់រង្វាន់ដោយដៃ"
                              >
                                <PencilLine size={13} />
                                កំណត់ដោយដៃ
                              </button>

                              {slip.status === "pending" && (
                                <button
                                  onClick={() => handleDisbursePayment(slip, emp?.name || "")}
                                  className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <Send size={12} />
                                  ទូទាត់បើក
                                </button>
                              )}

                              <button
                                onClick={() => setViewingSlip(slip)}
                                className="p-1 px-2.5 hover:bg-blue-50 hover:text-blue-650 hover:text-blue-600 hover:border-blue-200 border border-slate-200 text-slate-500 rounded-lg text-xs transition-all font-bold cursor-pointer"
                              >
                                វិក្កយបត្រ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payslip View Visual Modal Card Pop-up */}
      {viewingSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn" id="payslip_modal_popup">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 relative">
            {/* Top Close */}
            <button
              onClick={() => setViewingSlip(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Receipt Content */}
            <div className="p-6 space-y-6" id="printable_payslip_card">
              {/* Slip header */}
              <div className="text-center space-y-1">
                <span className="text-[10px] bg-blue-50 text-blue-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest leading-none">
                  ក្រុមហ៊ុនវិស័យឯកជនកម្ពុជា
                </span>
                <h3 className="font-sans font-bold text-slate-900 text-base pt-2">វិក្កយបត្រទូទាត់ប្រាក់ខែបុគ្គលិក</h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold leading-none uppercase tracking-wider">
                  Official Salary Payslip Invoice (Month: {viewingSlip.month})
                </p>
              </div>

              {/* Logo / Decorator Divider Line */}
              <div className="border-t border-dashed border-slate-200 py-1"></div>

              {/* Employee/ID Detail card list */}
              {(() => {
                const emp = employees.find((e) => e.id === viewingSlip.employeeId);
                return (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">ឈ្មោះបុគ្គលិក (Employee Name)៖</span>
                      <span className="font-black text-slate-900 text-sm leading-none">{emp?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">អត្តសញ្ញាណ ID (Employee ID)៖</span>
                      <span className="font-mono text-slate-800 font-bold">{viewingSlip.employeeId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">តួនាទីភារកិច្ច (Staff Position)៖</span>
                      <span className="font-bold text-slate-750 text-slate-700">{emp?.position}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">ផ្នែកបំពេញការងារ (Department)៖</span>
                      <span className="font-bold text-slate-750 text-slate-700">{emp?.department}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">លេខតេឡេក្រាមជំនួយ (Telegram ID)៖</span>
                      <span className="font-mono font-extrabold text-blue-700">{emp?.telegramChatId || "មិនទាន់ភ្ជាប់"}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="border-t border-slate-100"></div>

              {/* Financial Calculation Ledger */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">បញ្ជីគណនាហិរញ្ញវត្ថុ</span>
                
                {/* 1. Base */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">💵 ប្រាក់ខែគោល (Monthly Base Salary)៖</span>
                  <span className="font-mono font-bold text-slate-800">${viewingSlip.baseSalary.toFixed(2)}</span>
                </div>

                {/* 2. Allowances */}
                <div className="flex justify-between items-start text-xs pt-0.5">
                  <div>
                    <span className="text-slate-500 font-medium">➕ ប្រាក់បន្ថែមរង្វាន់ (Allowances)៖</span>
                    <span className="text-[10px] text-slate-455 block max-w-[200px] leading-tight mt-0.5 italic text-slate-500">
                      ({viewingSlip.allowancesExplanation || "គ្មានការបន្ថែម"})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">+${viewingSlip.allowances.toFixed(2)}</span>
                </div>

                {/* 3. Deductions */}
                <div className="flex justify-between items-start text-xs pt-1">
                  <div>
                    <span className="text-slate-500 font-medium">➖ ប្រាក់ផាក/កាត់វត្តមាន (Deductions)៖</span>
                    <span className="text-[10px] text-rose-500 block max-w-[200px] leading-tight mt-0.5 italic">
                      ({viewingSlip.deductionsExplanation || "គ្មានការផាកពិន័យ"})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-rose-500">-${viewingSlip.deductions.toFixed(2)}</span>
                </div>
              </div>

              {/* Total final summary card highlights */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 relative overflow-hidden text-center z-13 border border-slate-800">
                <div className="absolute right-0 bottom-0 opacity-10 rotate-12 select-none text-right font-black text-6xl leading-none">
                  USD
                </div>

                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">ប្រាក់ខែបូកដកសរុបចុងក្រោយ (Net Payroll Pay)</span>
                
                <div className="text-2xl font-black font-mono text-blue-400">
                  ${viewingSlip.netSalary.toFixed(2)}
                </div>
                
                <div className="text-[11px] text-slate-300 font-bold font-sans">
                  = {toRiel(viewingSlip.netSalary)} (រៀលខ្មែរ)
                </div>

                <div className="pt-2 text-[10px] border-t border-slate-800 text-slate-400 flex justify-between font-medium">
                  <span>ស្ថានភាព៖ {viewingSlip.status === "paid" ? "🟢 បើកទូទាត់រួចរាល់" : "🟡 នៅសល់មិនទាន់បើក"}</span>
                  <span>ថ្ងៃបើក៖ {viewingSlip.paymentDate || "មិនកំណត់"}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 font-bold font-mono uppercase tracking-widest pt-2">
                ------ Thank you for your service ------
              </div>
            </div>

            {/* Card footer details buttons */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-3 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all text-slate-700 cursor-pointer"
              >
                <Printer size={13} />
                បោះពុម្ភ (Print)
              </button>
              <button
                onClick={() => {
                  const emp = employees.find((e) => e.id === viewingSlip.employeeId);
                  const shareText = `💵 វិក្កយបត្រប្រាក់ខែ - ${emp?.name} (ID: ${viewingSlip.employeeId})\nប្រចាំខែ៖ ${viewingSlip.month}\nប្រាក់ខែគោល៖ $${viewingSlip.baseSalary.toFixed(2)}\nប្រាក់បន្ថែម៖ $${viewingSlip.allowances.toFixed(2)} (${viewingSlip.allowancesExplanation})\nប្រាក់កាត់វត្តមាន៖ $${viewingSlip.deductions.toFixed(2)} (${viewingSlip.deductionsExplanation})\nប្រាក់ទទួលបានពិតប្រាកដ៖ $${viewingSlip.netSalary.toFixed(2)} (${toRiel(viewingSlip.netSalary)})\nស្ថានភាព៖ បាលរាល់ (paid)`;
                  navigator.clipboard.writeText(shareText);
                  alert("ប្រភពព័ត៌មានប្រាក់ខែត្រូវបានចម្លង (Copied to Clipboard) ជោគជ័យសម្រាប់ចែករំលែក!");
                }}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ClipboardCheck size={13} />
                ចម្លងព័ត៌មាន
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
