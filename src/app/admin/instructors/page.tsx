"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type User = {
  id: string;
  name: string | null;
  phone: string;
  role: string;
  createdAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  owner: "صاحب المنصة",
  admin: "مشرف",
  instructor: "معلم",
  student: "طالب",
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  instructor: "bg-green-100 text-green-700",
  student: "bg-gray-100 text-gray-600",
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [changingId, setChangingId] = useState<string | null>(null);

  const myRole = session?.user?.role ?? "";
  const myId = session?.user?.id ?? "";

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, role: string) => {
    setChangingId(userId);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    await fetchUsers();
    setChangingId(null);
  };

  const filteredUsers = filter === "all" ? users : users.filter((u) => u.role === filter);

  // What roles can the current user assign to a target
  const allowedRoles = (target: User): string[] => {
    if (target.id === myId) return []; // can't change own role
    if (target.role === "owner") return []; // can't change owner
    if (myRole === "owner") return ["admin", "instructor", "student"];
    if (myRole === "admin") {
      if (target.role === "admin") return []; // admin can't touch other admins
      return ["instructor", "student"];
    }
    return [];
  };

  const counts = {
    all: users.length,
    owner: users.filter((u) => u.role === "owner").length,
    admin: users.filter((u) => u.role === "admin").length,
    instructor: users.filter((u) => u.role === "instructor").length,
    student: users.filter((u) => u.role === "student").length,
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2e5a]">إدارة المستخدمين</h1>
        <span className="text-sm text-gray-400">{users.length} مستخدم</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", "owner", "admin", "instructor", "student"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === key ? "bg-[#1a2e5a] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {key === "all" ? "الكل" : ROLE_LABELS[key]}
            <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${filter === key ? "bg-white/20" : "bg-gray-100"}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center text-gray-400">
          لا يوجد مستخدمون في هذه الفئة
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const roles = allowedRoles(user);
            return (
              <div key={user.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a2e5a]/10 flex items-center justify-center text-[#1a2e5a] font-bold text-lg shrink-0">
                  {(user.name ?? user.phone).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900">{user.name ?? "—"}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                    {user.id === myId && (
                      <span className="text-xs text-gray-400">(أنت)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">📱 {user.phone}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    انضم في {new Date(user.createdAt).toLocaleDateString("ar-SA")}
                  </p>
                </div>

                {roles.length > 0 && (
                  <div className="shrink-0">
                    <select
                      value={user.role}
                      disabled={changingId === user.id}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] disabled:opacity-50"
                    >
                      <option value={user.role}>{ROLE_LABELS[user.role] ?? user.role}</option>
                      {roles.filter((r) => r !== user.role).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    {changingId === user.id && (
                      <span className="text-xs text-gray-400 mr-2">جارٍ...</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
