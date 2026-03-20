import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  Link,
} from "@/components/ui/heroui";
import type { SessionUser } from "@/lib/types";

type AdminShellProps = {
  activePath: string;
  user: SessionUser;
  children: React.ReactNode;
};

const navItems = [
  {
    href: "/admin",
    label: "Overview",
    description: "Read-only product summary.",
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Search accounts and open user detail.",
  },
  {
    href: "/admin/logs",
    label: "Logs",
    description: "Filter snapshot logs and connect live.",
  },
] as const;

function navLinkClassName(isActive: boolean) {
  return isActive ? "admin-nav-link admin-nav-link--active" : "admin-nav-link";
}

export function AdminShell({ activePath, user, children }: AdminShellProps) {
  const currentNavItem =
    navItems.find(
      (item) =>
        activePath === item.href ||
        (item.href !== "/admin" && activePath.startsWith(item.href)),
    ) || navItems[0];

  return (
    <div className="admin-page">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">LifeMeter admin</CardTitle>
              <CardDescription>
                Read-only internal console for users, logs, and system visibility.
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {user.image ? (
                  <AvatarImage src={user.image} />
                ) : (
                  <AvatarFallback>
                    {(user.name || user.email).slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name || "Admin user"}
                </p>
                <p className="admin-muted-copy truncate text-sm">{user.email}</p>
              </div>

              <Chip color="accent" size="sm" variant="soft">
                {user.role || "user"}
              </Chip>
            </div>
          </CardHeader>

          <CardContent className="admin-card-divider flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => {
                const isActive =
                  activePath === item.href ||
                  (item.href !== "/admin" && activePath.startsWith(item.href));

                return (
                  <Link
                    aria-current={isActive ? "page" : undefined}
                    className={navLinkClassName(isActive)}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <p className="admin-muted-copy text-sm">{currentNavItem.description}</p>
          </CardContent>
        </Card>

        {children}
      </div>
    </div>
  );
}
