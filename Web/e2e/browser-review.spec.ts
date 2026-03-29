import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page, type Response } from "@playwright/test";

type ReviewMetrics = {
  title: string;
  pathname: string;
  viewport: { width: number; height: number };
  bodyHeight: number;
  horizontalOverflowCount: number;
  fixedElementCount: number;
  headingCount: number;
  preferredColorScheme: "light" | "dark";
  landingTheme: string | null;
  responseStatus: number | null;
  authMode: "public" | "authenticated" | "redirected-to-login";
  pageErrorCount: number;
  consoleErrorCount: number;
  requestFailureCount: number;
  pageErrors: string[];
  consoleErrors: string[];
  requestFailures: string[];
};

type PublicRouteReview = {
  slug: string;
  path: string;
  expectedPath: RegExp;
  expectedTitle?: RegExp;
  heading: RegExp;
  sentinels: RegExp[];
};

type ProtectedRouteReview = {
  slug: string;
  path: string;
  expectedAuthenticatedPath: RegExp;
  sentinels: RegExp[];
};

type RouteDiagnostics = {
  pageErrors: string[];
  consoleErrors: string[];
  requestFailures: string[];
};

const publicRoutes: PublicRouteReview[] = [
  {
    slug: "home",
    path: "/",
    expectedPath: /^\/(?:\?.*)?$/,
    expectedTitle: /^LifeMeter \| One daily view for training, meals, sleep, and progress$/,
    heading: /Train, eat, recover, and/i,
    sentinels: [/Browse all releases/i, /Daily health companion/i],
  },
  {
    slug: "downloads",
    path: "/downloads",
    expectedPath: /^\/downloads(?:\?.*)?$/,
    expectedTitle: /^LifeMeter \| Downloads$/,
    heading: /Get the current build fast\./i,
    sentinels: [/What this page handles/i, /Release lanes/i],
  },
  {
    slug: "admin-login",
    path: "/admin/login",
    expectedPath: /^\/admin\/login(?:\?.*)?$/,
    heading: /Admin sign in/i,
    sentinels: [
      /Read-only access to users, logs, and production state\./i,
      /Backend auth is unavailable/i,
      /Backend auth is not configured/i,
      /Use a Better Auth account that already has the `admin` role\./i,
    ],
  },
  {
    slug: "admin-forbidden",
    path: "/admin/forbidden",
    expectedPath: /^\/admin\/forbidden(?:\?.*)?$/,
    heading: /Access denied/i,
    sentinels: [/Admin access requires a different role/i, /Back to sign in/i],
  },
];

const protectedRoutes: ProtectedRouteReview[] = [
  {
    slug: "admin-dashboard",
    path: "/admin",
    expectedAuthenticatedPath: /^\/admin(?:\?.*)?$/,
    sentinels: [/Overview is unavailable/i, /Console status/i, /Newest users/i, /Open logs/i],
  },
  {
    slug: "admin-logs",
    path: "/admin/logs",
    expectedAuthenticatedPath: /^\/admin\/logs(?:\?.*)?$/,
    sentinels: [/Current filter setup/i, /Logs are unavailable/i, /Logs table/i, /No log data was returned/i],
  },
  {
    slug: "admin-users",
    path: "/admin/users",
    expectedAuthenticatedPath: /^\/admin\/users(?:\?.*)?$/,
    sentinels: [/Users are unavailable/i, /Search accounts, review current status, and open detail pages\./i, /No users matched the current query\./i],
  },
  {
    slug: "admin-user-detail",
    path: "/admin/users/playwright-review-user",
    expectedAuthenticatedPath: /^\/admin\/users\/[^/?]+(?:\?.*)?$/,
    sentinels: [/User detail is unavailable/i, /Back to users/i, /Latest metrics/i],
  },
];

const ADMIN_LOGIN_PATH_PATTERN = /^\/admin\/login(?:\?.*)?$/;
const ADMIN_SHELL_HEADING = /LifeMeter admin/i;
const ADMIN_LOGIN_HEADING = /Admin sign in/i;
const hasReviewCredentials = Boolean(
  process.env.BROWSER_REVIEW_EMAIL && process.env.BROWSER_REVIEW_PASSWORD,
);

function getExpectedTheme(projectName: string): "light" | "dark" {
  return projectName.endsWith("-dark") ? "dark" : "light";
}

function getPathWithSearch(page: Page) {
  const currentUrl = new URL(page.url());
  return `${currentUrl.pathname}${currentUrl.search}`;
}

async function expectPath(page: Page, pattern: RegExp) {
  await expect.poll(() => getPathWithSearch(page)).toMatch(pattern);
}

function createRouteDiagnostics(page: Page): RouteDiagnostics {
  const diagnostics: RouteDiagnostics = {
    pageErrors: [],
    consoleErrors: [],
    requestFailures: [],
  };

  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.message);
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  page.on("requestfailed", (request) => {
    if (request.resourceType() === "websocket") {
      return;
    }

    const failure = request.failure();
    diagnostics.requestFailures.push(
      `${request.method()} ${request.url()} (${failure?.errorText || "unknown"})`,
    );
  });

  return diagnostics;
}

async function collectMetrics(
  page: Page,
  response: Response | null,
  authMode: ReviewMetrics["authMode"],
  diagnostics: RouteDiagnostics,
): Promise<ReviewMetrics> {
  const domMetrics = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const overflowing = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.right > viewportWidth + 1 || rect.left < -1);
      })
      .length;
    const fixedCount = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => getComputedStyle(element).position === "fixed")
      .length;

    return {
      title: document.title,
      pathname: window.location.pathname,
      viewport: { width: viewportWidth, height: viewportHeight },
      bodyHeight: document.documentElement.scrollHeight,
      horizontalOverflowCount: overflowing,
      fixedElementCount: fixedCount,
      headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
      preferredColorScheme: (
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      ) as "light" | "dark",
      landingTheme: document.documentElement.dataset.landingTheme || null,
    };
  });

  return {
    ...domMetrics,
    responseStatus: response?.status() ?? null,
    authMode,
    pageErrorCount: diagnostics.pageErrors.length,
    consoleErrorCount: diagnostics.consoleErrors.length,
    requestFailureCount: diagnostics.requestFailures.length,
    pageErrors: diagnostics.pageErrors,
    consoleErrors: diagnostics.consoleErrors,
    requestFailures: diagnostics.requestFailures,
  };
}

async function saveReviewArtifact(
  page: Page,
  projectName: string,
  slug: string,
  metrics: ReviewMetrics,
) {
  const artifactDir = path.join(process.cwd(), ".artifacts", "browser-review", projectName);
  await mkdir(artifactDir, { recursive: true });
  await page.screenshot({
    path: path.join(artifactDir, `${slug}.png`),
    fullPage: true,
  });
  await writeFile(
    path.join(artifactDir, `${slug}.json`),
    JSON.stringify(metrics, null, 2),
    "utf8",
  );
}

async function assertPageTextContainsOneOf(
  page: Page,
  patterns: RegExp[],
  description: string,
) {
  const bodyText = await page.locator("body").innerText();
  expect(
    patterns.some((pattern) => pattern.test(bodyText)),
    `Expected ${description} to contain one of: ${patterns
      .map((pattern) => pattern.toString())
      .join(", ")}`,
  ).toBe(true);
}

function assertDiagnosticsAreClean(routeSlug: string, metrics: ReviewMetrics) {
  expect(
    metrics.pageErrors,
    `${routeSlug} emitted unexpected page errors`,
  ).toEqual([]);
  expect(
    metrics.consoleErrors,
    `${routeSlug} emitted unexpected console errors`,
  ).toEqual([]);
  expect(
    metrics.requestFailures,
    `${routeSlug} emitted unexpected failed requests`,
  ).toEqual([]);
}

function assertSharedMetrics(
  routeSlug: string,
  projectName: string,
  metrics: ReviewMetrics,
) {
  expect(metrics.title.trim().length, `${routeSlug} should have a non-empty document title`).toBeGreaterThan(0);
  expect(metrics.headingCount, `${routeSlug} should render at least one heading`).toBeGreaterThan(0);
  expect(metrics.horizontalOverflowCount, `${routeSlug} should not overflow horizontally`).toBe(0);
  expect(metrics.preferredColorScheme).toBe(getExpectedTheme(projectName));
}

async function navigateToRoute(page: Page, pathName: string) {
  const response = await page.goto(pathName, {
    waitUntil: "domcontentloaded",
  });

  expect(response, `Expected a main document response for ${pathName}`).not.toBeNull();
  expect(response?.status(), `Expected ${pathName} to render without a 4xx/5xx response`).toBeLessThan(400);
  return response;
}

async function signIn(page: Page) {
  const email = process.env.BROWSER_REVIEW_EMAIL;
  const password = process.env.BROWSER_REVIEW_PASSWORD;

  if (!email || !password) {
    return false;
  }

  await navigateToRoute(page, "/admin/login");
  await expectPath(page, ADMIN_LOGIN_PATH_PATTERN);
  await expect(page.getByRole("heading", { name: ADMIN_LOGIN_HEADING })).toBeVisible();

  const signInButton = page.getByRole("button", { name: /^sign in$/i });
  await expect(signInButton).toBeEnabled();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);

  await Promise.all([
    page.waitForURL((url) => /^\/admin(?:\?.*)?$/.test(`${url.pathname}${url.search}`)),
    signInButton.click(),
  ]);

  await expect(page.getByRole("heading", { name: ADMIN_SHELL_HEADING })).toBeVisible();
  return true;
}

for (const route of publicRoutes) {
  test(`${route.slug} renders cleanly`, async ({ page }, testInfo) => {
    const diagnostics = createRouteDiagnostics(page);
    const response = await navigateToRoute(page, route.path);

    await expectPath(page, route.expectedPath);
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    await assertPageTextContainsOneOf(page, route.sentinels, route.slug);

    const metrics = await collectMetrics(page, response, "public", diagnostics);
    if (route.expectedTitle) {
      expect(metrics.title).toMatch(route.expectedTitle);
    }
    assertSharedMetrics(route.slug, testInfo.project.name, metrics);
    assertDiagnosticsAreClean(route.slug, metrics);
    await saveReviewArtifact(page, testInfo.project.name, route.slug, metrics);
  });
}

for (const route of protectedRoutes) {
  test(`${route.slug} handles auth and renders cleanly`, async ({ page }, testInfo) => {
    const diagnostics = createRouteDiagnostics(page);
    const isAuthenticated = hasReviewCredentials ? await signIn(page) : false;
    const response = await navigateToRoute(page, route.path);

    let authMode: ReviewMetrics["authMode"] = "redirected-to-login";

    if (isAuthenticated) {
      authMode = "authenticated";
      await expectPath(page, route.expectedAuthenticatedPath);
      await expect(page.getByRole("heading", { name: ADMIN_SHELL_HEADING })).toBeVisible();
      await assertPageTextContainsOneOf(page, route.sentinels, route.slug);
    } else {
      await expectPath(page, ADMIN_LOGIN_PATH_PATTERN);
      await expect(page.getByRole("heading", { name: ADMIN_LOGIN_HEADING })).toBeVisible();
      await assertPageTextContainsOneOf(
        page,
        [
          /Read-only access to users, logs, and production state\./i,
          /Backend auth is unavailable/i,
          /Backend auth is not configured/i,
        ],
        `${route.slug} redirected login state`,
      );
    }

    const metrics = await collectMetrics(page, response, authMode, diagnostics);
    assertSharedMetrics(route.slug, testInfo.project.name, metrics);
    assertDiagnosticsAreClean(route.slug, metrics);
    await saveReviewArtifact(page, testInfo.project.name, route.slug, metrics);
  });
}
