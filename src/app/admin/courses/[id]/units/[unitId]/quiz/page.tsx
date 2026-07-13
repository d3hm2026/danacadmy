"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Choice = { text: string; isCorrect: boolean };
type Question = { id?: string; text: string; order: number; choices: Choice[] };

const emptyQuestion = (): Question => ({
  text: "",
  order: 0,
  choices: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

export default function QuizEditPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id: courseId, unitId } = use(params);
  const router = useRouter();
  const [quizTitle, setQuizTitle] = useState("اختبار الوحدة");
  const [passingScore, setPassingScore] = useState("70");
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      const res = await fetch(`/api/admin/units/${unitId}/quiz`);
      const data = await res.json();
      if (data && data.id) {
        setQuizTitle(data.title);
        setPassingScore(String(data.passingScore));
        if (data.questions?.length > 0) {
          setQuestions(data.questions.map((q: { text: string; order: number; choices: Choice[] }) => ({
            text: q.text,
            order: q.order,
            choices: q.choices?.length === 4 ? q.choices : [
              { text: "", isCorrect: true },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ],
          })));
        }
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [unitId]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...emptyQuestion(), order: prev.length }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof Question, value: string | number) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateChoice = (qIdx: number, cIdx: number, field: keyof Choice, value: string | boolean) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              choices: q.choices.map((c, j) =>
                field === "isCorrect"
                  ? { ...c, isCorrect: j === cIdx } // radio: only one correct
                  : j === cIdx ? { ...c, text: value as string } : c
              ),
            }
          : q
      )
    );
  };

  const save = async () => {
    setSaving(true);
    await fetch(`/api/admin/units/${unitId}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: quizTitle,
        passingScore: parseFloat(passingScore),
        questions: questions.map((q, i) => ({ ...q, order: i })),
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div dir="rtl" className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;

  return (
    <div dir="rtl" className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-[#1a2e5a]">الدورات</Link>
        <span>/</span>
        <Link href={`/admin/courses/${courseId}`} className="hover:text-[#1a2e5a]">الدورة</Link>
        <span>/</span>
        <span className="text-gray-800">اختبار الوحدة</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h1 className="text-xl font-bold text-[#1a2e5a]">اختبار الوحدة</h1>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الاختبار</label>
            <input
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">درجة النجاح (%)</label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              min="0" max="100"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">السؤال {qIdx + 1}</span>
              <button
                onClick={() => removeQuestion(qIdx)}
                className="text-red-300 hover:text-red-500 text-sm"
              >
                حذف
              </button>
            </div>

            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(qIdx, "text", e.target.value)}
              placeholder="نص السؤال..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none"
            />

            <div className="space-y-2">
              <p className="text-xs text-gray-500">الخيارات (اختر الإجابة الصحيحة)</p>
              {q.choices.map((c, cIdx) => (
                <div key={cIdx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={c.isCorrect}
                    onChange={() => updateChoice(qIdx, cIdx, "isCorrect", true)}
                    className="accent-green-600"
                  />
                  <input
                    value={c.text}
                    onChange={(e) => updateChoice(qIdx, cIdx, "text", e.target.value)}
                    placeholder={`الخيار ${cIdx + 1}`}
                    className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      c.isCorrect ? "border-green-300 bg-green-50 focus:ring-green-300" : "border-gray-200 focus:ring-[#1a2e5a]"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-400 hover:border-[#1a2e5a] hover:text-[#1a2e5a] text-sm"
        >
          + إضافة سؤال جديد
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 bg-[#1a2e5a] text-white py-3 rounded-xl font-medium hover:bg-[#22397a] disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ الاختبار"}
        </button>
        <button
          onClick={() => router.push(`/admin/courses/${courseId}`)}
          className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}
