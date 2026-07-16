"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type Submission = {
  id: string;
  userId: string;
  user: { id: string; name: string | null; phone: string };
  fileUrl: string | null;
  fileName: string | null;
  comment: string | null;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
};

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  maxScore: number;
  createdAt: string;
  submissions: Submission[];
};

export default function InstructorAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newMax, setNewMax] = useState("100");
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  const fetchAssignments = async () => {
    const res = await fetch(`/api/courses/${id}/assignments`);
    if (res.ok) {
      // Fetch with submissions for instructor view
      const list: Assignment[] = await res.json();
      // Refetch each assignment to get full submissions
      const detailed = await Promise.all(
        list.map(async (a) => {
          const r = await fetch(`/api/courses/${id}/assignments/${a.id}`);
          if (r.ok) {
            const full = await r.json();
            return full as Assignment;
          }
          return a;
        })
      );
      setAssignments(detailed);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, [id]);

  const createAssignment = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    await fetch(`/api/courses/${id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc || undefined,
        dueDate: newDue || undefined,
        maxScore: parseInt(newMax) || 100,
      }),
    });
    setCreating(false);
    setShowCreate(false);
    setNewTitle(""); setNewDesc(""); setNewDue(""); setNewMax("100");
    await fetchAssignments();
  };

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm("هل تريد حذف هذا الواجب؟")) return;
    await fetch(`/api/courses/${id}/assignments/${assignmentId}`, { method: "DELETE" });
    await fetchAssignments();
  };

  const gradeSubmission = async (assignmentId: string) => {
    if (!gradingId) return;
    await fetch(`/api/courses/${id}/assignments/${assignmentId}/grade`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: gradingId, score: parseInt(gradeScore), feedback: gradeFeedback }),
    });
    setGradingId(null);
    setGradeScore(""); setGradeFeedback("");
    await fetchAssignments();
  };

  if (loading) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <Link href={`/instructor/courses/${id}`} className="text-white/60 text-sm hover:text-white mb-2 inline-block">← إدارة الدورة</Link>
            <h1 className="text-2xl font-bold">إدارة الواجبات</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#c4a052] text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            + واجب جديد
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-[#1a2e5a]">واجب جديد</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">العنوان *</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
                placeholder="عنوان الواجب" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الوصف</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none"
                placeholder="تعليمات الواجب..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">موعد التسليم</label>
                <input type="datetime-local" value={newDue} onChange={(e) => setNewDue(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">الدرجة القصوى</label>
                <input type="number" value={newMax} onChange={(e) => setNewMax(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createAssignment} disabled={creating}
                className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                {creating ? "جارٍ الإنشاء..." : "إنشاء الواجب"}
              </button>
              <button onClick={() => setShowCreate(false)}
                className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600">إلغاء</button>
            </div>
          </div>
        )}

        {assignments.length === 0 && !showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            لا توجد واجبات. أنشئ واجبًا جديدًا باستخدام الزر أعلاه.
          </div>
        )}

        {assignments.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#1a2e5a]">{a.title}</h2>
                {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                <div className="flex gap-4 text-xs text-gray-400 mt-2">
                  {a.dueDate && <span>📅 موعد التسليم: {new Date(a.dueDate).toLocaleDateString("ar-SA")}</span>}
                  <span>🎯 الدرجة القصوى: {a.maxScore}</span>
                  <span>📨 {a.submissions.length} تسليم</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpandedAssignment(expandedAssignment === a.id ? null : a.id)}
                  className="border border-gray-200 px-3 py-1.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  {expandedAssignment === a.id ? "إخفاء" : "التسليمات"}
                </button>
                <button onClick={() => deleteAssignment(a.id)}
                  className="border border-red-200 text-red-400 hover:text-red-600 px-3 py-1.5 rounded-xl text-sm">
                  حذف
                </button>
              </div>
            </div>

            {expandedAssignment === a.id && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                {a.submissions.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">لا توجد تسليمات بعد</p>
                )}
                {a.submissions.map((sub) => (
                  <div key={sub.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{sub.user?.name ?? sub.user?.phone ?? "طالب"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          تاريخ التسليم: {new Date(sub.submittedAt).toLocaleDateString("ar-SA")}
                          {sub.gradedAt && ` · تم التصحيح: ${new Date(sub.gradedAt).toLocaleDateString("ar-SA")}`}
                        </p>
                        {sub.fileUrl && (
                          <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-[#1a2e5a] hover:underline mt-1 inline-block">
                            📎 {sub.fileName || "الملف"}
                          </a>
                        )}
                        {sub.comment && <p className="text-sm text-gray-600 mt-1">💬 {sub.comment}</p>}
                        {sub.score !== null && (
                          <p className="text-sm font-medium text-[#c4a052] mt-1">
                            الدرجة: {sub.score}/{a.maxScore}
                          </p>
                        )}
                        {sub.feedback && <p className="text-sm text-gray-500 mt-1">تغذية راجعة: {sub.feedback}</p>}
                      </div>
                      <button
                        onClick={() => { setGradingId(sub.id); setGradeScore(sub.score !== null ? String(sub.score) : ""); setGradeFeedback(sub.feedback ?? ""); }}
                        className="shrink-0 bg-[#1a2e5a] text-white px-3 py-1.5 rounded-xl text-xs"
                      >
                        {sub.score !== null ? "تعديل الدرجة" : "تصحيح"}
                      </button>
                    </div>

                    {gradingId === sub.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">الدرجة (من {a.maxScore})</label>
                            <input type="number" value={gradeScore} onChange={(e) => setGradeScore(e.target.value)}
                              min="0" max={a.maxScore}
                              className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">تغذية راجعة</label>
                          <textarea value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)} rows={2}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => gradeSubmission(a.id)}
                            className="bg-[#c4a052] text-white px-3 py-1.5 rounded-xl text-xs">حفظ الدرجة</button>
                          <button onClick={() => setGradingId(null)}
                            className="border border-gray-200 px-3 py-1.5 rounded-xl text-xs text-gray-500">إلغاء</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
