"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Choice { id: string; text: string; percentage: number; }
interface Question { id: string; text: string; score: number; order: number; choices: Choice[]; }
interface Section { id: string; title: string; order: number; timeLimit: number; questions: Question[]; }
interface Student { id: string; user: { id: string; name: string | null; phone: string }; }
interface Exam {
  id: string; title: string; totalScore: number; isActive: boolean;
  sections: Section[]; students: Student[];
}

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [tab, setTab] = useState<"sections" | "students" | "results">("sections");

  const [secTitle, setSecTitle] = useState("");
  const [secTime, setSecTime] = useState(300);
  const [activeSec, setActiveSec] = useState<string | null>(null);

  const [qText, setQText] = useState("");
  const [qScore, setQScore] = useState(1);
  const [choices, setChoices] = useState([
    { text: "", percentage: 100 },
    { text: "", percentage: 0 },
    { text: "", percentage: 0 },
    { text: "", percentage: 0 },
  ]);

  const [addPhone, setAddPhone] = useState("");
  const [studentMsg, setStudentMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [sessions, setSessions] = useState<{ id: string; user: { name: string | null; phone: string }; totalScore: number | null; finishedAt: string | null }[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/exams/${id}`);
    setExam(await res.json());
  }, [id]);

  const loadSessions = useCallback(async () => {
    const res = await fetch(`/api/admin/exams/${id}/sessions`);
    if (res.ok) setSessions(await res.json());
  }, [id]);

  useEffect(() => { load(); loadSessions(); }, [load, loadSessions]);

  async function addSection(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/admin/exams/${id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: secTitle, timeLimit: secTime }),
    });
    setSecTitle(""); setSecTime(300);
    load();
  }

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSec) return;
    await fetch(`/api/admin/exams/${id}/sections/${activeSec}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: qText, score: qScore, choices }),
    });
    setQText(""); setQScore(1);
    setChoices([
      { text: "", percentage: 100 },
      { text: "", percentage: 0 },
      { text: "", percentage: 0 },
      { text: "", percentage: 0 },
    ]);
    load();
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setStudentMsg("");
    const res = await fetch(`/api/admin/exams/${id}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: addPhone }),
    });
    const d = await res.json();
    setStudentMsg(res.ok ? "تم إضافة الطالب" : d.error);
    if (res.ok) { setAddPhone(""); load(); }
  }

  async function removeStudent(userId: string) {
    await fetch(`/api/admin/exams/${id}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    load();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("جاري الرفع...");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/exams/${id}/import`, { method: "POST", body: fd });
    const d = await res.json();
    setImportMsg(res.ok ? `تم استيراد ${d.imported} سؤال` : d.error);
    load();
    e.target.value = "";
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}د ${s % 60}ث`;

  if (!exam) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/exams" className="text-gray-400 hover:text-gray-600 text-sm">← الاختبارات</Link>
        <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
        <span className="text-sm text-gray-400">/ درجة الاختبار: {exam.totalScore}</span>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(["sections", "students", "results"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "sections" ? "الأقسام والأسئلة" : t === "students" ? `الطلاب (${exam.students.length})` : "النتائج"}
          </button>
        ))}
      </div>

      {tab === "sections" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-800">إضافة قسم</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/api/admin/exams/template"
                  download
                  className="text-sm text-purple-600 cursor-pointer hover:text-purple-800 border border-purple-200 rounded-xl px-3 py-1.5 bg-purple-50"
                >
                  ⬇ تحميل نموذج Excel
                </a>
                <label className="text-sm text-gray-500 cursor-pointer hover:text-purple-700 border border-gray-200 rounded-xl px-3 py-1.5">
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
                  ⬆ رفع Excel
                </label>
                {importMsg && <span className="text-xs text-teal-600">{importMsg}</span>}
              </div>
            </div>
            <form onSubmit={addSection} className="flex gap-3">
              <input
                value={secTitle} onChange={(e) => setSecTitle(e.target.value)}
                placeholder="اسم القسم" required
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number" value={secTime} onChange={(e) => setSecTime(Number(e.target.value))}
                  min={30} placeholder="الوقت (ث)"
                  className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs text-gray-400 whitespace-nowrap">ثانية</span>
              </div>
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium">
                إضافة
              </button>
            </form>
          </div>

          {exam.sections.map((sec) => (
            <div key={sec.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div
                className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setActiveSec(activeSec === sec.id ? null : sec.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-medium">
                    {sec.order}
                  </span>
                  <span className="font-medium text-gray-800">{sec.title}</span>
                  <span className="text-xs text-gray-400">{formatTime(sec.timeLimit)} · {sec.questions.length} سؤال</span>
                </div>
                <span className="text-gray-400 text-sm">{activeSec === sec.id ? "▲" : "▼"}</span>
              </div>

              {activeSec === sec.id && (
                <div className="border-t border-gray-100 p-5 space-y-4">
                  <div className="space-y-2">
                    {sec.questions.map((q) => {
                      const correct = q.choices.find((c) => c.percentage === 100);
                      return (
                        <div key={q.id} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-800">{q.order}. {q.text}</span>
                            <span className="text-xs text-gray-400">{q.score} درجة</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {q.choices.map((c) => (
                              <span
                                key={c.id}
                                className={`text-xs px-2 py-1 rounded-lg ${
                                  c.percentage === 100
                                    ? "bg-green-100 text-green-700"
                                    : c.percentage > 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {c.text} {c.percentage > 0 && c.percentage < 100 ? `(${c.percentage}%)` : ""}
                              </span>
                            ))}
                          </div>
                          {!correct && (
                            <p className="text-xs text-orange-500 mt-1">⚠ لم يحدد إجابة صحيحة (100%)</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">إضافة سؤال</h3>
                    <form onSubmit={addQuestion} className="space-y-3">
                      <div className="flex gap-3">
                        <input
                          value={qText} onChange={(e) => setQText(e.target.value)}
                          placeholder="نص السؤال" required
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <input
                          type="number" value={qScore} onChange={(e) => setQScore(Number(e.target.value))}
                          min={0.5} step={0.5} placeholder="الدرجة"
                          className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {choices.map((c, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="text-xs text-gray-400 w-4">{["أ","ب","ج","د"][i]}</span>
                            <input
                              value={c.text}
                              onChange={(e) => {
                                const n = [...choices];
                                n[i] = { ...n[i], text: e.target.value };
                                setChoices(n);
                              }}
                              placeholder={`الخيار ${["أ","ب","ج","د"][i]}`}
                              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <input
                              type="number" value={c.percentage} min={0} max={100}
                              onChange={(e) => {
                                const n = [...choices];
                                n[i] = { ...n[i], percentage: Number(e.target.value) };
                                setChoices(n);
                              }}
                              placeholder="%"
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-xs text-gray-400">%</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">100% = الإجابة الكاملة · 50% = نصف الدرجة · 0% = خطأ</p>
                      <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium">
                        إضافة السؤال
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "students" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-medium text-gray-800 mb-3">إضافة طالب للاختبار</h2>
            <form onSubmit={addStudent} className="flex gap-3">
              <input
                value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
                placeholder="رقم جوال الطالب" required dir="ltr"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium">
                إضافة
              </button>
            </form>
            {studentMsg && <p className="text-sm mt-2 text-purple-700">{studentMsg}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100">
            {exam.students.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-10">لم تضف طلاباً بعد</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {exam.students.map((es) => (
                  <div key={es.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{es.user.name || "—"}</p>
                      <p className="text-xs text-gray-400 font-mono">{es.user.phone}</p>
                    </div>
                    <button
                      onClick={() => removeStudent(es.user.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      إزالة
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "results" && (
        <div className="bg-white rounded-2xl border border-gray-100">
          {sessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">لا توجد نتائج بعد</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.user.name || s.user.phone}</p>
                    <p className="text-xs text-gray-400">{s.finishedAt ? new Date(s.finishedAt).toLocaleString("ar") : "لم ينتهِ بعد"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.totalScore !== null && (
                      <span className="text-sm font-semibold text-purple-700">
                        {s.totalScore.toFixed(1)} / {exam.totalScore}
                      </span>
                    )}
                    {s.finishedAt && (
                      <Link href={`/admin/results/${s.id}`} className="text-xs text-purple-600 hover:underline">
                        تفاصيل
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
