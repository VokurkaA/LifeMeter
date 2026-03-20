import { redirect } from "next/navigation";
import { LogsFilters } from "@/components/admin/logs-filters";
import { AdminShell } from "@/components/admin/shell";
import { LiveLogs } from "@/components/admin/live-logs";
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
} from "@/components/ui/heroui";
import {
  getAdminApiErrorMessage,
  getAdminLogs,
  getPublicApiBaseUrl,
  getSessionFromApi,
} from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";

type LogsPageProps = {
  searchParams?: Promise<{
    page?: string;
    context?: string;
    level?: string;
    dateStart?: string;
    dateEnd?: string;
  }>;
};

export default async function AdminLogsPage({ searchParams }: LogsPageProps) {
  const params = (await searchParams) || {};
  const filterQuery = new URLSearchParams();

  if (params.context) filterQuery.set("context", params.context);
  if (params.level) filterQuery.set("level", params.level);
  if (params.dateStart) filterQuery.set("dateStart", params.dateStart);
  if (params.dateEnd) filterQuery.set("dateEnd", params.dateEnd);

  const session = await getSessionFromApi();

  if (!session) {
    return null;
  }

  if (params.page) {
    const search = filterQuery.toString();
    redirect(search ? `/admin/logs?${search}` : "/admin/logs");
  }

  let logs;
  let dataError: string | null = null;

  try {
    logs = await getAdminLogs(
      filterQuery.toString() ? `?${filterQuery.toString()}` : "",
    );
  } catch (error) {
    dataError = getAdminApiErrorMessage(error);
  }

  const hasFilters = Boolean(
    params.context || params.level || params.dateStart || params.dateEnd,
  );

  return (
    <AdminShell activePath="/admin/logs" user={session.user}>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Current filter setup</CardTitle>
              <CardDescription>
                Adjust the snapshot query, then scroll the table to fetch older logs.
              </CardDescription>
            </div>

            {logs ? (
              <Chip color="accent" variant="soft">
                {formatNumber(logs.total)} matches
              </Chip>
            ) : null}
          </CardHeader>

          <CardContent className="admin-card-divider space-y-4 pt-4">
            <div className="flex flex-wrap gap-2">
              {hasFilters ? (
                <>
                  {params.context ? (
                    <Chip color="accent" size="sm" variant="soft">
                      Context: {params.context}
                    </Chip>
                  ) : null}
                  {params.level ? (
                    <Chip color="accent" size="sm" variant="soft">
                      Level: {params.level}
                    </Chip>
                  ) : null}
                  {params.dateStart ? (
                    <Chip color="accent" size="sm" variant="soft">
                      From: {formatDate(params.dateStart)}
                    </Chip>
                  ) : null}
                  {params.dateEnd ? (
                    <Chip color="accent" size="sm" variant="soft">
                      To: {formatDate(params.dateEnd)}
                    </Chip>
                  ) : null}
                </>
              ) : (
                <Chip color="accent" size="sm" variant="soft">
                  All logs
                </Chip>
              )}
            </div>

            <div className="admin-filter-shell rounded-lg p-4">
              <LogsFilters
                initialContext={params.context}
                initialDateEnd={params.dateEnd}
                initialDateStart={params.dateStart}
                initialLevel={params.level}
              />
            </div>
          </CardContent>
        </Card>

        {dataError ? (
          <Alert status="warning">
            <AlertContent>
              <AlertTitle>Logs are unavailable</AlertTitle>
              <AlertDescription>{dataError}</AlertDescription>
            </AlertContent>
          </Alert>
        ) : null}

        {logs ? (
          <Card>
            <CardHeader>
              <CardTitle>Logs table</CardTitle>
              <CardDescription>
                Virtualized rows with infinite loading and optional live updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveLogs
                apiBaseUrl={getPublicApiBaseUrl()}
                context={params.context}
                initialLogs={logs.rows}
                initialPage={logs.pagination.page}
                initialTotal={logs.total}
                initialTotalPages={logs.pagination.totalPages}
                level={params.level}
                queryString={filterQuery.toString()}
              />
            </CardContent>
          </Card>
        ) : null}

        {!logs && !dataError ? (
          <Alert status="warning">
            <AlertContent>
              <AlertTitle>No log data was returned</AlertTitle>
              <AlertDescription>
                Try widening the filters and running the query again.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ) : null}
      </div>
    </AdminShell>
  );
}
