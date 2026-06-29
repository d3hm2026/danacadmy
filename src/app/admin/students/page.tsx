"use client";
import { useEffect, useState } from "react";

interface Student {
  id: string;
  phone: string;
  name: string | null;
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/students");
    setStudents(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, password }),
    });
    if (res.ok) {
      setMsg("تم إضافة الطالب");
      setPhone(""); setName(""); setPassword("");
      load();
    } else {
      const d = await res.json();
      setMsg(d.error || "حدث خطأ");
    }
    setLoading(false);
  }

  async function deleteStudent(id: string) {
    if (!confirm("حذف الطالب؟")) return;
    await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">إدارة الطلاب</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-medium text-gray-800 mb-4">إضافة طالب جديد</h2>
        <form onSubmit={addStudent} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الجوال" required dir="ltr"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="الاسم (اختياري)"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور" type="text" required
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit" disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 py-2 text-sm font-medium"
          >
            إضافة
          </button>
        </form>
        {msg && <p className="text-sm mt-2 text-purple-700">{msg}</p>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">الطلاب ({students.length})</h2>
        </div>
        {students.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10">لا يوجد طلاب</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {students.map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.name || "—"}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.phone}</p>
                </div>
                <button
                  onClick={() => deleteStudent(s.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
