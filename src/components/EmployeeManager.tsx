import React, { useState } from "react";
import { Users, UserPlus, Save, Trash2, Edit2, Download, Table, AlertCircle, FileText, Check } from "lucide-react";
import { Employee } from "../types";

interface EmployeeManagerProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, "id">) => Promise<void>;
  onBulkImport: (list: Omit<Employee, "id">[]) => Promise<void>;
  onUpdateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

export default function EmployeeManager({
  employees,
  onAddEmployee,
  onBulkImport,
  onUpdateEmployee,
  onDeleteEmployee,
}: EmployeeManagerProps) {
  // Modal / Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  // Single Employee Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [salary, setSalary] = useState("500");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");

  // Bulk Excel Importer States
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [parsedDrafts, setParsedDrafts] = useState<any[]>([]);

  const resetForm = () => {
    setName("");
    setPhone("");
    setTelegramChatId("");
    setSalary("500");
    setPosition("");
    setDepartment("");
    setEditingEmpId(null);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setName(emp.name);
    setPhone(emp.phone);
    setTelegramChatId(emp.telegramChatId || "");
    setSalary(String(emp.salary));
    setPosition(emp.position);
    setDepartment(emp.department);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("សូមបំពេញឈ្មោះ និងលេខទូរសព្ទបុគ្គលិក!");
      return;
    }

    const payload = {
      name,
      phone,
      telegramChatId,
      salary: Number(salary) || 500,
      position: position || "បុគ្គលិក",
      department: department || "ទូទៅ",
      joinedDate: new Date().toISOString().split("T")[0],
    };

    try {
      if (editingEmpId) {
        await onUpdateEmployee(editingEmpId, payload);
      } else {
        await onAddEmployee(payload);
      }
      resetForm();
      setShowAddForm(false);
    } catch (err: any) {
      alert("ប្រតិបត្តិការបរាជ័យ៖ " + err.message);
    }
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (confirm(`តើអ្នកពិតជាចង់លុបឈ្មោះបុគ្គលិក "${name}" នេះចេញពីប្រព័ន្ធមែនទេ?`)) {
      try {
        await onDeleteEmployee(id);
      } catch (err: any) {
        alert("មិនអាចលុបបានឡើយ៖ " + err.message);
      }
    }
  };

  // Live parsing of values when user pastes tab-separated contents from Excel sheets
  const handleExcelPasteChange = (text: string) => {
    setExcelPasteText(text);
    setBulkError("");
    setParsedDrafts([]);

    if (!text.trim()) return;

    try {
      const rows = text.trim().split("\n");
      const drafts: any[] = [];

      rows.forEach((row, idx) => {
        // Skip header common row if users copy-paste table headers
        if (idx === 0 && (row.includes("ឈ្មោះ") || row.includes("Name") || row.includes("Position"))) {
          return;
        }

        const cols = row.split("\t"); // excel copies as tabs
        if (cols.length === 0 || !cols[0].trim()) return;

        // Map column indices safely
        // Col 0: Name (required), Col 1: Position, Col 2: Department, Col 3: baseSalary, Col 4: Phone, Col 5: TelegramChatId
        const nameVal = cols[0]?.trim();
        const positionVal = cols[1]?.trim() || "បុគ្គលិក";
        const departmentVal = cols[2]?.trim() || "មិនទាន់កំណត់";
        const salaryVal = Number(cols[3]?.trim()) || 500;
        const phoneVal = cols[4]?.trim() || "N/A";
        const tgVal = cols[5]?.trim() || "";

        if (nameVal) {
          drafts.push({
            name: nameVal,
            position: positionVal,
            department: departmentVal,
            salary: salaryVal,
            phone: phoneVal,
            telegramChatId: tgVal,
          });
        }
      });

      if (drafts.length === 0) {
        setBulkError("មិនអាចផ្តល់ទិន្នន័យបានទេ! សូមប្រាកដថាអ្នកបានកូពីទិន្នន័យចេញពី Excel តាមទម្រង់ក្រឡាត្រឹមត្រូវ។");
      } else {
        setParsedDrafts(drafts);
      }
    } catch (err) {
      setBulkError("មានកំហុសក្នុងការអានទិន្នន័យពី Excel។");
    }
  };

  const handleCommitBulkImport = async () => {
    if (parsedDrafts.length === 0) return;
    try {
      await onBulkImport(parsedDrafts);
      setExcelPasteText("");
      setParsedDrafts([]);
      setShowExcelImport(false);
      alert(`នាំចូលបុគ្គលិកចំនួន ${parsedDrafts.length}នាក់ ជោគជ័យ!`);
    } catch (err: any) {
      alert("កំហុសក្នុងការបញ្ចូល៖ " + err.message);
    }
  };

  const downloadExcelTemplate = () => {
    // Generate simple tab-separated text/csv file and download it
    const header = "ឈ្មោះ (Name)\tតួនាទី (Position)\tផ្នែក (Department)\tប្រាក់ខែ (BaseSalary in USD)\tលេខទូរសព្ទ (Phone)\tលេខតេឡេក្រាម (TelegramChatId)\n";
    const body = "សែម សុភ័ក្ត្រ\tAccountant\tធនធានមនុស្ស\t680\t012776655\t98765432\nសំណាង វិរៈ\tJS Developer\tព័ត៌មានវិទ្យា (IT)\t950\t098112233\t12345678\n";
    const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "excel-staff-template.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="employee_management_panel">
      {/* Upper header action list */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100/40">
              <Users size={22} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">ស្វែងរក និងគ្រប់គ្រងព័ត៌មានបុគ្គលិក</h1>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                សរុបមានបុគ្គលិកចំនួន <span className="font-extrabold text-blue-600 font-mono">{employees.length} នាក់</span> ក្នុងប្រព័ន្ធ
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => { setShowExcelImport(true); setShowAddForm(false); }}
            className="h-10 px-4 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Table size={15} />
            បញ្ចូលតាម Excel / CSV
          </button>
          
          <button
            onClick={() => { setShowAddForm(!showAddForm); setShowExcelImport(false); resetForm(); }}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus size={15} />
            {showAddForm && !editingEmpId ? "បិទប្រអប់បញ្ចូល" : "បន្ថែមបុគ្គលិកថ្មី"}
          </button>
        </div>
      </div>

      {/* Excel/CSV Bulk Loader Section */}
      {showExcelImport && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xs space-y-4 animate-fadeIn" id="excel_panel">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-slate-950 font-black">
                <Table size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">បញ្ចូលព័ត៌មានបុគ្គលិកទ្រង់ទ្រាយធំ (Excel/Tab Parsing)</h3>
                <p className="text-[11px] text-slate-400">ស្ទួនទំព័រ Excel របស់អ្នក រួចកូពីបិទភ្ជាប់ (Copy & Paste) ខាងក្រោម</p>
              </div>
            </div>

            <button
              onClick={downloadExcelTemplate}
              className="py-2 px-3.5 bg-slate-800 hover:bg-slate-705 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              ទាញយកគំរូ Template
            </button>
          </div>

          <p className="text-[11.5px] leading-relaxed text-slate-300 font-normal">
            របៀបធ្វើ៖ លោកអ្នកគ្រាន់តែ <span className="font-bold text-emerald-400">Copy</span> ក្រឡាកន្សោមតារាងក្នុង <span className="underline text-emerald-400">Excel</span> (មាន ៦ជួរឈរ៖ ឈ្មោះ, តួនាទី, ផ្នែក, ប្រាក់ខែគោល, លេខទូរសព្ទ, លេខTelegramChatId) រួច <span className="font-bold text-emerald-400">Paste</span> បិទភ្ជាប់ក្នុងប្រអប់ខាងក្រោម។
          </p>

          <textarea
            rows={5}
            value={excelPasteText}
            onChange={(e) => handleExcelPasteChange(e.target.value)}
            placeholder="បិទភ្ជាប់ (Paste) ទិន្នន័យពី Excel នៅទីនេះ...&#10;ឧទាហរណ៍៖&#10;សែម សុភ័ក្ត្រ&#10;Accountant&#10;ធនធានមនុស្ស&#10;680&#10;012776655&#10;98765432"
            className="w-full p-4 bg-slate-950 rounded-xl border border-slate-800 focus:border-emerald-500 text-xs font-mono focus:outline-none placeholder:text-slate-700 block leading-relaxed"
          ></textarea>

          {bulkError && (
            <p className="text-rose-400 text-xs flex items-center gap-1.5 font-semibold leading-normal bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/40">
              <AlertCircle size={14} className="shrink-0" />
              {bulkError}
            </p>
          )}

          {parsedDrafts.length > 0 && (
            <div className="space-y-3 animate-fadeIn" id="bulk_importer_preview">
              <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/30 font-bold">
                <span>🟢 បានរកឃើញទិន្នន័យបុគ្គលិកចំនួន៖ {parsedDrafts.length} នាក់</span>
                <button
                  onClick={handleCommitBulkImport}
                  className="py-1.5 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Check size={14} />
                  នាំចូលទៅក្នុងបញ្ជីបុគ្គលិក
                </button>
              </div>

              {/* Parsed list preview */}
              <div className="overflow-x-auto max-h-40 border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-left border-collapse text-[11px] text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 font-semibold">ឈ្មោះ</th>
                      <th className="py-2 px-3 font-semibold">តួនាទី</th>
                      <th className="py-2 px-3 font-semibold">ផ្នែក</th>
                      <th className="py-2 px-3 font-semibold">ប្រាក់ខែ</th>
                      <th className="py-2 px-3 font-semibold">ទូរសព្ទ</th>
                      <th className="py-2 px-3 font-semibold">Telegram ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedDrafts.map((draft, idx) => (
                      <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/50">
                        <td className="py-1.5 px-3 font-medium text-white">{draft.name}</td>
                        <td className="py-1.5 px-3 text-slate-400">{draft.position}</td>
                        <td className="py-1.5 px-3 text-slate-400">{draft.department}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-emerald-400">${draft.salary}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-400">{draft.phone}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-400">{draft.telegramChatId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Modal Segment */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-fadeIn" id="single_form_element">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <UserPlus size={16} className="text-blue-600" />
            {editingEmpId ? `កែសម្រួលព័ត៌មានបុគ្គលិករបស់៖ ${name}` : "បំពេញព័ត៌មានបុគ្គលិកថ្មី"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ឈ្មោះបុគ្គលិក (Khmer) *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ឈ្មោះបុគ្គលិក..."
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">តួនាទីសម្រេច (Position) *</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="ឧ. UI/UX Designer..."
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-sans">ផ្នែក/ការិយាល័យ (Department)</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ឧ. បច្ចេកវិទ្យា (IT)..."
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ប្រាក់ខែគោលប្រចាំខែ (Base Salary in USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[11px] font-mono font-bold text-slate-400">$</span>
                <input
                  type="number"
                  required
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="500"
                  className="w-full h-10 pl-7 pr-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-mono font-bold text-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">លេខទូរសព្ទទំនាក់ទំនង *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="098 XXXXXX"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 font-sans">Telegram Chat ID (Personal System Bot ID)</label>
              <input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="99887755"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              សម្អាតវាល
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={15} />
              {editingEmpId ? "រក្សាការសម្រេច" : "រក្សាទុកព័ត៌មាន"}
            </button>
          </div>
        </form>
      )}

      {/* Main Staff Employees Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="staff_table_element">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm" id="full_attendance_staff_table">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-4 px-5">កូដសម្គាល់ ID</th>
                <th className="py-4 px-5">ឈ្មោះបុគ្គលិក</th>
                <th className="py-4 px-5">តួនាទី & ផ្នែក</th>
                <th className="py-4 px-5">ប្រាក់ខែគោល</th>
                <th className="py-4 px-5">លេខទូរសព្ទ</th>
                <th className="py-4 px-5">Telegram Bot ID</th>
                <th className="py-4 px-5 text-right">ជម្រើសសកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs font-medium">
                    មិនមានទិន្នន័យបុគ្គលិកនៅក្នុងប្រព័ន្ធនៅឡើយទេ។ សូមបន្ថែមថ្មី!
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        {emp.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 text-xs">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">បានចូលរួម៖ {emp.joinedDate}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800 text-xs">{emp.position}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{emp.department}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-blue-600">
                        ${emp.salary.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs text-slate-650 text-slate-700">{emp.phone}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      {emp.telegramChatId ? (
                        <span className="font-mono bg-sky-50 text-sky-800 font-bold px-2 py-1 rounded-lg text-[10px]">
                          {emp.telegramChatId}
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-bold italic bg-rose-50 px-1.5 py-0.5 rounded-md">
                          មិនទាន់ភ្ជាប់
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditClick(emp)}
                          className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 hover:text-blue-600 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="កែសម្រួលព័ត៌មានបុគ្គលិក"
                        >
                          <Edit2 size={13} />
                          កែប្រែ
                        </button>
                        <button
                          onClick={() => handleDeleteClick(emp.id, emp.name)}
                          className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="លុបបុគ្គលិក"
                        >
                          <Trash2 size={13} />
                          លុប
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
