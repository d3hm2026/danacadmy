import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["owner","admin"].includes(session?.user?.role ?? ""))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: examId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);

  const sectionMap = new Map<number, string>();

  for (const row of rows) {
    const sectionNum = Number(row["القسم"] || row["section"] || 1);
    const sectionTitle = String(row["اسم القسم"] || row["section_title"] || `القسم ${sectionNum}`);
    const timeLimit = Number(row["وقت القسم (ث)"] || row["time_limit"] || 300);

    if (!sectionMap.has(sectionNum)) {
      const existing = await prisma.section.findFirst({
        where: { examId, order: sectionNum },
      });
      if (existing) {
        sectionMap.set(sectionNum, existing.id);
      } else {
        const sec = await prisma.section.create({
          data: { title: sectionTitle, order: sectionNum, timeLimit, examId },
        });
        sectionMap.set(sectionNum, sec.id);
      }
    }

    const sectionId = sectionMap.get(sectionNum)!;
    const qCount = await prisma.question.count({ where: { sectionId } });

    await prisma.question.create({
      data: {
        text: String(row["السؤال"] || row["question"]),
        score: Number(row["الدرجة"] || row["score"] || 1),
        order: qCount + 1,
        sectionId,
        choices: {
          create: [
            { text: String(row["أ"] || row["a"] || ""), percentage: Number(row["نسبة أ"] || row["pct_a"] || 0) },
            { text: String(row["ب"] || row["b"] || ""), percentage: Number(row["نسبة ب"] || row["pct_b"] || 0) },
            { text: String(row["ج"] || row["c"] || ""), percentage: Number(row["نسبة ج"] || row["pct_c"] || 0) },
            { text: String(row["د"] || row["d"] || ""), percentage: Number(row["نسبة د"] || row["pct_d"] || 0) },
          ].filter((c) => c.text && c.text !== "undefined"),
        },
      },
    });
  }

  return NextResponse.json({ imported: rows.length });
}
