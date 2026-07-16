import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "owner" || session.user.role === "admin") redirect("/admin");
  if (session.user.role === "instructor") redirect("/instructor");
  redirect("/student");
}
