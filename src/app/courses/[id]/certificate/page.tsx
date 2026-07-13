"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type CertData = {
  eligible: boolean;
  studentName?: string;
  courseTitle?: string;
  completedAt?: string;
  done?: number;
  total?: number;
};

function StarBorder() {
  return (
    <div className="absolute inset-4 border-2 border-[#c4a052] rounded-2xl pointer-events-none" />
  );
}

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${id}/certificate`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">جارٍ التحميل...</p>
      </div>
    );
  }

  if (!data?.eligible) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm shadow">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">الشهادة غير متاحة بعد</h2>
          <p className="text-gray-500 mb-2">
            أكملت {data?.done ?? 0} من {data?.total ?? 0} درس
          </p>
          <p className="text-sm text-gray-400 mb-6">أكمل جميع دروس الدورة للحصول على الشهادة</p>
          <Link href={`/courses/${id}`} className="bg-[#1a2e5a] text-white px-6 py-2.5 rounded-xl text-sm font-medium">
            العودة للدورة
          </Link>
        </div>
      </div>
    );
  }

  const completedDate = data.completedAt
    ? new Date(data.completedAt).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .certificate-container { box-shadow: none !important; margin: 0 !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
      `}</style>

      {/* Print button - hidden on print */}
      <div className="no-print bg-gray-100 p-4 flex justify-between items-center">
        <Link href={`/courses/${id}`} className="text-sm text-gray-600 hover:text-gray-900">
          ← العودة للدورة
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-[#1a2e5a] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#22397a] flex items-center gap-2"
        >
          🖨️ طباعة الشهادة
        </button>
      </div>

      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 print:bg-white print:p-0 print:min-h-0">
        <div
          className="certificate-container bg-white rounded-3xl shadow-2xl overflow-hidden relative"
          style={{ width: "794px", minHeight: "562px" }}
          dir="rtl"
        >
          <StarBorder />

          {/* Header band */}
          <div className="bg-[#1a2e5a] px-12 py-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/logo-white.svg" alt="Dan Academy" width={64} height={64} />
              <div>
                <h2 className="text-white font-bold text-xl" style={{ fontFamily: "'Amiri', serif" }}>
                  أكاديمية دان
                </h2>
                <p className="text-[#c4a052] text-sm">Dan Academy</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-white/60 text-xs">تاريخ الإصدار</p>
              <p className="text-[#c4a052] text-sm font-medium">{completedDate}</p>
            </div>
          </div>

          {/* Certificate body */}
          <div className="px-16 py-10 text-center">
            {/* Gold decorative line */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-l from-[#c4a052] to-transparent" />
              <span className="text-[#c4a052] text-2xl">✦</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#c4a052] to-transparent" />
            </div>

            {/* Title */}
            <h1
              className="text-[#1a2e5a] font-bold mb-2"
              style={{ fontSize: "42px", fontFamily: "'Amiri', serif" }}
            >
              شهادة إتمام
            </h1>
            <p className="text-[#c4a052] text-sm tracking-widest uppercase mb-8">
              Certificate of Completion
            </p>

            <p className="text-gray-600 text-lg mb-3" style={{ fontFamily: "'Amiri', serif" }}>
              تُمنح هذه الشهادة إلى
            </p>

            {/* Student name */}
            <h2
              className="text-[#c4a052] font-bold mb-6"
              style={{ fontSize: "36px", fontFamily: "'Amiri', serif" }}
            >
              {data.studentName}
            </h2>

            <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: "'Amiri', serif" }}>
              لإتمامه/ها دورة
            </p>
            <h3
              className="text-[#1a2e5a] font-bold mb-8"
              style={{ fontSize: "26px", fontFamily: "'Amiri', serif" }}
            >
              {data.courseTitle}
            </h3>

            {/* Decorative line */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex-1 h-px bg-gradient-to-l from-[#c4a052] to-transparent" />
              <span className="text-[#c4a052] text-2xl">✦</span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#c4a052] to-transparent" />
            </div>

            {/* Signature area */}
            <div className="flex justify-around items-end">
              <div className="text-center">
                <div className="w-40 border-b-2 border-gray-300 mb-1 mx-auto" />
                <p className="text-gray-500 text-xs">توقيع المدير</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 border-2 border-[#c4a052] rounded-full flex items-center justify-center mx-auto mb-1">
                  <span className="text-[#c4a052] text-xs font-bold text-center leading-tight">
                    أكاديمية<br/>دان
                  </span>
                </div>
                <p className="text-gray-500 text-xs">الختم الرسمي</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-b-2 border-gray-300 mb-1 mx-auto" />
                <p className="text-gray-500 text-xs">تاريخ الإصدار</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
