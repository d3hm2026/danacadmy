"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";

type Enrollment = {
  id: string;
  status: string;
  enrolledAt: string;
  user: { id: string; name: string | null; phone: string };
};

const STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "مقبول",        color: "bg-green-100 text-green-700"  },
  rejected: { label: "مرفوض",        color: "bg-red-100 text-red-700"      },
};

export default function InstructorCourseEnrollmentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/instructor/courses/${id}/enrollments`);
    setEnrollments(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatus(enrollmentId: string, status: "approved" | "rejected") {
    setActionId(enrollmentId);
    await fetch(`/api/instructor/courses/${id}/enrollments/${enrollmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
    setActionId(null);
  }

  const filtered = enrollments.filter((e) => e.status === filter);
  const counts = {
    pending:  enrollments.filter((e) => e.status === "pending").length,
    approved: enrollments.filter((e) => e.status === "approved").length,
    rejected: enrollments.filter((e) => e.status === "rejected").length,
  };

  return (
    <div dir="rtl">
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href={`/instructor/courses/${id}`} className="text-sm text-gray-500 hover:text-gray-700">← إدارة الدورة</Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-semibold text-[#1a2e5a] border-b-2 border-[#1a2e5a] pb-0.5">طلبات الانتساب</span>
        <Link href={`/instructor/courses/${id}/stats`} className="text-sm text-gray-500 hover:text-gray-700">الإحصائيات</Link>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">طلبات الانتساب</h1>
        {counts.pending > 0 && (
          <span className="bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-1.5 rounded-xl">
            {counts.pending} طلب بانتظار الموافقة
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-5">
        {(["pending","approved","rejected"] as const).map((key) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === key ? "bg-[#1a2e5a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {STATUS[key].label}
            <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${filter === key ? "bg-white/20" : "bg-gray-100"}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <p className="text-gray-400">لا توجد طلبات في هذه الحالة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-gray-900">{e.user.name || "—"}</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS[e.status].color}`}>
                    {STATUS[e.status].label}
                  </span>
                </div>
                <div className="flex gap-5 text-sm text-gray-500">
                  <span>📱 {e.user.phone}</span>
                  <span>📅 {new Date(e.enrolledAt).toLocaleDateString("ar-SA")}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {e.status === "pending" && (
                  <>
                    <button onClick={() => handleStatus(e.id, "approved")} disabled={actionId !== null}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white px-4 py-2 rounded-xl text-sm font-medium">
                      {actionId === e.id ? "..." : "قبول"}
                    </button>
                    <button onClick={() => handleStatus(e.id, "rejected")} disabled={actionId !== null}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white px-4 py-2 rounded-xl text-sm font-medium">
                      رفض
                    </button>
                  </>
                )}
                {e.status === "approved" && (
                  <button onClick={() => handleStatus(e.id, "rejected")} disabled={actionId !== null}
                    className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2 rounded-xl text-sm">
                    إلغاء الموافقة
                  </button>
                )}
                {e.status === "rejected" && (
                  <button onClick={() => handleStatus(e.id, "approved")} disabled={actionId !== null}
                    className="bg-gray-100 hover:bg-green-50 hover:text-green-600 text-gray-600 px-4 py-2 rounded-xl text-sm">
                    قبول
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
