import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "profile"; // "profile" or "documents"

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 2. Validate file type & size (e.g., max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Define local destination
    // Next.js static asset dir: public/uploads/<folder>
    const relativeUploadDir = join("uploads", folder);
    const absoluteUploadDir = join(process.cwd(), "public", relativeUploadDir);

    // Ensure the folder exists
    await mkdir(absoluteUploadDir, { recursive: true });

    // Generate unique name
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    const absoluteFilePath = join(absoluteUploadDir, uniqueFileName);

    // Write file to local disk
    await writeFile(absoluteFilePath, buffer);

    // Return the relative URL to access the static file via standard Next.js routing
    const fileUrl = `/${relativeUploadDir.replace(/\\/g, "/")}/${uniqueFileName}`;

    return NextResponse.json({ success: true, fileUrl });
  } catch (error) {
    console.error("Local file upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
