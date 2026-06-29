"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Choice { id: string; text: string; percentage: number; }
interface Question { id: string; text: string; score: number; choices: Choice[]; }
interface Answer {
  id: string;
  score: number;
  question: Question;
  choice: Choice | null;
  section: { title: string; order: number };
}
interface SectionTime { sectionId: string; timeSpent: number; }
interface SessionData {
  id: string;
  startedAt: string;
  finishedAt: string;
  totalScore: number;
  user: { name: string | null; phone: string };
  exam: { title: string; totalScore: number };
  answers: Answer[];
  sectionTimes: SectionTime[];
}

export default function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [data, setData] = useState<SessionData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/results/${sessionId}`)
      .then((r) => r.json())
      .then(setData);
  }, [sessionId]);

  function handlePrint() {
    window.print();
  }

  if (!data) return <div className="text-gray-400 text-center py-20">جاري التحميل...</div>;

  const bySection = data.answers.reduce<Record<string, { title: string; order: number; answers: Answer[] }>>(
    (acc, a) => {
      const key = a.section.order.toString();
      if (!acc[key]) acc[key] = { title: a.section.title, order: a.section.order, answers: [] };
      acc[key].answers.push(a);
      return acc;
    },
    {}
  );

  const sections = Object.values(bySection).sort((a, b) => a.order - b.order);
  const correct = data.answers.filter((a) => a.choice?.percentage === 100).length;
  const partial = data.answers.filter((a) => a.choice && a.choice.percentage > 0 && a.choice.percentage < 100).length;
  const wrong = data.answers.filter((a) => !a.choice || a.choice.percentage === 0).length;

  const formatTime = (s: number) => `${Math.floor(s / 60)}د ${s % 60}ث`;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { direction: rtl; }
          .print-page { padding: 20px; }
        }
      `}</style>

      <div className="space-y-5 print-page" ref={printRef}>
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 text-sm">← الرئيسية</Link>
            <h1 className="text-xl font-semibold text-gray-900">نتيجة الطالب</h1>
          </div>
          <button
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl"
          >
            طباعة / PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{data.user.name || data.user.phone}</h2>
              <p className="text-sm text-gray-400 font-mono">{data.user.phone}</p>
              <p className="text-sm text-gray-600 mt-1">{data.exam.title}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(data.startedAt).toLocaleString("ar")} ← {new Date(data.finishedAt).toLocaleString("ar")}
              </p>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold text-purple-700">{data.totalScore.toFixed(1)}</p>
              <p className="text-sm text-gray-400">من {data.exam.totalScore}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{correct}</p>
              <p className="text-xs text-green-600">صحيح</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">{partial}</p>
              <p className="text-xs text-yellow-600">جزئي</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-700">{wrong}</p>
              <p className="text-xs text-red-600">خطأ / لم يجب</p>
            </div>
          </div>
        </div>

        {sections.map((sec) => {
          const st = data.sectionTimes.find((_, i) => i === sec.order - 1);
          return (
            <div key={sec.order} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-medium">
                    {sec.order}
                  </span>
                  <span className="font-medium text-gray-800">{sec.title}</span>
                </div>
                {st && <span className="text-xs text-gray-400">الوقت: {formatTime(st.timeSpent)}</span>}
              </div>

              <div className="divide-y divide-gray-50">
                {sec.answers.map((a) => {
                  const isCorrect = a.choice?.percentage === 100;
                  const isPartial = a.choice && a.choice.percentage > 0 && a.choice.percentage < 100;
                  const correctChoice = a.question.choices.find((c) => c.percentage === 100);

                  return (
                    <div key={a.id} className="px-5 py-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-800 leading-relaxed">{a.question.text}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mr-3 ${
                          isCorrect ? "bg-green-100 text-green-700"
                          : isPartial ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-600"
                        }`}>
                          {a.score.toFixed(1)} / {a.question.score}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 text-sm">
                        {a.choice ? (
                          <p className={`${
                            isCorrect ? "text-green-700" : isPartial ? "text-yellow-700" : "text-red-600"
                          }`}>
                            إجابة الطالب: {a.choice.text}
                            {isPartial && ` (${a.choice.percentage}%)`}
                          </p>
                        ) : (
                          <p className="text-gray-400">لم يجب</p>
                        )}
                        {!isCorrect && correctChoice && (
                          <p className="text-green-600">الإجابة الصحيحة: {correctChoice.text}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="text-center text-xs text-gray-300 py-4 print:block hidden">
          أكاديمية دان · منصة الاختبارات الذكية
        </div>
      </div>
    </>
  );
}
