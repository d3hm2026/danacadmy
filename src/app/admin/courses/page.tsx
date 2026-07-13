"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Course = {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  _count: { units: number; enrollments: number };
  units: { _count: { lessons: number } }[];
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/courses");
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const togglePublish = async (id: string, current: boolean) => {
    await fetch(`/api/admin/courses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    fetchCourses();
  };

  const totalLessons = (c: Course) => c.units.reduce((s, u) => s + u._count.lessons, 0);

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a2e5a]">الدورات التدريبية</h1>
        <Link
          href="/admin/courses/new"
          className="bg-[#1a2e5a] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#22397a]"
        >
          + إنشاء دورة جديدة
        </Link>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">جارٍ التحميل...</div>
      )}

      {!loading && courses.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
          لا توجد دورات بعد
        </div>
      )}

      <div className="grid gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 text-lg truncate">{course.title}</h2>
              {course.description && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{course.description}</p>
              )}
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span>{course._count.units} وحدة</span>
                <span>{totalLessons(course)} درس</span>
                <span>{course._count.enrollments} طالب مسجّل</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => togglePublish(course.id, course.isPublished)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  course.isPublished
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {course.isPublished ? "منشور" : "مسودة"}
              </button>
              <Link
                href={`/admin/courses/${course.id}`}
                className="bg-[#c4a052] text-white text-xs px-3 py-1.5 rounded-xl hover:bg-[#b38e3f]"
              >
                إدارة
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
