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
  EmptyState,
  Link,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/ui/heroui";
import {
  getAdminApiErrorMessage,
  getAdminUserMeals,
  getAdminUserProfile,
  getAdminUserSleep,
  getAdminUserWorkouts,
  getAdminUserWorkoutTemplates,
  getSessionFromApi,
} from "@/lib/api";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatWeightGrams,
} from "@/lib/format";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

const linkButtonClassName = "admin-action-link";

function formatGoalGrams(value?: number | null) {
  return value === null || value === undefined ? "Not available" : `${formatNumber(value)} g`;
}

function FactItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="admin-detail-card">
      <p className="admin-detail-label">{label}</p>
      <p
        className={[
          "admin-detail-value text-sm",
          mono ? "break-all font-mono text-xs sm:text-sm" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function ActivityItem({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle: string;
  meta: string;
}) {
  return (
    <div className="admin-detail-card space-y-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="admin-muted-copy font-mono text-xs">{meta}</p>
      </div>
      <p className="admin-muted-copy text-sm">{subtitle}</p>
    </div>
  );
}

function EmptyActivityState({ copy }: { copy: string }) {
  return (
    <EmptyState className="p-4">
      <p className="admin-muted-copy text-sm">{copy}</p>
    </EmptyState>
  );
}

export default async function AdminUserDetailPage({
  params,
}: UserDetailPageProps) {
  const { id } = await params;
  const session = await getSessionFromApi();

  if (!session) {
    return null;
  }

  let profileBundle;
  let meals;
  let sleep;
  let workouts;
  let templates;
  let dataError: string | null = null;

  try {
    [profileBundle, meals, sleep, workouts, templates] = await Promise.all([
      getAdminUserProfile(id),
      getAdminUserMeals(id, "?limit=5"),
      getAdminUserSleep(id, "?limit=5"),
      getAdminUserWorkouts(id, "?limit=5"),
      getAdminUserWorkoutTemplates(id, "?limit=5"),
    ]);
  } catch (error) {
    dataError = getAdminApiErrorMessage(error);
  }

  if (dataError || !profileBundle || !meals || !sleep || !workouts || !templates) {
    return (
      <AdminShell activePath="/admin/users" user={session.user}>
        <Alert status="warning">
          <AlertContent>
            <AlertTitle>User detail is unavailable</AlertTitle>
            <AlertDescription>
              {dataError || "User detail could not be loaded."}
            </AlertDescription>
          </AlertContent>
        </Alert>
      </AdminShell>
    );
  }

  const user = profileBundle.user;

  return (
    <AdminShell activePath="/admin/users" user={session.user}>
      <div className="grid gap-6">
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{user.name || "Unnamed user"}</CardTitle>
              <CardDescription className="break-all font-mono">
                {user.email}
              </CardDescription>
            </div>

            <Link className={linkButtonClassName} href="/admin/users">
              Back to users
            </Link>
          </CardHeader>

          <CardContent className="admin-card-divider flex flex-wrap gap-2 pt-4">
            <Chip color="accent" variant="soft">
              {user.role || "user"}
            </Chip>
            <Chip color={user.banned ? "danger" : "success"} variant="soft">
              {user.banned ? "Banned" : "Active"}
            </Chip>
            <Chip color={user.emailVerified ? "success" : "accent"} variant="soft">
              {user.emailVerified ? "Email verified" : "Email unverified"}
            </Chip>
            <Chip color={user.finishedOnboarding ? "success" : "accent"} variant="soft">
              {user.finishedOnboarding ? "Onboarding complete" : "Onboarding pending"}
            </Chip>
          </CardContent>

          <CardContent className="grid gap-4 pt-0 sm:grid-cols-2 xl:grid-cols-3">
            <FactItem label="Created" value={formatDateTime(user.createdAt)} />
            <FactItem label="Last session" value={formatDateTime(user.lastSessionAt)} />
            <FactItem
              label="Last login method"
              value={user.lastLoginMethod || "Not available"}
            />
            <FactItem label="Ban reason" value={user.banReason || "None"} />
            <FactItem label="Ban expiry" value={formatDateTime(user.banExpires)} />
            <FactItem label="User ID" mono value={user.id} />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Latest metrics</CardTitle>
              <CardDescription>Most recent health measurements on file.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FactItem
                label="Weight"
                value={formatWeightGrams(profileBundle.latestWeight?.weight_grams)}
              />
              <FactItem
                label="Height"
                value={
                  profileBundle.latestHeight?.height_cm
                    ? `${profileBundle.latestHeight.height_cm} cm`
                    : "Not available"
                }
              />
              <FactItem
                label="Blood pressure"
                value={
                  profileBundle.latestBloodPressure
                    ? `${profileBundle.latestBloodPressure.systolic_mmhg}/${profileBundle.latestBloodPressure.diastolic_mmhg} mmHg`
                    : "Not available"
                }
              />
              <FactItem
                label="Heart rate"
                value={
                  profileBundle.latestHeartRate
                    ? `${profileBundle.latestHeartRate.bpm} bpm`
                    : "Not available"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Core profile values used by the app.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FactItem
                label="Date of birth"
                value={formatDate(profileBundle.profile?.date_of_birth)}
              />
              <FactItem label="Sex" value={profileBundle.profile?.sex || "Not available"} />
              <FactItem
                label="Activity factor"
                value={String(
                  profileBundle.profile?.current_activity_factor ?? "Not available",
                )}
              />
              <FactItem
                label="BMR"
                value={
                  profileBundle.profile?.current_bmr_calories
                    ? `${formatNumber(profileBundle.profile.current_bmr_calories)} kcal`
                    : "Not available"
                }
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Current goal values stored for this user.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FactItem
              label="Daily steps"
              value={formatNumber(profileBundle.goals?.daily_steps_goal)}
            />
            <FactItem
              label="Target weight"
              value={formatWeightGrams(profileBundle.goals?.target_weight_grams)}
            />
            <FactItem
              label="Target date"
              value={formatDate(profileBundle.goals?.target_weight_date)}
            />
            <FactItem
              label="Bedtime"
              value={profileBundle.goals?.bedtime_goal || "Not available"}
            />
            <FactItem
              label="Wakeup"
              value={profileBundle.goals?.wakeup_goal || "Not available"}
            />
            <FactItem
              label="Protein"
              value={formatGoalGrams(profileBundle.goals?.daily_protein_goal_grams)}
            />
            <FactItem
              label="Fat"
              value={formatGoalGrams(profileBundle.goals?.daily_fat_goal_grams)}
            />
            <FactItem
              label="Carbs"
              value={formatGoalGrams(profileBundle.goals?.daily_carbs_goal_grams)}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Meals, workouts, and templates from the latest records.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultSelectedKey="meals" variant="secondary">
                <TabList>
                  <Tab id="meals">Meals</Tab>
                  <Tab id="workouts">Workouts</Tab>
                  <Tab id="templates">Templates</Tab>
                </TabList>

                <TabPanel className="space-y-4 pt-4" id="meals">
                  {meals.rows.length > 0 ? (
                    meals.rows.map((meal) => (
                      <ActivityItem
                        key={meal.userMeal.id}
                        meta={formatDateTime(meal.userMeal.eaten_at)}
                        subtitle={`${meal.userFoods.length} foods`}
                        title={meal.userMeal.name}
                      />
                    ))
                  ) : (
                    <EmptyActivityState copy="No recent meals are available for this user." />
                  )}
                </TabPanel>

                <TabPanel className="space-y-4 pt-4" id="workouts">
                  {workouts.rows.length > 0 ? (
                    workouts.rows.map((workout) => (
                      <ActivityItem
                        key={workout.workout.id}
                        meta={formatDateTime(workout.workout.start_date)}
                        subtitle={`${workout.sets.length} sets`}
                        title={(workout.workout.label || []).join(", ") || "Workout"}
                      />
                    ))
                  ) : (
                    <EmptyActivityState copy="No recent workouts are available for this user." />
                  )}
                </TabPanel>

                <TabPanel className="space-y-4 pt-4" id="templates">
                  {templates.rows.length > 0 ? (
                    templates.rows.map((template) => (
                      <ActivityItem
                        key={template.workoutTemplate.id}
                        meta={formatDateTime(template.workoutTemplate.updated_at)}
                        subtitle={`${template.sets.length} template sets`}
                        title={template.workoutTemplate.name}
                      />
                    ))
                  ) : (
                    <EmptyActivityState copy="No workout templates are available for this user." />
                  )}
                </TabPanel>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent sleep</CardTitle>
              <CardDescription>Latest sleep entries and notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sleep.rows.length > 0 ? (
                sleep.rows.map((entry) => (
                  <ActivityItem
                    key={entry.id}
                    meta={formatDateTime(entry.sleep_start)}
                    subtitle={entry.note || "No note recorded"}
                    title={formatDuration(entry.sleep_start, entry.sleep_end)}
                  />
                ))
              ) : (
                <EmptyActivityState copy="No recent sleep entries are available for this user." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
