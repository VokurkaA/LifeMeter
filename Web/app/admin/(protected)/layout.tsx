import { redirect } from "next/navigation";
import {
  checkAuthApiAvailability,
  isAdminRole,
  tryGetSessionFromApi,
} from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authApiAvailability = await checkAuthApiAvailability();

  if (!authApiAvailability.ok) {
    redirect("/admin/login");
  }

  const session = await tryGetSessionFromApi();

  if (!session) {
    redirect("/admin/login");
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/admin/forbidden");
  }

  return children;
}
