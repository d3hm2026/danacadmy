"use client";
import { useEffect, useState } from "react";

type Request = {
  id: string;
  phone: string;
  name: string;
  school: string;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "مقبول", color: "bg-green-100 text-green-700" },
  rejected: { label: "مرفوض", color: "bg-red-100 text-red-700" },
};

export default function RegistrationsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/registrations");
    const data = await res.json();
    setRequests(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id + action);
    await fetch(`/api/admin/registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("هل تريد حذف هذا الطلب؟")) return;
    setActionLoading(id + "delete");
    await fetch(`/api/admin/registrations/${id}`, { method: "DELETE" });
    await load();
    setActionLoading(null);
  }

  const filtered = requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">طلبات التسجيل</h1>
          <p className="text-gray-500 text-sm mt-1">راجع وأدر طلبات تسجيل الطلاب الجديدة</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-700 font-semibold px-4 py-2 rounded-xl text-sm">
            {pendingCount} طلب بانتظار المراجعة
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "pending", label: "قيد الانتظار" },
          { key: "approved", label: "مقبول" },
          { key: "rejected", label: "مرفوض" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-[#1a2e5a] text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${filter === tab.key ? "bg-white/20" : "bg-gray-100"}`}>
              {requests.filter((r) => r.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-400">لا توجد طلبات في هذه الحالة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{req.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_LABEL[req.status]?.color}`}>
                      {STATUS_LABEL[req.status]?.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                    <span>📱 {req.phone}</span>
                    <span>🏫 {req.school}</span>
                    <span>📅 {new Date(req.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {req.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, "approve")}
                        disabled={actionLoading !== null}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        {actionLoading === req.id + "approve" ? "..." : "قبول"}
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "reject")}
                        disabled={actionLoading !== null}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        {actionLoading === req.id + "reject" ? "..." : "رفض"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(req.id)}
                    disabled={actionLoading !== null}
                    className="bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-600 px-3 py-2 rounded-xl text-sm transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
