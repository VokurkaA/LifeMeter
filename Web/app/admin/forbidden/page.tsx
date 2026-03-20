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
  Link,
} from "@/components/ui/heroui";

const linkButtonClassName = "admin-action-link";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-detail-card">
      <p className="admin-detail-label">{label}</p>
      <p className="admin-detail-value text-sm">{value}</p>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <div className="admin-page">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8 sm:px-6">
        <Card className="w-full">
          <CardHeader className="gap-2">
            <CardTitle className="text-2xl">Access denied</CardTitle>
            <CardDescription>
              This account is signed in but does not have the admin role.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert status="warning">
              <AlertContent>
                <AlertTitle>Admin access requires a different role</AlertTitle>
                <AlertDescription>
                  Sign in with an authorized account or update the user role in the backend.
                </AlertDescription>
              </AlertContent>
            </Alert>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Required role" value="admin" />
              <DetailItem label="Next step" value="Use a different account or update roles." />
            </div>

            <div className="flex flex-wrap gap-2">
              <Link className={linkButtonClassName} href="/admin/login">
                Back to sign in
              </Link>
              <Link className={linkButtonClassName} href="/">
                Return to main page
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
