"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Choice = { id: string; text: string; isCorrect: boolean };
type Question = { id: string; text: string; order: number; choices: Choice[] };
type Quiz = { id: string; title: string; passingScore: number; questions: Question[] };

type AttemptResult = {
  score: number;
  passed: boolean;
  results: { questionId: string; selectedChoiceId: string; correctChoiceId: string; isCorrect: boolean }[];
};

export default function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id: courseId, quizId } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [pastAttempts, setPastAttempts] = useState<{ id: string; score: number; passed: boolean; completedAt: string }[]>([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      // Fetch via admin endpoint since there's no public quiz GET; use course endpoint
      const [courseRes, attemptsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/quiz/${quizId}/attempts`),
      ]);
      const courseData = await courseRes.json();
      const attemptsData = await attemptsRes.json();

      // Find quiz in course units
      for (const unit of courseData.units ?? []) {
        if (unit.quiz?.id === quizId) {
          // We need questions - fetch from admin quiz endpoint
          const qRes = await fetch(`/api/admin/units/${unit.id}/quiz`);
          const qData = await qRes.json();
          setQuiz(qData);
          break;
        }
      }

      setPastAttempts(attemptsData);
      setLoading(false);
    };
    fetchQuiz();
  }, [courseId, quizId]);

  const handleSubmit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      alert(`يرجى الإجابة على جميع الأسئلة (${unanswered.length} سؤال متبقي)`);
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/quiz/${quizId}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
  };

  if (loading) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;
  if (!quiz) return <div dir="rtl" className="min-h-screen flex items-center justify-center text-red-400">لم يتم العثور على الاختبار</div>;

  const sortedQuestions = [...quiz.questions].sort((a, b) => a.order - b.order);

  // Results view
  if (result) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Result header */}
          <div className={`rounded-2xl p-8 text-center ${result.passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="text-6xl mb-4">{result.passed ? "🎉" : "😔"}</div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: result.passed ? "#16a34a" : "#dc2626" }}>
              {result.passed ? "أحسنت! اجتزت الاختبار" : "لم تجتز الاختبار"}
            </h1>
            <p className="text-4xl font-bold my-4" style={{ color: result.passed ? "#16a34a" : "#dc2626" }}>
              {result.score.toFixed(0)}%
            </p>
            <p className="text-gray-500">درجة النجاح: {quiz.passingScore}%</p>
          </div>

          {/* Question review */}
          <div className="space-y-4">
            <h2 className="font-bold text-[#1a2e5a] text-lg">مراجعة الإجابات</h2>
            {sortedQuestions.map((q, idx) => {
              const r = result.results.find((r) => r.questionId === q.id);
              return (
                <div key={q.id} className={`bg-white rounded-2xl border p-5 ${r?.isCorrect ? "border-green-200" : "border-red-200"}`}>
                  <p className="font-medium text-gray-800 mb-3">
                    <span className="text-gray-400 ml-2">{idx + 1}.</span>
                    {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.choices.map((c) => {
                      const isSelected = r?.selectedChoiceId === c.id;
                      const isCorrect = c.isCorrect;
                      let cls = "border-gray-200 text-gray-700";
                      if (isCorrect) cls = "border-green-400 bg-green-50 text-green-800";
                      else if (isSelected && !isCorrect) cls = "border-red-400 bg-red-50 text-red-700";
                      return (
                        <div key={c.id} className={`border rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 ${cls}`}>
                          {isCorrect && <span>✓</span>}
                          {isSelected && !isCorrect && <span>✗</span>}
                          {c.text}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!result.passed && (
              <button
                onClick={handleRetry}
                className="flex-1 bg-[#1a2e5a] text-white py-3 rounded-xl font-medium"
              >
                إعادة المحاولة
              </button>
            )}
            {result.passed && (
              <button
                onClick={() => router.push(`/courses/${courseId}`)}
                className="flex-1 bg-[#c4a052] text-white py-3 rounded-xl font-medium"
              >
                متابعة الدورة ←
              </button>
            )}
            <Link
              href={`/courses/${courseId}`}
              className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 text-center"
            >
              العودة للدورة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/courses/${courseId}`} className="text-gray-500 text-sm hover:text-[#1a2e5a]">
            ← العودة للدورة
          </Link>
          <div className="text-sm text-gray-500">
            درجة النجاح: {quiz.passingScore}%
          </div>
        </div>

        <div className="bg-[#1a2e5a] text-white rounded-2xl p-6">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-white/70 text-sm mt-1">{sortedQuestions.length} سؤال</p>
        </div>

        {/* Past attempts */}
        {pastAttempts.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">المحاولات السابقة:</p>
            {pastAttempts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                <span className={a.passed ? "text-green-600" : "text-red-500"}>
                  {a.passed ? "✓ نجاح" : "✗ رسوب"} — {a.score.toFixed(0)}%
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(a.completedAt).toLocaleDateString("ar")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Questions */}
        {sortedQuestions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <p className="font-semibold text-gray-900">
              <span className="text-gray-400 ml-2">{idx + 1}.</span>
              {q.text}
            </p>
            <div className="space-y-2">
              {q.choices.map((c) => {
                const selected = answers[q.id] === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
                    className={`w-full text-right px-4 py-3 rounded-xl border text-sm transition-colors ${
                      selected
                        ? "border-[#1a2e5a] bg-[#1a2e5a]/5 text-[#1a2e5a] font-medium"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {c.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Submit */}
        <div className="pb-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#1a2e5a] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#22397a] disabled:opacity-50"
          >
            {submitting ? "جارٍ التصحيح..." : "تسليم الاختبار"}
          </button>
          <p className="text-center text-xs text-gray-400 mt-2">
            {Object.keys(answers).length} / {sortedQuestions.length} سؤال تمت الإجابة عليه
          </p>
        </div>
      </div>
    </div>
  );
}
