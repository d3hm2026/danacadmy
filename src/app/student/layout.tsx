"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const typeIcon = (type: string) => {
    if (type === "success") return "✅";
    if (type === "warning") return "⚠️";
    return "ℹ️";
  };

  return (
    <div dir="rtl">
      {/* Student nav bar */}
      <nav className="bg-[#1a2e5a] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <Link href="/student" className="flex items-center gap-2">
          <Image src="/logo-white.svg" alt="Dan Academy" width={36} height={36} />
          <span className="font-bold text-sm hidden sm:block">أكاديمية دان</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Search icon */}
          <Link href="/search" className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="بحث">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </Link>

          {/* Notification bell */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="relative text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="الإشعارات"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-bold text-gray-900 text-sm">الإشعارات</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#c4a052] hover:underline">
                      تعليم الكل كمقروء
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">لا توجد إشعارات</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full text-right px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          !n.read ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-gray-900 ${!n.read ? "font-semibold" : ""}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {children}
    </div>
  );
}
