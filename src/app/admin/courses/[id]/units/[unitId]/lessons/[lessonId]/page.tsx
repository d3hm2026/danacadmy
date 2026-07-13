"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Lesson = {
  id: string;
  title: string;
  type: string;
  videoUrl: string | null;
  fileUrl: string | null;
  fileTitle: string | null;
  textContent: string | null;
  duration: number | null;
  isRequired: boolean;
};

export default function LessonEditPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string; lessonId: string }>;
}) {
  const { id: courseId, unitId, lessonId } = use(params);
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [duration, setDuration] = useState("");
  const [isRequired, setIsRequired] = useState(true);

  useEffect(() => {
    // We fetch the lesson from the course endpoint since there's no direct lesson GET
    const fetchLesson = async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      const course = await res.json();
      const unit = course.units?.find((u: { id: string }) => u.id === unitId);
      const l = unit?.lessons?.find((l: { id: string }) => l.id === lessonId);
      if (l) {
        setLesson(l);
        setTitle(l.title);
        setType(l.type);
        setVideoUrl(l.videoUrl ?? "");
        setFileUrl(l.fileUrl ?? "");
        setFileTitle(l.fileTitle ?? "");
        setTextContent(l.textContent ?? "");
        setDuration(l.duration ? String(Math.round(l.duration / 60)) : "");
        setIsRequired(l.isRequired);
      }
      setLoading(false);
    };
    fetchLesson();
  }, [courseId, unitId, lessonId]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/admin/lessons/${lessonId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        videoUrl: type === "video" ? videoUrl || null : null,
        fileUrl: type === "pdf" ? fileUrl || null : null,
        fileTitle: type === "pdf" ? fileTitle || null : null,
        textContent: type === "text" ? textContent || null : null,
        duration: type === "video" && duration ? parseInt(duration) * 60 : null,
        isRequired,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div dir="rtl" className="text-center py-16 text-gray-400">جارٍ التحميل...</div>;
  if (!lesson) return <div dir="rtl" className="text-center py-16 text-red-400">لم يتم العثور على الدرس</div>;

  return (
    <div dir="rtl" className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-[#1a2e5a]">الدورات</Link>
        <span>/</span>
        <Link href={`/admin/courses/${courseId}`} className="hover:text-[#1a2e5a]">الدورة</Link>
        <span>/</span>
        <span className="text-gray-800">تعديل الدرس</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h1 className="text-xl font-bold text-[#1a2e5a]">تعديل الدرس</h1>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الدرس *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع الدرس</label>
          <div className="flex gap-2">
            {["video", "pdf", "text"].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  type === t
                    ? "bg-[#1a2e5a] text-white border-[#1a2e5a]"
                    : "border-gray-200 text-gray-600 hover:border-[#1a2e5a]"
                }`}
              >
                {t === "video" ? "🎬 فيديو" : t === "pdf" ? "📄 PDF" : "📝 نص"}
              </button>
            ))}
          </div>
        </div>

        {/* Video fields */}
        {type === "video" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رابط الفيديو</label>
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... أو رابط مباشر للفيديو"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
              />
              <p className="text-xs text-gray-400 mt-1">يدعم روابط YouTube ورابط الفيديو المباشر (.mp4)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المدة (بالدقائق)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="مثال: 15"
                min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
              />
            </div>
          </div>
        )}

        {/* PDF fields */}
        {type === "pdf" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رابط الملف (PDF)</label>
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم الملف</label>
              <input
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                placeholder="مثال: المحاضرة الأولى.pdf"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a]"
              />
            </div>
          </div>
        )}

        {/* Text fields */}
        {type === "text" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">محتوى الدرس</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={10}
              placeholder="اكتب محتوى الدرس هنا..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e5a] resize-none"
            />
          </div>
        )}

        {/* Is Required */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="w-4 h-4 accent-[#1a2e5a]"
          />
          <span className="text-sm text-gray-700">إجباري (يجب إكماله قبل الانتقال للتالي)</span>
        </label>

        {/* Save */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-[#1a2e5a] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#22397a] disabled:opacity-50"
          >
            {saving ? "جارٍ الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ التغييرات"}
          </button>
          <button
            onClick={() => router.push(`/admin/courses/${courseId}`)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}
