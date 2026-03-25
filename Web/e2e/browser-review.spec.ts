import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

type RouteReview = {
  slug: string;
  path: string;
  requiresAuth?: boolean;
};

type ReviewMetrics = {
  title: string;
  pathname: string;
  viewport: { width: number; height: number };
  bodyHeight: number;
  horizontalOverflowCount: number;
  fixedElementCount: number;
  headingCount: number;
};

const reviewRoutes: RouteReview[] = [
  { slug: "home", path: "/" },
  { slug: "downloads", path: "/downloads" },
  { slug: "admin-login", path: "/admin/login" },
  { slug: "admin-dashboard", path: "/admin", requiresAuth: true },
  { slug: "admin-logs", path: "/admin/logs", requiresAuth: true },
];

async function collectMetrics(page: Page): Promise<ReviewMetrics> {
  return page.evaluate(() => {
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
    };
  });
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

async function signInIfConfigured(page: Page) {
  const email = process.env.BROWSER_REVIEW_EMAIL;
  const password = process.env.BROWSER_REVIEW_PASSWORD;

  if (!email || !password) {
    test.skip(true, "Set BROWSER_REVIEW_EMAIL and BROWSER_REVIEW_PASSWORD to review auth pages.");
    return;
  }

  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: /admin access/i })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /enter admin dashboard/i }).click();
  await page.waitForURL(/\/admin(?:\?.*)?$/);
}

for (const route of reviewRoutes) {
  test(`${route.slug} renders cleanly`, async ({ page }, testInfo) => {
    if (route.requiresAuth) {
      await signInIfConfigured(page);
    }

    await page.goto(route.path);
    await page.waitForLoadState("networkidle");

    if (!route.requiresAuth) {
      await expect(page).toHaveURL(new RegExp(`${route.path === "/" ? "/?$" : route.path.replace("/", "\\/")}(?:\\?.*)?$`));
    }

    const metrics = await collectMetrics(page);
    await saveReviewArtifact(page, testInfo.project.name, route.slug, metrics);
  });
}
