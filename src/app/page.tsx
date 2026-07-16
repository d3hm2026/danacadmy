import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  if (session) {
    if (session.user.role === "owner" || session.user.role === "admin") redirect("/admin");
    if (session.user.role === "instructor") redirect("/instructor");
    redirect("/student");
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col">
      <section className="bg-[#1a2e5a] text-white py-20 px-4 flex flex-col items-center text-center">
        <img src="/logo-white.svg" alt="أكاديمية دان" width={80} height={80} className="mb-6" />
        <h1 className="text-4xl font-bold mb-4">أكاديمية دان</h1>
        <p className="text-lg text-white/80 max-w-xl mb-8">منصة التعلم الإلكتروني الاحترافية — دورات تدريبية، شهادات معتمدة، ومتابعة تقدم مستمرة</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/login" className="bg-[#c4a052] hover:bg-[#b08d3e] text-white px-8 py-3 rounded-2xl font-bold text-lg transition-colors">تسجيل الدخول</Link>
          <Link href="/register" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-2xl font-bold text-lg transition-colors">إنشاء حساب</Link>
        </div>
      </section>
      <section className="bg-[#c4a052] py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 text-center text-white">
          <div><div className="text-3xl font-bold">٥٠٠+</div><div className="text-sm text-white/80 mt-1">طالب مسجل</div></div>
          <div><div className="text-3xl font-bold">٣٠+</div><div className="text-sm text-white/80 mt-1">دورة تدريبية</div></div>
          <div><div className="text-3xl font-bold">٩٥٪</div><div className="text-sm text-white/80 mt-1">رضا الطلاب</div></div>
        </div>
      </section>
      <section className="py-16 px-4 bg-[#fafaf8] flex-1">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1a2e5a] text-center mb-10">لماذا أكاديمية دان؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="font-bold text-[#1a2e5a] text-lg mb-2">محتوى تعليمي متنوع</h3>
              <p className="text-gray-500 text-sm leading-relaxed">فيديوهات شرح، ملفات PDF، واختبارات تفاعلية لقياس مستواك</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-bold text-[#1a2e5a] text-lg mb-2">شهادات معتمدة</h3>
              <p className="text-gray-500 text-sm leading-relaxed">احصل على شهادة إتمام احترافية عند إنهاء أي دورة بنجاح</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-[#1a2e5a] text-lg mb-2">متابعة التقدم</h3>
              <p className="text-gray-500 text-sm leading-relaxed">إحصائيات مفصلة لتتبع تقدمك في كل دورة ودرس</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 bg-[#1a2e5a] text-white text-center">
        <h2 className="text-2xl font-bold mb-4">ابدأ رحلتك التعليمية اليوم</h2>
        <p className="text-white/70 mb-8">انضم إلى مئات الطلاب وطور مهاراتك مع أفضل المعلمين</p>
        <Link href="/register" className="bg-[#c4a052] hover:bg-[#b08d3e] text-white px-10 py-3 rounded-2xl font-bold text-lg transition-colors inline-block">سجّل الآن مجاناً</Link>
      </section>
      <footer className="bg-[#0f1e3d] text-white/50 text-center py-6 text-sm">© ٢٠٢٥ أكاديمية دان — جميع الحقوق محفوظة</footer>
    </div>
  );
}
