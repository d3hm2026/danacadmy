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

export default function StudentLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${id}/live-sessions`)
      .then((r) => r.json())
      .then((d) => { setSessions(d); setLoading(false); });
  }, [id]);

  if (loading) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;

  const now = new Date();
  const upcoming = sessions.filter((s) => new Date(s.scheduledAt) >= now);
  const past = sessions.filter((s) => new Date(s.scheduledAt) < now);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] text-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href={`/courses/${id}`} className="text-white/60 text-sm hover:text-white mb-3 inline-block">← الدورة</Link>
          <h1 className="text-2xl font-bold">الجلسات المباشرة</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {sessions.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
            لا توجد جلسات مباشرة بعد
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#1a2e5a] mb-3">الجلسات القادمة</h2>
            <div className="space-y-3">
              {upcoming.map((s) => (
                <div key={s.id} className={`bg-white rounded-2xl border p-6 ${s.isActive ? "border-green-300 bg-green-50" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {s.isActive && (
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">
                            🔴 مباشر الآن
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-[#1a2e5a]">{s.title}</h3>
                      </div>
                      {s.description && <p className="text-sm text-gray-500 mb-2">{s.description}</p>}
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span>📅 {new Date(s.scheduledAt).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                        <span>🕐 {new Date(s.scheduledAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>⏱ {s.duration} دقيقة</span>
                      </div>
                    </div>
                    <a
                      href={s.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium text-white ${s.isActive ? "bg-green-600 hover:bg-green-700" : "bg-[#1a2e5a] hover:bg-[#22397a]"}`}
                    >
                      {s.isActive ? "انضم الآن" : "الرابط"}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-400 mb-3">الجلسات السابقة</h2>
            <div className="space-y-3">
              {past.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-700">{s.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(s.scheduledAt).toLocaleDateString("ar-SA")} · {s.duration} دقيقة
                      </p>
                    </div>
                    <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#1a2e5a] hover:underline">
                      عرض التسجيل
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
