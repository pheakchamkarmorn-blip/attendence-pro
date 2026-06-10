export interface Employee {
  id: string;
  name: string;
  phone: string;
  telegramChatId: string; // Dynamic individualized telegram chat id
  salary: number; // monthly base pay in USD
  position: string;
  department: string;
  joinedDate: string;
}

export type AttendanceStatus = 'on_time' | 'late' | 'half_day' | 'absent' | 'leave';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM:SS
  checkOutTime: string | null; // HH:MM:SS
  checkInDistance: number; // meters from office
  checkOutDistance: number | null; // meters from office
  status: AttendanceStatus;
  checkInLocation: { lat: number; lng: number };
  checkOutLocation: { lat: number; lng: number } | null;
  notes?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  allowances: number;
  allowancesExplanation: string;
  deductions: number;
  deductionsExplanation: string;
  netSalary: number;
  status: 'pending' | 'paid';
  paymentDate: string | null;
  calculatedAt: string;
}

export interface SystemSettings {
  officeLat: number;
  officeLng: number;
  officeRadius: number; // default 50
  officeAddress: string;
  telegramBotToken: string;
  telegramGroupId: string; // Telegram Group for dynamic automated channel team alerts
  workStartTime: string; // e.g. "08:00"
  workEndTime: string; // e.g. "17:00"
  deductionRateLateMin: number; // Deduction in USD per minute of late check-in
  deductionRateAbsent: number; // Deduction in USD per day of absent
  autoCalculateDeductions: boolean; // boolean
}
