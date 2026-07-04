import fs from "fs";
import path from "path";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string; // "Employee Created", "Employee Updated", etc.
  adminId: string;
  adminName: string;
  affectedEmployeeId?: string;
  affectedEmployeeName?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(DATA_DIR, "audit_logs.json");

function ensureDirectoryAndFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function writeAuditLog(
  action: string,
  adminId: string,
  adminName: string,
  affectedEmployeeId?: string,
  affectedEmployeeName?: string
) {
  try {
    ensureDirectoryAndFile();
    const data = fs.readFileSync(LOG_FILE, "utf-8");
    const logs: AuditLogEntry[] = JSON.parse(data);

    const newEntry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      action,
      adminId,
      adminName,
      affectedEmployeeId,
      affectedEmployeeName,
    };

    logs.unshift(newEntry); // Newest first
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs.slice(0, 1000), null, 2), "utf-8"); // Cap at 1000 logs
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

export function getAuditLogs(): AuditLogEntry[] {
  try {
    ensureDirectoryAndFile();
    const data = fs.readFileSync(LOG_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read audit logs:", error);
    return [];
  }
}
