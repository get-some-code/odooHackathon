"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface ActionResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function askNexusAIAction(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<ActionResponse<string>> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Access Denied. Admins and HR only." };
    }

    // Fetch all workforce data to provide as local context to LLM
    const employees = await db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        profile: true,
        attendances: {
          orderBy: { date: "desc" },
          take: 7, // Last week of attendance
        },
        leaveRequests: {
          orderBy: { startDate: "desc" },
        },
        payrolls: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 3, // Last 3 payroll records
        },
      },
    });

    // Construct a compact, highly structured context profile of each employee
    const employeeDataSummary = employees.map((emp) => {
      const p = emp.profile;
      
      const attendanceSummary = emp.attendances.map(att => {
        return `${new Date(att.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}: ${att.status} (${att.checkIn ? "In: " + new Date(att.checkIn).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "No In"} - ${att.checkOut ? "Out: " + new Date(att.checkOut).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "No Out"})`;
      }).join(", ");

      const leavesSummary = emp.leaveRequests.map(lv => {
        const diff = Math.ceil(Math.abs(lv.endDate.getTime() - lv.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return `${lv.leaveType} (${diff} days: ${new Date(lv.startDate).toLocaleDateString("en-IN")} to ${new Date(lv.endDate).toLocaleDateString("en-IN")}) - Status: ${lv.status}`;
      }).join("; ");

      const payrollSummary = emp.payrolls.map(pay => {
        return `${pay.month}/${pay.year}: Basic ₹${pay.basicSalary}, Net ₹${pay.netSalary} (Status: ${pay.paymentStatus})`;
      }).join("; ");

      return {
        id: emp.id,
        employeeId: emp.employeeId,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        phone: p?.phone || "N/A",
        department: p?.department || "Unassigned",
        designation: p?.designation || "N/A",
        status: p?.status || "Active",
        joiningDate: p?.joiningDate ? new Date(p.joiningDate).toLocaleDateString("en-IN") : "N/A",
        baseSalary: p?.baseSalary || 0,
        address: p?.address || "N/A",
        recentAttendance: attendanceSummary || "No attendance logged recently",
        leavesRequested: leavesSummary || "No leave requests",
        payrollHistory: payrollSummary || "No payroll history",
      };
    });

    const systemPrompt = `You are "NexusAI", the official AI HR Assistant for Nexus Enterprise's Human Resource Management System (HRMS).
You are talking to an HR Administrator or Admin. Your job is to answer queries about the workforce directory using the live database snapshot provided below.

WORKFORCE DATABASE SNAPSHOT:
${JSON.stringify(employeeDataSummary, null, 2)}

INSTRUCTIONS:
1. Always be professional, clear, specific, and objective.
2. Provide details exactly as they are in the database snapshot. Do not hallucinate names, dates, or salaries.
3. If asked about joining dates, performance (infer based on attendance statuses: PRESENT vs ABSENT/HALF_DAY), leave balance, payroll details, salaries, or status, formulate tables or bullet lists to make the information highly readable for HRs.
4. Keep the tone helpful, structured, and enterprise-grade.
5. If the user asks about an employee not in the database, politely state that they do not exist in the current directory.`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return { success: false, error: "Gemini API key is not configured in .env environment variables." };
    }
    
    // Map standard roles (system, user, model) to Gemini format
    // Gemini roles are "user" and "model". System instructions are passed separately or as a user message at the start.
    const contents = [
      {
        role: "user",
        parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nPlease keep these instructions in mind for all messages.` }]
      },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }))
    ];

    // Call Gemini API via fetch (using current free model gemini-2.5-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return { success: false, error: "Failed to communicate with Gemini LLM API" };
    }

    const result = await response.json();
    const assistantMessage = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
    
    return { success: true, data: assistantMessage };

  } catch (error: any) {
    console.error("askNexusAIAction error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
