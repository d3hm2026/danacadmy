"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface Choice { id: string; text: string; }
interface Question { id: string; text: string; score: number; order: number; choices: Choice[]; }
interface Section { id: string; title: string; order: number; timeLimit: number; questions: Question[]; }

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [finalSessionId, setFinalSessionId] = useState("");
  const startTimeRef = useRef<number>(Date.now());

  const loadSection = useCallback(async (sid: string, idx: number) => {
    const res = await fetch(`/api/exam/${id}/section/${idx}`);
    if (!res.ok) { setError("لا يوجد قسم"); return; }
    const data: Section = await res.json();
    setSection(data);
    setTimeLeft(data.timeLimit);
    setAnswers({});
    startTimeRef.current = Date.now();
    setSessionId(sid);
  }, [id]);

  useEffect(() => {
    async function start() {
      const res = await fetch(`/api/exam/${id}/start`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "حدث خطأ");
        return;
      }
      const data = await res.json();
      await fetch(`/api/exam/${id}/sections-count`).then(r => r.json()).then(d => setTotalSections(d.count));
      await loadSection(data.sessionId, data.currentSection);
    }
    start();
  }, [id, loadSection]);

  useEffect(() => {
    if (!section || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          submitSection(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  async function submitSection(auto = false) {
    if (submitting || !section || !sessionId) return;
    setSubmitting(true);

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const answersList = section.questions.map((q) => ({
      questionId: q.id,
      choiceId: answers[q.id] || null,
    }));

    const res = await fetch(`/api/exam/${id}/submit-section`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        sectionId: section.id,
        answers: answersList,
        timeSpent,
      }),
    });

    const data = await res.json();

    if (data.finished) {
      setFinished(true);
      setFinalSessionId(data.sessionId);
    } else {
      const nextIdx = sectionIndex + 1;
      setSectionIndex(nextIdx);
      await loadSection(sessionId, nextIdx);
    }
    setSubmitting(false);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button onClick={() => router.push("/student")} className="text-purple-600 hover:underline text-sm">
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">انتهى الاختبار</h2>
          <p className="text-gray-500 text-sm mb-6">تم تسليم إجاباتك بنجاح</p>
          <button
            onClick={() => router.push("/student")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl text-sm"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-gray-400">جاري تحميل الاختبار...</div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / section.questions.length) * 100;
  const isUrgent = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">{section.title}</span>
            {totalSections > 0 && (
              <span className="text-xs text-gray-400">
                {sectionIndex + 1} / {totalSections}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 font-mono font-medium text-lg ${isUrgent ? "text-red-600" : "text-gray-700"}`}>
            {isUrgent && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
        {section.questions.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex justify-between mb-3">
              <p className="text-gray-900 font-medium leading-relaxed">{q.order}. {q.text}</p>
              <span className="text-xs text-gray-400 shrink-0 mr-3">{q.score} د</span>
            </div>
            <div className="space-y-2">
              {q.choices.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
                  className={`w-full text-right px-4 py-3 rounded-xl border text-sm transition-all ${
                    answers[q.id] === c.id
                      ? "bg-purple-50 border-purple-400 text-purple-800 font-medium"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  {c.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500">
            {answeredCount} / {section.questions.length} سؤال
          </span>
          <button
            onClick={() => submitSection(false)}
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium px-8 py-2.5 rounded-xl text-sm"
          >
            {submitting ? "جاري الحفظ..." : "الانتقال للقسم التالي ←"}
          </button>
        </div>
      </div>
    </div>
  );
}
