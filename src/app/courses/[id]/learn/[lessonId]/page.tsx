"use client";

import { useEffect, useRef, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: { name: string | null; phone: string };
};

type LessonProgress = { completed: boolean; watchedSeconds: number };
type Lesson = {
  id: string;
  title: string;
  type: string;
  order: number;
  videoUrl: string | null;
  fileUrl: string | null;
  fileTitle: string | null;
  textContent: string | null;
  duration: number | null;
  isRequired: boolean;
  progress: LessonProgress[];
};
type Unit = {
  id: string;
  title: string;
  order: number;
  quiz: { id: string; title: string } | null;
  lessons: Lesson[];
};
type Course = { id: string; title: string; units: Unit[] };

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export default function LearnPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [nextQuizId, setNextQuizId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Video anti-skip state
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxWatchedRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    const [courseRes, progressRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      fetch(`/api/lessons/${lessonId}/progress`),
    ]);
    const courseData: Course = await courseRes.json();
    const progressData: LessonProgress = await progressRes.json();

    setCourse(courseData);

    // Find the lesson across all units
    let found: Lesson | null = null;
    for (const unit of courseData.units) {
      const l = unit.lessons.find((l) => l.id === lessonId);
      if (l) { found = l; break; }
    }
    setLesson(found);
    setCompleted(progressData.completed);
    maxWatchedRef.current = progressData.watchedSeconds ?? 0;
    setLoading(false);

    // Calculate next lesson / quiz
    computeNext(courseData, lessonId);
  }, [courseId, lessonId]);

  const computeNext = (courseData: Course, currentLessonId: string) => {
    const sortedUnits = [...courseData.units].sort((a, b) => a.order - b.order);
    let found = false;
    let nextLesson: string | null = null;
    let nextQuiz: string | null = null;
    let foundUnit: Unit | null = null;

    outer: for (const unit of sortedUnits) {
      const sortedLessons = [...unit.lessons].sort((a, b) => a.order - b.order);
      for (let i = 0; i < sortedLessons.length; i++) {
        if (found) {
          nextLesson = sortedLessons[i].id;
          foundUnit = unit;
          break outer;
        }
        if (sortedLessons[i].id === currentLessonId) {
          found = true;
          // Check if it's the last lesson in the unit
          if (i === sortedLessons.length - 1) {
            // After this unit's lessons: show quiz if exists
            if (unit.quiz) {
              nextQuiz = unit.quiz.id;
              foundUnit = unit;
              break outer;
            }
            // else continue to next unit
          }
        }
      }
    }

    setNextLessonId(nextLesson);
    setNextQuizId(nextQuiz);
    void foundUnit; // suppress unused warning
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (textReadTimerRef.current) clearTimeout(textReadTimerRef.current);
    };
  }, [fetchData]);

  const saveProgress = useCallback(async (watchedSeconds: number, isCompleted: boolean) => {
    await fetch(`/api/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watchedSeconds, completed: isCompleted }),
    });
    if (isCompleted) setCompleted(true);
  }, [lessonId]);

  const markComplete = useCallback(async () => {
    await saveProgress(maxWatchedRef.current, true);
    setCompleted(true);
  }, [saveProgress]);

  // Video setup
  useEffect(() => {
    if (!lesson || lesson.type !== "video" || !lesson.videoUrl || isYouTube(lesson.videoUrl)) return;
    const video = videoRef.current;
    if (!video) return;

    // Restore position
    if (maxWatchedRef.current > 5) {
      video.currentTime = maxWatchedRef.current;
    }

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      if (cur > maxWatchedRef.current) {
        maxWatchedRef.current = cur;
      }
    };

    const handleSeeking = () => {
      if (video.currentTime > maxWatchedRef.current + 1) {
        video.currentTime = maxWatchedRef.current;
      }
    };

    const handleEnded = async () => {
      maxWatchedRef.current = video.duration;
      await saveProgress(Math.round(video.duration), true);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeking", handleSeeking);
    video.addEventListener("ended", handleEnded);

    // Auto-save every 10 seconds
    saveTimerRef.current = setInterval(() => {
      if (!video.paused) {
        saveProgress(Math.round(maxWatchedRef.current), false);
      }
    }, 10000);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeking", handleSeeking);
      video.removeEventListener("ended", handleEnded);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [lesson, saveProgress]);

  // Text lesson: auto-complete after 5 seconds
  useEffect(() => {
    if (!lesson || lesson.type !== "text" || completed) return;
    textReadTimerRef.current = setTimeout(() => {
      markComplete();
    }, 5000);
    return () => { if (textReadTimerRef.current) clearTimeout(textReadTimerRef.current); };
  }, [lesson, completed, markComplete]);

  const handleNext = () => {
    if (nextQuizId) {
      router.push(`/courses/${courseId}/quiz/${nextQuizId}`);
    } else if (nextLessonId) {
      router.push(`/courses/${courseId}/learn/${nextLessonId}`);
    } else {
      router.push(`/courses/${courseId}`);
    }
  };

  if (loading || !lesson || !course) {
    return <div dir="rtl" className="min-h-screen flex items-center justify-center text-gray-400">جارٍ التحميل...</div>;
  }

  const sortedUnits = [...course.units].sort((a, b) => a.order - b.order);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="bg-[#1a2e5a] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            ☰
          </button>
          <Link href={`/courses/${courseId}`} className="text-white/70 hover:text-white text-sm">
            ← {course.title}
          </Link>
        </div>
        <h1 className="text-sm font-medium truncate max-w-xs">{lesson.title}</h1>
        {completed && (
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">✓ مكتمل</span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "block" : "hidden"} lg:block w-72 bg-[#12203f] text-white overflow-y-auto shrink-0`}
        >
          <div className="p-3 space-y-2">
            {sortedUnits.map((unit) => (
              <div key={unit.id}>
                <p className="text-xs text-white/50 uppercase font-bold px-2 py-1">{unit.title}</p>
                {[...unit.lessons].sort((a, b) => a.order - b.order).map((l) => {
                  const isActive = l.id === lessonId;
                  const isDone = l.progress[0]?.completed;
                  return (
                    <Link
                      key={l.id}
                      href={`/courses/${courseId}/learn/${l.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-[#c4a052] text-white"
                          : "text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-base shrink-0">
                        {isDone ? "✅" : l.type === "video" ? "🎬" : l.type === "pdf" ? "📄" : "📝"}
                      </span>
                      <span className="truncate">{l.title}</span>
                    </Link>
                  );
                })}
                {unit.quiz && (
                  <Link
                    href={`/courses/${courseId}/quiz/${unit.quiz.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-300 hover:bg-white/10"
                  >
                    <span>📝</span>
                    <span className="truncate">{unit.quiz.title}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-900">
          {/* Video lesson */}
          {lesson.type === "video" && lesson.videoUrl && (
            <div>
              {isYouTube(lesson.videoUrl) ? (
                <YouTubePlayer
                  videoId={getYouTubeId(lesson.videoUrl) ?? ""}
                  initialSeconds={maxWatchedRef.current}
                  onProgress={(s) => { maxWatchedRef.current = s; }}
                  onComplete={() => saveProgress(maxWatchedRef.current, true)}
                  lessonId={lessonId}
                  saveProgress={saveProgress}
                />
              ) : (
                <div className="relative bg-black">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    ref={videoRef}
                    src={lesson.videoUrl}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full max-h-[70vh] object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* PDF lesson */}
          {lesson.type === "pdf" && (
            <div className="p-4 space-y-4">
              {lesson.fileUrl ? (
                <div className="bg-white rounded-2xl overflow-hidden">
                  <iframe
                    src={lesson.fileUrl}
                    className="w-full h-[70vh]"
                    title={lesson.fileTitle ?? lesson.title}
                  />
                </div>
              ) : (
                <div className="bg-gray-800 rounded-2xl p-8 text-center text-gray-400">
                  لم يتم رفع الملف بعد
                </div>
              )}
              {!completed && (
                <PDFCompleteButton onComplete={markComplete} />
              )}
            </div>
          )}

          {/* Text lesson */}
          {lesson.type === "text" && (
            <div className="p-6 max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-[#1a2e5a] mb-6">{lesson.title}</h2>
                <div className="prose prose-lg max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {lesson.textContent ?? "لا يوجد محتوى"}
                </div>
                {!completed && (
                  <p className="mt-6 text-sm text-gray-400 text-center">سيتم وضع علامة المكتمل تلقائياً بعد القراءة...</p>
                )}
              </div>
            </div>
          )}

          {/* Bottom actions */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div>
                {completed && (
                  <span className="text-green-400 text-sm font-medium">✓ تم إكمال هذا الدرس</span>
                )}
                {!completed && lesson.type !== "video" && (
                  <button
                    onClick={markComplete}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    تعليم كمكتمل
                  </button>
                )}
              </div>
              <button
                onClick={handleNext}
                disabled={!completed}
                className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  completed
                    ? "bg-[#c4a052] text-white hover:bg-[#b38e3f]"
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
              >
                {nextQuizId ? "الاختبار ←" : nextLessonId ? "الدرس التالي ←" : "إنهاء الدورة ←"}
              </button>
            </div>
          </div>

          {/* Comments section */}
          <div className="bg-gray-50 border-t border-gray-700">
            <CommentsSection lessonId={lessonId} />
          </div>
        </main>
      </div>
    </div>
  );
}

// Comments section
function CommentsSection({ lessonId }: { lessonId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/comments`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setComments(d); });
  }, [lessonId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/lessons/${lessonId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setText("");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6" dir="rtl">
      <h3 className="font-bold text-gray-800 mb-4 text-lg">الأسئلة والتعليقات</h3>

      {/* Comment list */}
      <div className="space-y-3 mb-6">
        {comments.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">لا توجد تعليقات بعد. كن أول من يعلّق!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900 text-sm">{c.user.name || c.user.phone}</span>
              <span className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleDateString("ar-SA")}
              </span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Add comment */}
      <form onSubmit={submit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب سؤالك أو تعليقك..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-[#1a2e5a] bg-white"
          rows={3}
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="bg-[#1a2e5a] text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "جارٍ الإرسال..." : "إرسال التعليق"}
        </button>
      </form>
    </div>
  );
}

// YouTube player with anti-skip overlay
function YouTubePlayer({
  videoId,
  initialSeconds,
  onProgress,
  onComplete,
  lessonId,
  saveProgress,
}: {
  videoId: string;
  initialSeconds: number;
  onProgress: (s: number) => void;
  onComplete: () => void;
  lessonId: string;
  saveProgress: (s: number, completed: boolean) => Promise<void>;
}) {
  const playerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxWatched = useRef(initialSeconds);
  const playerObj = useRef<{ getCurrentTime: () => number; seekTo: (s: number, a: boolean) => void; getDuration: () => number } | null>(null);
  const containerId = `yt-player-${lessonId}`;

  useEffect(() => {
    const loadYT = () => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      } else {
        initPlayer();
      }
    };

    const initPlayer = () => {
      if (!window.YT?.Player) { setTimeout(initPlayer, 500); return; }
      playerObj.current = new window.YT.Player(containerId, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(initialSeconds),
        },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) { // playing
              // Start monitoring
              playerRef.current = setInterval(() => {
                if (!playerObj.current) return;
                const cur = playerObj.current.getCurrentTime();
                const dur = playerObj.current.getDuration();
                // Anti-skip: if jumped more than 5 seconds ahead
                if (cur > maxWatched.current + 5) {
                  playerObj.current.seekTo(maxWatched.current, true);
                  return;
                }
                if (cur > maxWatched.current) maxWatched.current = cur;
                onProgress(cur);
                // Auto-save every 10s (approximate)
                if (Math.round(cur) % 10 === 0) {
                  saveProgress(Math.round(cur), false);
                }
                // Complete at 90%
                if (dur > 0 && cur / dur >= 0.9) {
                  maxWatched.current = dur;
                  onComplete();
                  clearInterval(playerRef.current!);
                }
              }, 1000);
            } else {
              if (playerRef.current) clearInterval(playerRef.current);
            }
          },
        },
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).onYouTubeIframeAPIReady = initPlayer;
    loadYT();

    return () => {
      if (playerRef.current) clearInterval(playerRef.current);
    };
  }, [videoId, containerId, initialSeconds, onProgress, onComplete, saveProgress]);

  return (
    <div className="relative bg-black w-full" style={{ paddingTop: "56.25%" }}>
      <div id={containerId} className="absolute inset-0 w-full h-full" />
      {/* Overlay to block right-click/download on YT */}
      <div
        className="absolute inset-0"
        onContextMenu={(e) => e.preventDefault()}
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}

// PDF complete button with countdown
function PDFCompleteButton({ onComplete }: { onComplete: () => void }) {
  const [countdown, setCountdown] = useState(10);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setReady(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <div className="text-center">
      <button
        onClick={onComplete}
        disabled={!ready}
        className={`px-6 py-3 rounded-xl font-medium text-sm ${
          ready ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-600 text-gray-400 cursor-not-allowed"
        }`}
      >
        {ready ? "تعليم كمكتمل ✓" : `انتظر ${countdown} ثانية...`}
      </button>
    </div>
  );
}

// Declare YT on window
declare global {
  interface Window {
    YT: {
      Player: new (id: string, config: object) => {
        getCurrentTime: () => number;
        seekTo: (s: number, a: boolean) => void;
        getDuration: () => number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
