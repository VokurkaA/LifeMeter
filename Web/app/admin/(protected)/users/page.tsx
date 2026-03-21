import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  EmptyState,
  Form,
  Input,
  Label,
  Link,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableContent,
  TableHeader,
  TableRow,
  TableScrollContainer,
  TextField,
} from "@/components/ui/heroui";
import {
  getAdminApiErrorMessage,
  getAdminUsers,
  getSessionFromApi,
} from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";

const TABLE_HEADER_CLASS_NAME = "admin-table-header";

type UsersPageProps = {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    q?: string;
  }>;
};

const linkButtonClassName = "admin-action-link";

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const params = (await searchParams) || {};
  const query = new URLSearchParams();

  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.q) query.set("q", params.q);

  const session = await getSessionFromApi();

  if (!session) {
    return null;
  }

  let users;
  let dataError: string | null = null;

  try {
    users = await getAdminUsers(query.toString() ? `?${query.toString()}` : "");
  } catch (error) {
    dataError = getAdminApiErrorMessage(error);
  }

  if (dataError || !users) {
    return (
      <AdminShell activePath="/admin/users" user={session.user}>
        <Alert status="warning">
          <AlertContent>
            <AlertTitle>Users are unavailable</AlertTitle>
            <AlertDescription>
              {dataError || "Users data could not be loaded."}
            </AlertDescription>
          </AlertContent>
        </Alert>
      </AdminShell>
    );
  }

  const currentPage = users.pagination.page;
  const makePageHref = (page: number) => {
    const next = new URLSearchParams(query);
    if (page <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(page));
    }

    const search = next.toString();
    return search ? `/admin/users?${search}` : "/admin/users";
  };
  const requestedPage = params.page ? Number.parseInt(params.page, 10) : null;

  if (
    requestedPage !== null &&
    !Number.isNaN(requestedPage) &&
    requestedPage !== currentPage
  ) {
    redirect(makePageHref(currentPage));
  }

  const hasQuery = Boolean(params.q?.trim());

  return (
    <AdminShell activePath="/admin/users" user={session.user}>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Search accounts, review current status, and open detail pages.
              </CardDescription>
            </div>

            <Form className="flex w-full max-w-xl gap-2" method="get">
              {params.limit ? <input name="limit" type="hidden" value={params.limit} /> : null}
              <TextField className="min-w-0 flex-1" name="q">
                <Label className="sr-only">Search users</Label>
                <Input
                  defaultValue={params.q || ""}
                  placeholder="Search by name, email, or role"
                  variant="secondary"
                />
              </TextField>
              <Button type="submit" variant="primary">
                Search
              </Button>
            </Form>
          </CardHeader>

          <CardContent className="admin-card-divider flex flex-wrap items-center gap-2 pt-4">
            <p className="admin-muted-copy text-sm">
              {formatNumber(users.pagination.totalRecords)} accounts. Page {currentPage} of{" "}
              {users.pagination.totalPages}.
            </p>
            {hasQuery ? (
              <Chip color="accent" size="sm" variant="soft">
                Query: {params.q}
              </Chip>
            ) : null}
          </CardContent>

          <CardContent className="pt-0">
            {users.rows.length > 0 ? (
              <Table variant="secondary">
                <TableScrollContainer className="overflow-x-auto">
                  <TableContent aria-label="User directory table">
                    <TableHeader>
                      <TableColumn className={TABLE_HEADER_CLASS_NAME} isRowHeader>
                        User
                      </TableColumn>
                      <TableColumn className={TABLE_HEADER_CLASS_NAME}>
                        Role
                      </TableColumn>
                      <TableColumn className={TABLE_HEADER_CLASS_NAME}>
                        Status
                      </TableColumn>
                      <TableColumn className={TABLE_HEADER_CLASS_NAME}>
                        Onboarding
                      </TableColumn>
                      <TableColumn className={TABLE_HEADER_CLASS_NAME}>
                        Last session
                      </TableColumn>
                    </TableHeader>
                    <TableBody>
                      {users.rows.map((user) => (
                        <TableRow id={user.id} key={user.id}>
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
                              color={user.banned ? "danger" : "success"}
                              size="sm"
                              variant="soft"
                            >
                              {user.banned ? "Banned" : "Active"}
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
                      ))}
                    </TableBody>
                  </TableContent>
                </TableScrollContainer>
              </Table>
            ) : (
              <EmptyState className="p-6">
                <p className="admin-muted-copy text-sm">
                  No users matched the current query.
                </p>
              </EmptyState>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="admin-muted-copy text-sm">
            Showing page {users.pagination.page} of {users.pagination.totalPages}.
          </p>

          <div className="flex flex-wrap gap-2">
            {users.pagination.prevPage ? (
              <Link
                className={linkButtonClassName}
                href={makePageHref(users.pagination.prevPage)}
              >
                Previous
              </Link>
            ) : null}
            {users.pagination.nextPage ? (
              <Link
                className={linkButtonClassName}
                href={makePageHref(users.pagination.nextPage)}
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
