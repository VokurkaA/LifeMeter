"use client";

import React from "react";
import { 
  Button, 
  Card, 
  Table, 
  Chip, 
  Link, 
  Separator, 
  Skeleton,
  Avatar
} from "@heroui/react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminDashboard() {
  const [session, setSession] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const checkAuth = async () => {
      const { data: sessionData } = await authClient.getSession();
      if (!sessionData || sessionData.user.role !== "admin") {
        router.push("/admin/login");
        return;
      }
      setSession(sessionData);
      
      // Fetch users using better-auth admin plugin
      const { data: userData } = await authClient.admin.listUsers({
        query: { limit: 10 }
      });
      if (userData) {
        setUsers(userData.users);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-surface-secondary p-8 flex-col gap-6">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-[400px] rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden w-64 flex-col border-r border-divider bg-background p-6 md:flex">
        <div className="flex items-center gap-2 mb-10">
          <Image src="/logo.svg" alt="LifeMeter Logo" width={32} height={32} />
          <span className="text-xl font-bold tracking-tight text-foreground">LifeMeter</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          <Link href="/admin" className="rounded-xl bg-surface-secondary px-4 py-2 text-sm font-medium text-primary">Dashboard</Link>
          <Link href="#" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Users</Link>
          <Link href="#" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Nutrition</Link>
          <Link href="#" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Workouts</Link>
          <Link href="#" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">System Logs</Link>
        </nav>
        
        <div className="mt-auto pt-6 border-t border-divider flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="size-8">
              <Avatar.Image src={session?.user.image || ""} />
              <Avatar.Fallback>{session?.user.name?.charAt(0)}</Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{session?.user.name}</span>
              <span className="text-xs text-muted-foreground truncate">{session?.user.email}</span>
            </div>
          </div>
          <Button variant="danger-soft" size="sm" onPress={handleLogout}>Log Out</Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
            <p className="text-muted-foreground">Manage users and monitor system health.</p>
          </div>
          <div className="flex items-center gap-3">
             <Chip color="success" variant="soft" className="flex items-center gap-1">
               <div className="size-2 rounded-full bg-success" />
               Server: Online
             </Chip>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Users</Card.Title>
            </Card.Header>
            <Card.Content>
              <span className="text-3xl font-bold">{users.length * 12}</span>
            </Card.Content>
          </Card>
          
          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Active Sessions</Card.Title>
            </Card.Header>
            <Card.Content>
              <span className="text-3xl font-bold">142</span>
            </Card.Content>
          </Card>

          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Database Size</Card.Title>
            </Card.Header>
            <Card.Content>
              <span className="text-3xl font-bold">1.2 GB</span>
            </Card.Content>
          </Card>

          <Card variant="secondary">
            <Card.Header>
              <Card.Title className="text-sm font-medium uppercase tracking-wider text-muted-foreground">VM Status</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold">Oracle Cloud</span>
                <span className="text-xs text-success font-medium">Healthy / Running</span>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* User Management Table */}
        <Card className="rounded-3xl border-divider">
          <Card.Header className="flex flex-row items-center justify-between px-6 py-4">
             <Card.Title>Recent Users</Card.Title>
             <Button variant="secondary" size="sm">View All</Button>
          </Card.Header>
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="User list" className="min-w-[600px]">
                <Table.Header>
                  <Table.Column isRowHeader>User</Table.Column>
                  <Table.Column>Email</Table.Column>
                  <Table.Column>Role</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {users.map((user) => (
                    <Table.Row key={user.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <Avatar.Image src={user.image} />
                            <Avatar.Fallback>{user.name?.charAt(0)}</Avatar.Fallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{user.email}</Table.Cell>
                      <Table.Cell>
                        <Chip color={user.role === "admin" ? "accent" : "default"} variant="soft" className="capitalize">
                          {user.role || "user"}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="flex items-center gap-2">
                           <div className={`size-2 rounded-full ${user.banned ? 'bg-danger' : 'bg-success'}`} />
                           {user.banned ? 'Banned' : 'Active'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Button variant="tertiary" size="sm">Edit</Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card>
      </main>
    </div>
  );
}
