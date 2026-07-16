"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Instructor = { id: string; name: string | null; phone: string };

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/instructors").then((r) => r.json()).then(setInstructors).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("يرجى إدخال عنوان الدورة"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, instructorId: instructorId || null }),
    });
    if (res.ok) {
      const course = await res.json();
      router.push(`/admin/courses/${course.id}`);
    } else {
      setError("حدث خطأ أثناء الإنشاء");
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/courses" className="text-gray-400 hover:text-gray-600 text-sm">
          ← الدورات
        </Link>
        <h1 className="text-xl font-bold text-[#1a2e5a]">إنشاء دورة جديدة</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الدورة *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: دورة الرياضيات المتقدمة"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="وصف مختصر للدورة..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none"
            />
          </div>

          {instructors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المعلم المسؤول</label>
              <select
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
              >
                <option value="">— بدون معلم —</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>{ins.name ?? ins.phone}</option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#1a2e5a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#22397a] disabled:opacity-50"
            >
              {loading ? "جارٍ الإنشاء..." : "إنشاء الدورة"}
            </button>
            <Link
              href="/admin/courses"
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
