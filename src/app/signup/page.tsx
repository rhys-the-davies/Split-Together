import { redirect } from "next/navigation";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  void searchParams;
  redirect("/login");
}
