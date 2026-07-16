"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  endDate: string | null;
  color: string | null;
  course: { id: string; title: string } | null;
  creator: { id: string; name: string | null };
};

const EVENT_COLORS: Record<string, string> = {
  general: "#1a2e5a",
  exam: "#dc2626",
  assignment: "#c4a052",
  live: "#16a34a",
  holiday: "#7c3aed",
};

const EVENT_LABELS: Record<string, string> = {
  general: "عام",
  exam: "اختبار",
  assignment: "واجب",
  live: "جلسة مباشرة",
  holiday: "عطلة",
};

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [isStaff, setIsStaff] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("general");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      const role = s?.user?.role ?? "";
      setUserRole(role);
      setIsStaff(["owner", "admin", "instructor"].includes(role));
    }).catch(() => {});
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
    if (res.ok) setEvents(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.startDate);
      return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
    });
  };

  const createEvent = async () => {
    if (!newTitle.trim() || !newStart) return;
    setCreating(true);
    await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc || undefined,
        eventType: newType,
        startDate: newStart,
        endDate: newEnd || undefined,
      }),
    });
    setCreating(false);
    setShowCreate(false);
    setNewTitle(""); setNewDesc(""); setNewType("general"); setNewStart(""); setNewEnd("");
    await fetchEvents();
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("هل تريد حذف هذا الحدث؟")) return;
    await fetch(`/api/calendar/${eventId}`, { method: "DELETE" });
    await fetchEvents();
  };

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-br from-[#1a2e5a] to-[#2d4a8a] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <Link href="/student" className="text-white/60 text-sm hover:text-white mb-2 inline-block">← الرئيسية</Link>
            <h1 className="text-2xl font-bold">التقويم الدراسي</h1>
          </div>
          {isStaff && (
            <button onClick={() => setShowCreate(true)}
              className="bg-[#c4a052] text-white px-4 py-2 rounded-xl text-sm font-medium">
              + حدث جديد
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Create event form */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-bold text-[#1a2e5a]">إضافة حدث جديد</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">العنوان *</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
                placeholder="عنوان الحدث" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">النوع</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]">
                {Object.entries(EVENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">الوصف</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">تاريخ البدء *</label>
                <input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">تاريخ الانتهاء</label>
                <input type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={createEvent} disabled={creating}
                className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                {creating ? "جارٍ الإنشاء..." : "إنشاء"}
              </button>
              <button onClick={() => setShowCreate(false)}
                className="border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600">إلغاء</button>
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600">
              &#8250;
            </button>
            <h2 className="text-xl font-bold text-[#1a2e5a]">
              {MONTHS_AR[month - 1]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl text-gray-600">
              &#8249;
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          {loading ? (
            <div className="text-center text-gray-400 py-8">جارٍ التحميل...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[60px] p-1.5 rounded-xl text-right transition-colors ${
                      isSelected ? "bg-[#1a2e5a] text-white" :
                      isToday ? "bg-[#1a2e5a]/10 text-[#1a2e5a]" :
                      "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? "text-white" : isToday ? "text-[#1a2e5a]" : "text-gray-600"}`}>
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: e.color ?? EVENT_COLORS[e.eventType] ?? EVENT_COLORS.general }}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[8px] text-gray-400">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex flex-wrap gap-4">
            {Object.entries(EVENT_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-sm text-gray-600">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EVENT_COLORS[key] }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-[#1a2e5a] mb-4">
              أحداث يوم {selectedDay} {MONTHS_AR[month - 1]}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-gray-400 text-sm">لا توجد أحداث في هذا اليوم</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 mt-1"
                      style={{ backgroundColor: e.color ?? EVENT_COLORS[e.eventType] ?? EVENT_COLORS.general }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {EVENT_LABELS[e.eventType] ?? e.eventType}
                        </span>
                        <h4 className="font-medium text-gray-800">{e.title}</h4>
                      </div>
                      {e.description && <p className="text-sm text-gray-500 mt-1">{e.description}</p>}
                      <div className="flex gap-3 text-xs text-gray-400 mt-1">
                        <span>🕐 {new Date(e.startDate).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                        {e.course && <span>📚 {e.course.title}</span>}
                      </div>
                    </div>
                    {isStaff && (
                      <button onClick={() => deleteEvent(e.id)}
                        className="text-red-300 hover:text-red-500 text-xs shrink-0">حذف</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All events this month */}
        {!selectedDay && events.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-bold text-[#1a2e5a] mb-4">جميع الأحداث هذا الشهر</h3>
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                  <div
                    className="w-2 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: e.color ?? EVENT_COLORS[e.eventType] ?? EVENT_COLORS.general }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{e.title}</span>
                      <span className="text-xs text-gray-400">{EVENT_LABELS[e.eventType] ?? e.eventType}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(e.startDate).toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" })}
                      {e.course && ` · ${e.course.title}`}
                    </p>
                  </div>
                  {isStaff && (
                    <button onClick={() => deleteEvent(e.id)} className="text-red-300 hover:text-red-500 text-xs">حذف</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
