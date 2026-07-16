"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type Submission = {
  id: string;
  score: number | null;
  feedback: string | null;
  submittedAt: string;
  fileUrl: string | null;
  fileName: string | null;
  comment: string | null;
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

export default function StudentAssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [comment, setComment] = useState("");

  const fetchAssignments = async () => {
    const res = await fetch(`/api/courses/${id}/assignments`);
    if (res.ok) setAssignments(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchAssignments(); }, [id]);

  const openForm = (assignmentId: string, existing: Submission | undefined) => {
    setActiveForm(assignmentId);
    setFileUrl(existing?.fileUrl ?? "");
    setFileName(existing?.fileName ?? "");
    setComment(existing?.comment ?? "");
  };

  const submitAssignment = async (assignmentId: string) => {
    setSubmitting(assignmentId);
    await fetch(`/api/courses/${id}/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl, fileName, comment }),
    });
    setSubmitting(null);
    setActiveForm(null);
    setFileUrl(""); setFileName(""); setComment("");
    await fetchAssignments();
  };

  if (loading) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] text-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href={`/courses/${id}`} className="text-white/60 text-sm hover:text-white mb-3 inline-block">← الدورة</Link>
          <h1 className="text-2xl font-bold">الواجبات</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {assignments.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            لا توجد واجبات بعد
          </div>
        )}

        {assignments.map((a) => {
          const sub = a.submissions[0] ?? null;
          const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && !sub;

          return (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-[#1a2e5a]">{a.title}</h2>
                  {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                </div>
                <div className="shrink-0 text-left">
                  {sub?.score !== null && sub?.score !== undefined ? (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#c4a052]">{sub.score}</div>
                      <div className="text-xs text-gray-400">من {a.maxScore}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">الدرجة: {a.maxScore}</div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
                {a.dueDate && (
                  <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                    📅 موعد التسليم: {new Date(a.dueDate).toLocaleDateString("ar-SA")}
                    {isOverdue && " (انتهى الموعد)"}
                  </span>
                )}
                {sub && (
                  <span className="text-green-600">
                    ✅ تم التسليم: {new Date(sub.submittedAt).toLocaleDateString("ar-SA")}
                  </span>
                )}
              </div>

              {/* Existing submission details */}
              {sub && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  {sub.fileUrl && (
                    <div>
                      <span className="text-gray-500">الملف: </span>
                      <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#1a2e5a] hover:underline font-medium">
                        {sub.fileName || sub.fileUrl}
                      </a>
                    </div>
                  )}
                  {sub.comment && <p className="text-gray-600"><span className="text-gray-400">تعليق: </span>{sub.comment}</p>}
                  {sub.feedback && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-2">
                      <p className="text-xs text-amber-700 font-semibold mb-1">تغذية راجعة من المدرب:</p>
                      <p className="text-sm text-amber-800">{sub.feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit form */}
              {activeForm === a.id ? (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">رابط الملف (Google Drive / Dropbox)</label>
                    <input
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">اسم الملف (اختياري)</label>
                    <input
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="مثال: واجب الأسبوع الأول.pdf"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">تعليق (اختياري)</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      placeholder="أي ملاحظات..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitAssignment(a.id)}
                      disabled={submitting === a.id}
                      className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                    >
                      {submitting === a.id ? "جارٍ الإرسال..." : "إرسال الواجب"}
                    </button>
                    <button
                      onClick={() => setActiveForm(null)}
                      className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => openForm(a.id, sub ?? undefined)}
                  className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm"
                >
                  {sub ? "تعديل التسليم" : "تسليم الواجب"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
