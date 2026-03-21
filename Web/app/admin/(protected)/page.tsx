import { AdminShell } from "@/components/admin/shell";
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
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableHeader,
  TableRow,
  TableScrollContainer,
} from "@/components/ui/heroui";
import {
  getAdminApiErrorMessage,
  getAdminOverview,
  getAdminUsers,
  getSessionFromApi,
} from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { AdminOverview, AdminUserSummary } from "@/lib/types";

const TABLE_HEADER_CLASS_NAME = "admin-table-header";

const metrics = [
  {
    key: "totalUsers",
    label: "Users",
    description: "Accounts available to the admin API.",
  },
  {
    key: "totalMeals",
    label: "Meals",
    description: "Tracked meal records.",
  },
  {
    key: "totalSleepEntries",
    label: "Sleep entries",
    description: "Stored sleep records.",
  },
  {
    key: "activeSleepEntries",
    label: "Active sleep",
    description: "Sleep entries still open.",
  },
  {
    key: "totalWorkouts",
    label: "Workouts",
    description: "Workout sessions on record.",
  },
  {
    key: "totalWorkoutTemplates",
    label: "Templates",
    description: "Saved workout templates.",
  },
] as const satisfies Array<{
  key: keyof AdminOverview;
  label: string;
  description: string;
}>;

const linkButtonClassName = "admin-action-link";

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="admin-muted-copy text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function NewestUsersTable({ users }: { users: AdminUserSummary[] }) {
  return (
    <Table variant="secondary">
      <TableScrollContainer className="overflow-x-auto">
        <TableContent aria-label="Newest users table">
          <TableHeader>
            <TableColumn className={TABLE_HEADER_CLASS_NAME} isRowHeader>
              User
            </TableColumn>
            <TableColumn className={TABLE_HEADER_CLASS_NAME}>Role</TableColumn>
            <TableColumn className={TABLE_HEADER_CLASS_NAME}>Onboarding</TableColumn>
            <TableColumn className={TABLE_HEADER_CLASS_NAME}>Last session</TableColumn>
          </TableHeader>
          <TableBody items={users}>
            {(user) => (
              <TableRow id={user.id}>
                <TableCell>
                  <Link
                    className="flex flex-col gap-1 no-underline"
                    href={`/admin/users/${user.id}`}
                  >
                    <span className="font-medium text-foreground">
                      {user.name || "Unnamed user"}
                    </span>
                    <span className="admin-muted-copy text-sm">{user.email}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Chip color="accent" size="sm" variant="soft">
                    {user.role || "user"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    color={user.finishedOnboarding ? "success" : "accent"}
                    size="sm"
                    variant="soft"
                  >
                    {user.finishedOnboarding ? "Complete" : "Pending"}
                  </Chip>
                </TableCell>
                <TableCell className="admin-table-meta">
                  {formatDateTime(user.lastSessionAt)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableContent>
      </TableScrollContainer>
    </Table>
  );
}

export default async function AdminOverviewPage() {
  const session = await getSessionFromApi();

  if (!session) {
    return null;
  }

  let overview: AdminOverview | null = null;
  let users: AdminUserSummary[] | null = null;
  let dataError: string | null = null;

  try {
    const [overviewResponse, usersResponse] = await Promise.all([
      getAdminOverview(),
      getAdminUsers("?limit=6"),
    ]);
    overview = overviewResponse;
    users = usersResponse.rows;
  } catch (error) {
    dataError = getAdminApiErrorMessage(error);
  }

  if (dataError || !overview || !users) {
    return (
      <AdminShell activePath="/admin" user={session.user}>
        <div className="grid gap-6">
          <Alert status="warning">
            <AlertContent>
              <AlertTitle>Overview is unavailable</AlertTitle>
              <AlertDescription>
                {dataError || "Admin overview data could not be loaded."}
              </AlertDescription>
            </AlertContent>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Console status</CardTitle>
              <CardDescription>
                Authentication and route protection are still working.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="admin-detail-card">
                <p className="admin-detail-label">Auth state</p>
                <p className="admin-detail-value text-sm">Connected</p>
              </div>
              <div className="admin-detail-card">
                <p className="admin-detail-label">Admin API</p>
                <p className="admin-detail-value text-sm">Unavailable</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activePath="/admin" user={session.user}>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                Read-only summary of users and activity across the product.
              </CardDescription>
            </div>

            <Link className={linkButtonClassName} href="/admin/logs">
              Open logs
            </Link>
          </CardHeader>

          <CardContent className="admin-card-divider grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard
                description={metric.description}
                key={metric.key}
                label={metric.label}
                value={formatNumber(overview[metric.key])}
              />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px]">
          <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Newest users</CardTitle>
                <CardDescription>
                  Recent accounts with onboarding and last session state.
                </CardDescription>
              </div>

              <Link className={linkButtonClassName} href="/admin/users">
                View all users
              </Link>
            </CardHeader>
            <CardContent className="admin-card-divider pt-4">
              <NewestUsersTable users={users} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick links</CardTitle>
              <CardDescription>Move directly to the two working surfaces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Link className={linkButtonClassName} href="/admin/users">
                  User directory
                </Link>
                <Link className={linkButtonClassName} href="/admin/logs">
                  Logs view
                </Link>
              </div>

              <div className="admin-card-divider space-y-3 pt-4">
                <div className="admin-detail-card">
                  <p className="admin-detail-label">Scope</p>
                  <p className="admin-detail-value text-sm">Read-only routes only.</p>
                </div>
                <div className="admin-detail-card">
                  <p className="admin-detail-label">Default path</p>
                  <p className="admin-detail-value text-sm">
                    Start with users for account support, then logs for backend issues.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
