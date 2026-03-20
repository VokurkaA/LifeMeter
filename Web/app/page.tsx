import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  Download,
  Shield,
  Sparkles,
  TimerReset,
  Waves,
} from "lucide-react";
import heroImage from "../../App/src/assets/running_group.webp";
import workoutImage from "../../App/src/assets/workout.webp";
import nutritionImage from "../../App/src/assets/food.webp";
import sleepImage from "../../App/src/assets/sleep.webp";
import logoImage from "../../App/src/assets/logo.png";
import {
  Card,
  CardDescription,
  CardHeader,
  Chip,
  Link,
  Surface,
} from "@/components/ui/heroui";

const apkUrl = "/downloads/android/latest";

const heroMetrics = [
  {
    label: "Tracks",
    value: "4 systems",
    body: "Workouts, meals, sleep, and progress live in one daily view.",
  },
  {
    label: "Built for",
    value: "Normal discipline",
    body: "Fast enough to use when time is short and motivation is average.",
  },
  {
    label: "Current release",
    value: "Android beta",
    body: "Direct APK install for people who want the live product now.",
  },
];

const heroSupportCards = [
  {
    title: "One rhythm",
    body: "The habits that shape a week stay in the same story instead of four apps.",
    icon: Waves,
  },
  {
    title: "Offline-aware",
    body: "Queue-first flows are built for real usage, not perfect network conditions.",
    icon: Shield,
  },
  {
    title: "Fast logging",
    body: "Compact inputs keep the product from turning into admin work.",
    icon: TimerReset,
  },
];

const principleCards = [
  {
    title: "Friction stays low",
    body:
      "Repeated workouts, familiar meals, and compact inputs make logging realistic on ordinary days.",
    icon: TimerReset,
  },
  {
    title: "Context stays intact",
    body:
      "Training, food, sleep, and progress stay close enough to explain one another instead of competing for attention.",
    icon: Waves,
  },
  {
    title: "The product is real",
    body:
      "Android beta, account flows, and admin tooling already exist, so the page is pointing at a live product rather than a concept.",
    icon: Shield,
  },
];

const heroMetricTags = ["Training", "Meals", "Sleep", "Progress"];
const primaryHeroMetric = heroMetrics[0];
const secondaryHeroMetrics = heroMetrics.slice(1);
const primaryHeroSupport = heroSupportCards[0];
const secondaryHeroSupports = heroSupportCards.slice(1);
const primaryPrinciple = principleCards[0];
const secondaryPrinciples = principleCards.slice(1);
const PrimaryHeroSupportIcon = primaryHeroSupport.icon;
const PrimaryPrincipleIcon = primaryPrinciple.icon;

const systemCards = [
  {
    id: "training",
    eyebrow: "Training",
    title: "Repeat workouts without the setup tax.",
    body:
      "Templates, live session visibility, and recent history are arranged to help you start and keep moving.",
    points: [
      "Begin from a template or a recent session instead of re-entering everything.",
      "Keep the active workout visible while you train.",
      "Return to recent history without digging through menus.",
    ],
    image: workoutImage,
    imageClassName: "object-[center_36%]",
    spanClassName: "lg:col-span-7",
    layout: "split",
  },
  {
    id: "nutrition",
    eyebrow: "Nutrition",
    title: "Track meals without turning food into paperwork.",
    body:
      "Macro targets remain clear, repeat logging stays quick, and the daily picture stays readable.",
    points: [
      "See targets and intake in the same glance.",
      "Reuse familiar foods instead of starting from zero each time.",
      "Keep enough detail to make decisions without building a spreadsheet habit.",
    ],
    image: nutritionImage,
    imageClassName: "object-[center_52%]",
    spanClassName: "lg:col-span-5",
    layout: "stack",
  },
  {
    id: "recovery",
    eyebrow: "Recovery",
    title: "Put sleep beside effort, not in a forgotten tab.",
    body:
      "Bedtime rhythm and total sleep sit next to the rest of the picture, so recovery actually shapes decisions.",
    points: [
      "Keep sleep context near training and nutrition.",
      "Make rough mornings legible instead of mysterious.",
      "See recovery as part of the system rather than extra trivia.",
    ],
    image: sleepImage,
    imageClassName: "object-[center_54%]",
    spanClassName: "lg:col-span-5",
    layout: "stack",
  },
];

const proofItems = [
  {
    title: "Android beta release",
    body: "The page can send people straight into the current APK.",
    icon: Download,
  },
  {
    title: "Account-backed product",
    body: "Authentication and real routes already exist, so the product is built around actual usage.",
    icon: Shield,
  },
  {
    title: "Offline-aware mindset",
    body: "Queue and reconnect thinking matters because logging happens in real life, not ideal Wi-Fi.",
    icon: Waves,
  },
  {
    title: "Operational visibility",
    body: "Admin routes and tooling are already part of the system behind the interface.",
    icon: Sparkles,
  },
];

const installSteps = [
  "Download the APK on your Android device.",
  "Allow installation from the current source if Android asks.",
  "Finish the install, then create an account or sign in.",
  "Use the first week to capture a normal routine, not a perfect one.",
];

export const metadata: Metadata = {
  title: "LifeMeter | One daily view for training, meals, sleep, and progress",
  description:
    "LifeMeter is the Android beta for people who want workouts, meals, sleep, and progress in one calm daily dashboard.",
};

export default function HomePage() {
  return (
    <div className="landing-shell">
      <header className="landing-frame relative flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:py-8">
        <Link className="flex items-center gap-3" href="/">
          <Image alt="LifeMeter" className="landing-logo h-11 w-11" priority src={logoImage} />
          <div>
            <p className="landing-text-strong text-lg font-semibold tracking-[0.08em]">LifeMeter</p>
            <p className="landing-text-dim text-xs uppercase tracking-[0.3em]">
              Daily health companion
            </p>
          </div>
        </Link>

        <nav
          aria-label="Primary"
          className="landing-text-muted flex w-full items-center justify-between gap-4 text-sm sm:w-auto sm:justify-start sm:gap-6"
        >
          <Link className="landing-inline-link" href="#why">
            Why it works
          </Link>
          <Link className="landing-inline-link" href="#download">
            Download
          </Link>
          <Link className="landing-inline-link" href="/admin/login">
            Admin
          </Link>
        </nav>
      </header>

      <main className="relative space-y-18 pb-8 pt-8 sm:space-y-24 sm:pb-12 sm:pt-12 md:space-y-28 md:pb-14 md:pt-14 lg:space-y-32 lg:pt-16">
        <section className="landing-frame landing-section">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)] lg:items-stretch xl:gap-20">
            <div className="flex h-full flex-col gap-7 sm:gap-10 lg:gap-12">
              <div className="space-y-6 sm:space-y-7">
                <div className="flex flex-wrap items-center gap-4">
                  <Chip className="landing-beta-chip" color="accent" variant="soft">
                    Android beta ready
                  </Chip>
                  <p className="landing-chip-copy">
                    Built for people who want one honest daily signal instead of four disconnected
                    health apps.
                  </p>
                </div>

                <div className="space-y-6 sm:space-y-7">
                  <h1 className="landing-display landing-text-strong max-w-5xl text-[3rem] leading-[0.9] text-balance sm:text-[4.15rem] md:text-[5.1rem] lg:text-[5.55rem]">
                    Train, eat, recover, and
                    <span className="landing-highlight block">
                      keep the whole trend line in view.
                    </span>
                  </h1>
                  <p className="landing-text-muted max-w-xl text-base leading-8 sm:text-lg sm:leading-9 md:text-xl">
                    LifeMeter is the mobile health companion for people who need a calm daily
                    dashboard, not a maze of disconnected tabs. Log quickly, spot drift earlier,
                    and adjust before one rough day becomes a rough month.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link className="landing-button-primary w-full justify-center sm:w-auto" href={apkUrl}>
                  Install Android beta
                  <Download className="h-4 w-4" />
                </Link>
                <Link
                  className="landing-button-secondary w-full justify-center sm:w-auto"
                  href="#systems"
                >
                  See what is inside
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-auto grid gap-4 sm:gap-5 md:grid-cols-[minmax(0,1.14fr)_minmax(240px,0.86fr)]">
                <Card className="landing-panel h-full min-h-48">
                  <CardHeader className="flex h-full flex-col gap-5 p-5 sm:p-7">
                    <CardDescription className="landing-text-dim">{primaryHeroMetric.label}</CardDescription>
                    <p className="landing-display landing-text-strong text-[2.2rem] leading-none sm:text-[2.7rem]">
                      {primaryHeroMetric.value}
                    </p>
                    <p className="landing-text-soft max-w-sm text-sm leading-7 sm:text-base">
                      {primaryHeroMetric.body}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2.5 pt-3">
                      {heroMetricTags.map((tag) => (
                        <span className="landing-tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 md:grid-cols-1">
                  {secondaryHeroMetrics.map((metric) => (
                    <Card className="landing-panel h-full min-h-36" key={metric.label}>
                      <CardHeader className="flex h-full flex-col gap-4 p-5 sm:p-6">
                        <CardDescription className="landing-text-dim">{metric.label}</CardDescription>
                        <p className="landing-display landing-text-strong text-[1.55rem] leading-none sm:text-[1.8rem]">
                          {metric.value}
                        </p>
                        <p className="landing-text-soft mt-auto text-sm leading-6">{metric.body}</p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative h-full">
              <Surface className="landing-panel-hero relative flex h-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
                <div className="landing-divider landing-text-dim flex min-h-14 items-center justify-between border-b px-3 pb-4 text-[0.68rem] uppercase tracking-[0.22em] sm:pb-5 sm:text-[0.72rem] sm:tracking-[0.26em]">
                  <span>Daily rhythm</span>
                  <span>Repeatable, not noisy</span>
                </div>

                <div className="flex h-full flex-col gap-5 pt-4 sm:gap-6 sm:pt-5">
                  <div className="landing-image-frame relative">
                    <Image
                      alt="People running together outdoors"
                      className="h-90 w-full object-cover object-[center_38%] sm:h-125 lg:h-150"
                      placeholder="blur"
                      priority
                      sizes="(min-width: 1280px) 560px, (min-width: 1024px) 46vw, 100vw"
                      src={heroImage}
                    />
                    <div className="landing-image-veil absolute inset-0" />
                    <div className="absolute inset-x-0 bottom-0 space-y-4 p-5 sm:p-7">
                      <p className="landing-image-kicker text-xs uppercase tracking-[0.3em]">
                        Quiet enough for daily use
                      </p>
                      <p className="landing-image-text max-w-md font-(--font-body) text-2xl leading-tight sm:text-3xl">
                        The interface is shaped to keep context close and friction low when
                        motivation is average.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1.12fr)_minmax(240px,0.88fr)] md:gap-5">
                    <Card className="landing-panel-soft h-full">
                      <CardHeader className="flex h-full flex-col items-start gap-5 p-5 sm:p-7">
                        <div className="landing-icon-wrap">
                          <PrimaryHeroSupportIcon className="h-5 w-5 text-[rgba(245,202,155,0.9)]" />
                        </div>
                        <div className="space-y-3">
                          <p className="landing-text-strong text-xl font-semibold sm:text-2xl">
                            {primaryHeroSupport.title}
                          </p>
                          <CardDescription className="landing-text-low max-w-md text-sm leading-7 sm:text-base">
                            {primaryHeroSupport.body}
                          </CardDescription>
                        </div>
                        <p className="landing-divider landing-text-faint mt-auto max-w-md border-t pt-5 text-sm leading-7">
                          One calm surface is easier to trust than four dashboards all trying to
                          look important at once.
                        </p>
                      </CardHeader>
                    </Card>

                    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 md:grid-cols-1">
                      {secondaryHeroSupports.map((card) => {
                        const Icon = card.icon;

                        return (
                          <Card className="landing-panel h-full" key={card.title}>
                            <CardHeader className="flex h-full flex-col items-start gap-4 p-5 sm:p-6">
                              <Icon className="h-5 w-5 text-[rgba(245,202,155,0.88)]" />
                              <p className="landing-text-strong text-base font-semibold sm:text-lg">{card.title}</p>
                              <CardDescription className="landing-text-low mt-auto text-sm leading-6">
                                {card.body}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Surface>
            </div>
          </div>
        </section>

        <section className="landing-frame landing-section" id="why">
          <Surface className="landing-panel p-5 sm:p-9 md:p-11 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] xl:gap-14">
              <div className="space-y-5">
                <p className="landing-kicker">Why it works</p>
                <h2 className="landing-display landing-text-strong max-w-lg text-3xl leading-tight text-balance sm:text-4xl md:text-5xl">
                  Built for ordinary discipline, not peak-motivation fantasy.
                </h2>
                <p className="landing-text-soft max-w-md text-base leading-7 sm:text-lg sm:leading-8">
                  Good health tools do not just collect more numbers. They help you keep a steady
                  read on the routines that already shape your week, even when nothing about the
                  day feels especially heroic.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Card className="landing-panel-soft h-full md:col-span-2">
                  <CardHeader className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_minmax(240px,0.9fr)] lg:items-start">
                    <div className="landing-icon-wrap">
                      <PrimaryPrincipleIcon className="h-5 w-5 text-[rgba(245,202,155,0.9)]" />
                    </div>
                    <div className="space-y-3">
                      <p className="landing-text-strong text-lg font-semibold leading-tight sm:text-xl">
                        {primaryPrinciple.title}
                      </p>
                      <CardDescription className="landing-text-low max-w-xl text-sm leading-7 sm:text-base">
                        {primaryPrinciple.body}
                      </CardDescription>
                    </div>
                    <div className="grid gap-2">
                      {[
                        "Templates keep repeated workouts moving.",
                        "Familiar meals are quick to log again.",
                        "Compact inputs cut the second-job feeling.",
                      ].map((item) => (
                        <div className="landing-note-box" key={item}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                </Card>

                {secondaryPrinciples.map((card) => {
                  const Icon = card.icon;

                  return (
                    <Card className="landing-panel-soft h-full" key={card.title}>
                      <CardHeader className="items-start gap-5 p-5 sm:p-7">
                        <div className="landing-icon-wrap">
                          <Icon className="h-5 w-5 text-[rgba(245,202,155,0.9)]" />
                        </div>
                        <div className="space-y-3">
                          <p className="landing-text-strong text-lg font-semibold leading-tight sm:text-xl">
                            {card.title}
                          </p>
                          <CardDescription className="landing-text-low text-sm leading-7 sm:text-base">
                            {card.body}
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          </Surface>
        </section>

        <section className="landing-frame landing-section space-y-10 sm:space-y-12" id="systems">
          <div className="flex flex-wrap items-end justify-between gap-6 sm:gap-8">
            <div className="max-w-2xl space-y-5">
              <p className="landing-kicker">What is inside</p>
              <h2 className="landing-display landing-text-strong text-3xl text-balance sm:text-4xl md:text-5xl">
                Four parts of the same system, arranged to stay usable.
              </h2>
            </div>
            <p className="landing-text-soft max-w-xl text-sm leading-7 sm:text-base">
              The point is not to collect more information. The point is to make the information
              you already care about easier to act on because it shows up in one narrative.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
            {systemCards.map((card) => (
              <Surface
                className={`${card.spanClassName} ${card.layout === "split" ? "landing-panel" : "landing-panel-soft"} overflow-hidden p-4 sm:p-5 lg:p-6`}
                key={card.id}
              >
                {card.layout === "split" ? (
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,0.86fr)_minmax(280px,1.14fr)] xl:items-end xl:gap-8">
                    <div className="space-y-6 p-3 sm:p-4 lg:p-5">
                      <div className="space-y-4">
                        <p className="landing-kicker">{card.eyebrow}</p>
                        <h3 className="landing-display landing-text-strong max-w-lg text-[1.95rem] leading-tight text-balance sm:text-3xl">
                          {card.title}
                        </h3>
                        <p className="landing-text-soft max-w-lg text-sm leading-7 sm:text-base sm:leading-8">
                          {card.body}
                        </p>
                      </div>

                      <ul className="landing-text-soft grid gap-3 text-sm leading-6">
                        {card.points.map((point) => (
                          <li className="landing-point" key={point}>
                            <span className="landing-point-dot" aria-hidden="true" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="landing-image-frame relative">
                      <Image
                        alt={card.title}
                        className={`h-65 w-full object-cover transition-transform duration-500 hover:scale-[1.03] sm:h-85 xl:h-95 ${card.imageClassName}`}
                        placeholder="blur"
                        sizes="(min-width: 1280px) 430px, (min-width: 1024px) 36vw, 100vw"
                        src={card.image}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-7">
                    <div className="landing-image-frame relative">
                      <Image
                        alt={card.title}
                        className={`h-60 w-full object-cover transition-transform duration-500 hover:scale-[1.03] sm:h-73.75 ${card.imageClassName}`}
                        placeholder="blur"
                        sizes="(min-width: 1280px) 360px, (min-width: 1024px) 31vw, 100vw"
                        src={card.image}
                      />
                    </div>

                    <div className="space-y-5 p-3 sm:p-4 lg:p-5">
                      <div className="space-y-4">
                        <p className="landing-kicker">{card.eyebrow}</p>
                        <h3 className="landing-display landing-text-strong max-w-md text-[1.8rem] leading-tight text-balance sm:text-3xl">
                          {card.title}
                        </h3>
                        <p className="landing-text-soft text-sm leading-7 sm:text-base sm:leading-8">
                          {card.body}
                        </p>
                      </div>

                      <ul className="landing-text-soft grid gap-3 text-sm leading-6">
                        {card.points.map((point) => (
                          <li className="landing-point" key={point}>
                            <span className="landing-point-dot" aria-hidden="true" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </Surface>
            ))}

            <Surface className="landing-panel-soft lg:col-span-7 p-5 sm:p-8 md:p-10 lg:p-11">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] xl:items-start xl:gap-10">
                <div className="space-y-5">
                  <p className="landing-kicker">Product status</p>
                  <h3 className="landing-display landing-text-strong text-[1.95rem] leading-tight text-balance sm:text-3xl md:text-4xl">
                    The beta already has the boring but essential parts.
                  </h3>
                  <p className="landing-text-soft max-w-md text-sm leading-7 sm:text-base sm:leading-8">
                    Reliable health products need more than attractive cards. The stack beneath the
                    interface is already being shaped for real usage, not just screenshots.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {proofItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Card className="landing-proof-tile h-full" key={item.title}>
                        <CardHeader className="gap-4 p-5 sm:p-6">
                          <div className="landing-icon-wrap">
                            <Icon className="h-5 w-5 text-[rgba(245,202,155,0.9)]" />
                          </div>
                          <div className="space-y-2">
                            <p className="landing-text-strong text-base font-semibold leading-tight">
                              {item.title}
                            </p>
                            <CardDescription className="landing-text-low text-sm leading-6">
                              {item.body}
                            </CardDescription>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </Surface>
          </div>
        </section>

        <section className="landing-frame landing-section" id="download">
          <Surface className="landing-panel-hero p-5 sm:p-9 md:p-11 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.98fr)] lg:items-start lg:gap-12">
              <div className="space-y-6">
                <div className="space-y-5">
                  <p className="landing-kicker">Download</p>
                  <h2 className="landing-display landing-text-strong max-w-2xl text-[2rem] leading-tight text-balance sm:text-3xl md:text-4xl">
                    Install the Android beta and make the first week useful.
                  </h2>
                  <p className="landing-text-soft max-w-2xl text-base leading-7 sm:text-lg sm:leading-8">
                    The goal is simple: get the APK onto your phone, sign in, and start capturing
                    a normal week of training, food, and sleep. That is when the daily signal gets
                    honest.
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                  <Link className="landing-button-primary w-full justify-center sm:w-auto" href={apkUrl}>
                    Install Android beta
                    <Download className="h-4 w-4" />
                  </Link>
                  <Link
                    className="landing-button-secondary w-full justify-center sm:w-auto"
                    href="/admin/login"
                  >
                    Open admin console
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <p className="landing-text-faint text-sm leading-7">
                  Android is the only supported platform in this release. The web presence is here
                  to get people into the product quickly, not distract them with extra marketing
                  loops.
                </p>
              </div>

              <div className="grid gap-4">
                {installSteps.map((step, index) => (
                  <div className="landing-step" key={step}>
                    <div className="landing-step-index">{index + 1}</div>
                    <p className="landing-text-soft text-sm leading-7 sm:text-base">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </Surface>
        </section>
      </main>

      <footer className="landing-divider landing-frame relative mt-16 border-t py-10 md:mt-24 lg:py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image alt="LifeMeter" className="landing-logo h-10 w-10" src={logoImage} />
              <div>
                <p className="landing-text-strong text-base font-semibold tracking-[0.08em]">LifeMeter</p>
                <p className="landing-text-ghost text-xs uppercase tracking-[0.28em]">
                  Training, meals, sleep, progress
                </p>
              </div>
            </div>
            <p className="landing-text-faint max-w-xl text-sm leading-7">
              A focused mobile health companion for people who want one daily signal instead of a
              stack of disconnected tools.
            </p>
          </div>

          <div className="landing-text-soft flex flex-wrap gap-3 text-sm md:justify-end">
            <Link className="landing-nav-link" href="#why">
              Why it works
            </Link>
            <Link className="landing-nav-link" href="#systems">
              What is inside
            </Link>
            <Link className="landing-nav-link" href="#download">
              Download
            </Link>
            <Link className="landing-nav-link" href="/admin/login">
              Admin console
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
