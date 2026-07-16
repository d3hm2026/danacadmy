"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type LiveSession = {
  id: string;
  title: string;
  description: string | null;
  meetingUrl: string;
  scheduledAt: string;
  duration: number;
  isActive: boolean;
};

export default function InstructorLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");

  const fetchSessions = async () => {
    const res = await fetch(`/api/courses/${id}/live-sessions`);
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, [id]);

  const createSession = async () => {
    if (!title.trim() || !meetingUrl.trim() || !scheduledAt) return;
    setCreating(true);
    await fetch(`/api/courses/${id}/live-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), description: description || undefined, meetingUrl: meetingUrl.trim(), scheduledAt, duration: parseInt(duration) || 60 }),
    });
    setCreating(false);
    setShowCreate(false);
    setTitle(""); setDescription(""); setMeetingUrl(""); setScheduledAt(""); setDuration("60");
    await fetchSessions();
  };

  const toggleActive = async (session: LiveSession) => {
    await fetch(`/api/courses/${id}/live-sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !session.isActive }),
    });
    await fetchSessions();
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("هل تريد حذف هذه الجلسة؟")) return;
    await fetch(`/api/courses/${id}/live-sessions/${sessionId}`, { method: "DELETE" });
    await fetchSessions();
  };

  if (loading) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] text-white py-8">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div>
            <Link href={`/instructor/courses/${id}`} className="text-white/60 text-sm hover:text-white mb-2 inline-block">← إدارة الدورة</Link>
            <h1 className="text-2xl font-bold">الجلسات المباشرة</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="bg-[#c4a052] text-white px-4 py-2 rounded-xl text-sm font-medium">
            + جلسة جديدة
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        {showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-[#1a2e5a]">جلسة مباشرة جديدة</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">العنوان *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
                placeholder="عنوان الجلسة" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الوصف</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">رابط الاجتماع * (Zoom / Meet / YouTube)</label>
              <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
                placeholder="https://zoom.us/j/..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">الموعد *</label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">المدة (بالدقائق)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createSession} disabled={creating}
                className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                {creating ? "جارٍ الإنشاء..." : "إنشاء الجلسة"}
              </button>
              <button onClick={() => setShowCreate(false)}
                className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600">إلغاء</button>
            </div>
          </div>
        )}

        {sessions.length === 0 && !showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            لا توجد جلسات مباشرة. أضف جلسة جديدة باستخدام الزر أعلاه.
          </div>
        )}

        {sessions.map((s) => (
          <div key={s.id} className={`bg-white rounded-2xl border p-6 ${s.isActive ? "border-green-300" : "border-gray-100"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {s.isActive && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">🔴 مباشر الآن</span>}
                  <h2 className="font-bold text-[#1a2e5a]">{s.title}</h2>
                </div>
                {s.description && <p className="text-sm text-gray-500 mb-2">{s.description}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <span>📅 {new Date(s.scheduledAt).toLocaleString("ar-SA")}</span>
                  <span>⏱ {s.duration} دقيقة</span>
                </div>
                <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#1a2e5a] hover:underline mt-1 inline-block">
                  🔗 {s.meetingUrl}
                </a>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium ${s.isActive ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-green-100 text-green-600 hover:bg-green-200"}`}
                >
                  {s.isActive ? "إيقاف البث" : "بدء البث"}
                </button>
                <button onClick={() => deleteSession(s.id)}
                  className="border border-red-200 text-red-400 hover:text-red-600 px-3 py-1.5 rounded-xl text-xs">
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
