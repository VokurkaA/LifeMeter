import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/heroui";
import {
  checkAuthApiAvailability,
  getSessionFromApi,
  isAdminRole,
  tryGetApiBaseUrl,
  tryGetPublicApiBaseUrl,
} from "@/lib/api";

export const dynamic = "force-dynamic";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-detail-card">
      <p className="admin-detail-label">{label}</p>
      <p className="admin-detail-value break-all text-sm">{value}</p>
    </div>
  );
}

export default async function AdminLoginPage() {
  const apiBaseUrl = tryGetApiBaseUrl();
  const publicApiBaseUrl = tryGetPublicApiBaseUrl();
  const authApiAvailability = apiBaseUrl ? await checkAuthApiAvailability() : null;
  const canUseAuth = Boolean(apiBaseUrl && authApiAvailability?.ok);
  const session = canUseAuth ? await getSessionFromApi() : null;

  if (session && isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  if (session && !isAdminRole(session.user.role)) {
    redirect("/admin/forbidden");
  }

  return (
    <div className="admin-page">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8 sm:px-6">
        <Card className="w-full">
          <CardHeader className="gap-2">
            <CardTitle className="text-2xl">Admin sign in</CardTitle>
            <CardDescription>
              Read-only access to users, logs, and production state.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!apiBaseUrl ? (
              <Alert status="danger">
                <AlertContent>
                  <AlertTitle>Backend auth is not configured</AlertTitle>
                  <AlertDescription>
                    API_URL or NEXT_PUBLIC_API_URL must point to the backend origin.
                  </AlertDescription>
                </AlertContent>
              </Alert>
            ) : null}

            {apiBaseUrl && authApiAvailability && !authApiAvailability.ok ? (
              <Alert status="warning">
                <AlertContent>
                  <AlertTitle>Backend auth is unavailable</AlertTitle>
                  <AlertDescription>{authApiAvailability.message}</AlertDescription>
                </AlertContent>
              </Alert>
            ) : null}

            <LoginForm
              apiBaseUrl={publicApiBaseUrl || apiBaseUrl || ""}
              isDisabled={!canUseAuth}
            />

            <div className="admin-card-divider grid gap-3 pt-4 sm:grid-cols-3">
              <DetailItem label="Access" value="Admin role required" />
              <DetailItem
                label="Backend"
                value={publicApiBaseUrl || apiBaseUrl || "Not configured"}
              />
              <DetailItem
                label="Status"
                value={
                  canUseAuth
                    ? "Auth bridge ready"
                    : apiBaseUrl
                      ? "Auth bridge unavailable"
                      : "Configuration required"
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
