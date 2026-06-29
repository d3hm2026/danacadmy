"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Exam {
  id: string;
  title: string;
  totalScore: number;
  isActive: boolean;
  sections: { id: string; questions: { id: string }[] }[];
  students: { id: string }[];
  sessions: { id: string; finishedAt: string | null }[];
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [title, setTitle] = useState("");
  const [totalScore, setTotalScore] = useState(100);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/exams");
    setExams(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, totalScore }),
    });
    setTitle(""); setDescription(""); setTotalScore(100);
    load();
    setLoading(false);
  }

  async function toggleActive(exam: Exam) {
    await fetch(`/api/admin/exams/${exam.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !exam.isActive }),
    });
    load();
  }

  async function deleteExam(id: string) {
    if (!confirm("حذف الاختبار وكل بياناته؟")) return;
    await fetch(`/api/admin/exams/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">الاختبارات</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-medium text-gray-800 mb-4">إنشاء اختبار جديد</h2>
        <form onSubmit={createExam} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان الاختبار" required
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف (اختياري)"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              <input
                type="number" value={totalScore} onChange={(e) => setTotalScore(Number(e.target.value))}
                placeholder="الدرجة الكلية" min={1}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
              />
              <button
                type="submit" disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 py-2 text-sm font-medium whitespace-nowrap"
              >
                إنشاء
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {exams.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-10 bg-white rounded-2xl border border-gray-100">لا توجد اختبارات</p>
        )}
        {exams.map((exam) => {
          const qCount = exam.sections.reduce((s, sec) => s + sec.questions.length, 0);
          const doneCount = exam.sessions.filter((s) => s.finishedAt).length;
          return (
            <div key={exam.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{exam.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      exam.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {exam.isActive ? "مفعّل" : "معطّل"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {exam.sections.length} قسم · {qCount} سؤال · {exam.students.length} طالب · {doneCount} أنهى · الدرجة الكلية: {exam.totalScore}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(exam)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
                      exam.isActive
                        ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                        : "border-green-200 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {exam.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                  <Link
                    href={`/admin/exams/${exam.id}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium"
                  >
                    إدارة
                  </Link>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 font-medium"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
