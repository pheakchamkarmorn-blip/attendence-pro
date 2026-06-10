-- ១. បង្កើតតារាងបុគ្គលិក Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  "telegramChatId" TEXT DEFAULT '',
  salary NUMERIC DEFAULT 0,
  position TEXT DEFAULT '',
  department TEXT DEFAULT '',
  "joinedDate" TEXT DEFAULT ''
);

-- ២. បង្កើតតារាងវត្តមាន Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  "checkInTime" TEXT DEFAULT '',
  "checkOutTime" TEXT,
  "checkInDistance" NUMERIC,
  "checkOutDistance" NUMERIC,
  status TEXT DEFAULT 'on_time',
  "checkInLocation" JSONB,
  "checkOutLocation" JSONB,
  notes TEXT
);

-- ៣. បង្កើតតារាងបើកប្រាក់ខែ Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  "baseSalary" NUMERIC DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  "allowancesExplanation" TEXT DEFAULT '',
  deductions NUMERIC DEFAULT 0,
  "deductionsExplanation" TEXT DEFAULT '',
  "netSalary" NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  "paymentDate" TEXT,
  "calculatedAt" TEXT
);

-- ៤. បង្កើតតារាងកំណត់ប្រព័ន្ធ Settings (រក្សាទុកតម្លៃ ១ ជួរជានិច្ច)
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  "officeLat" NUMERIC DEFAULT 11.5564,
  "officeLng" NUMERIC DEFAULT 104.9282,
  "officeRadius" NUMERIC DEFAULT 50,
  "officeAddress" TEXT,
  "telegramBotToken" TEXT,
  "telegramGroupId" TEXT,
  "workStartTime" TEXT DEFAULT '08:00',
  "workEndTime" TEXT DEFAULT '17:00',
  "deductionRateLateMin" NUMERIC DEFAULT 0.1,
  "deductionRateAbsent" NUMERIC DEFAULT 15,
  "autoCalculateDeductions" BOOLEAN DEFAULT true
);

-- ៥. បង្កើតតារាងប្រអប់ Live Telegram Bot Logs
CREATE TABLE IF NOT EXISTS telegram_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  recipient TEXT NOT NULL,
  "chatId" TEXT,
  message TEXT,
  success BOOLEAN,
  "statusMessage" TEXT
);
