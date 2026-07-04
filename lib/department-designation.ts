import fs from "fs";
import path from "path";

export interface DepartmentEntry {
  name: string;
  managerId?: string;
  managerName?: string;
  description?: string;
  createdAt: string;
}

export interface DesignationEntry {
  title: string;
  department: string;
  hierarchyLevel: number; // lower number means higher hierarchy (e.g. 1 = Director, 3 = Staff)
}

const DATA_DIR = path.join(process.cwd(), "data");
const DEPT_FILE = path.join(DATA_DIR, "departments.json");
const DESIGNATION_FILE = path.join(DATA_DIR, "designations.json");

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DEPT_FILE)) {
    const defaultDepts: DepartmentEntry[] = [
      { name: "Engineering", managerName: "Monideep", description: "Product & Engineering team", createdAt: new Date().toISOString() },
      { name: "Design", managerName: "Sarah Connor", description: "UI, UX & Branding team", createdAt: new Date().toISOString() },
      { name: "Marketing", managerName: "John Smith", description: "Publicity & Growth team", createdAt: new Date().toISOString() },
      { name: "Operations", managerName: "David Miller", description: "Internal operations & delivery", createdAt: new Date().toISOString() },
      { name: "HR", managerName: "Emma Watson", description: "Talent acquisition & payroll management", createdAt: new Date().toISOString() },
    ];
    fs.writeFileSync(DEPT_FILE, JSON.stringify(defaultDepts, null, 2), "utf-8");
  }
  if (!fs.existsSync(DESIGNATION_FILE)) {
    const defaultDesignations: DesignationEntry[] = [
      { title: "Software Engineer", department: "Engineering", hierarchyLevel: 3 },
      { title: "Senior Software Engineer", department: "Engineering", hierarchyLevel: 2 },
      { title: "Engineering Lead", department: "Engineering", hierarchyLevel: 1 },
      { title: "Product Designer", department: "Design", hierarchyLevel: 3 },
      { title: "Design Director", department: "Design", hierarchyLevel: 1 },
      { title: "Marketing Analyst", department: "Marketing", hierarchyLevel: 3 },
      { title: "Operations Coordinator", department: "Operations", hierarchyLevel: 3 },
      { title: "HR Generalist", department: "HR", hierarchyLevel: 3 },
    ];
    fs.writeFileSync(DESIGNATION_FILE, JSON.stringify(defaultDesignations, null, 2), "utf-8");
  }
}

export function getDepartments(): DepartmentEntry[] {
  ensureFiles();
  try {
    const data = fs.readFileSync(DEPT_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveDepartments(depts: DepartmentEntry[]) {
  ensureFiles();
  fs.writeFileSync(DEPT_FILE, JSON.stringify(depts, null, 2), "utf-8");
}

export function getDesignations(): DesignationEntry[] {
  ensureFiles();
  try {
    const data = fs.readFileSync(DESIGNATION_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveDesignations(titles: DesignationEntry[]) {
  ensureFiles();
  fs.writeFileSync(DESIGNATION_FILE, JSON.stringify(titles, null, 2), "utf-8");
}
