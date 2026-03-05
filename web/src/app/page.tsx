"use client";

import Image from "next/image";
import { Button, Card, Chip, Separator, Link } from "@heroui/react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-divider bg-background/80 px-6 backdrop-blur-md md:px-12">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="LifeMeter Logo" width={32} height={32} />
          <span className="text-xl font-bold tracking-tight">LifeMeter.fit</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-medium">Admin</Link>
          <Button size="sm" variant="primary">Get the App</Button>
        </div>
      </nav>

      <main className="grow">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden py-24 px-6 text-center md:py-32 md:px-12">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,var(--accent-soft)_0%,transparent_100%)] opacity-20" />
          <Chip color="accent" variant="soft" className="mb-6 uppercase tracking-widest">Now in Beta</Chip>
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl">
            Your Health, <span className="text-primary">Measured.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            The ultimate companion for tracking your nutrition, sleep, and training. 
            Built for performance, designed for you.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="px-8 font-semibold">Download APK</Button>
            <Button size="lg" variant="outline" className="px-8 font-semibold">Learn More</Button>
          </div>
          
          <div className="mt-16 w-full max-w-5xl rounded-3xl border border-divider bg-surface-secondary/50 p-4 shadow-2xl backdrop-blur-sm">
             <div className="relative aspect-video overflow-hidden rounded-2xl">
                <Image 
                  src="/running_group.webp" 
                  alt="LifeMeter App Preview" 
                  fill 
                  className="object-cover"
                  priority
                />
             </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-7xl" />

        {/* Features Section */}
        <section className="py-24 px-6 md:px-12">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Complete Health Ecosystem</h2>
            <p className="mt-4 text-muted-foreground">Everything you need to reach your goals in one place.</p>
            
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {/* Nutrition */}
              <Card variant="secondary" className="group">
                <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                  <Image src="/food.webp" alt="Nutrition Tracking" fill className="object-cover transition-transform group-hover:scale-105" />
                </div>
                <Card.Header>
                  <Card.Title>Smart Nutrition</Card.Title>
                  <Card.Description>
                    Log meals in seconds. Track macros, micros, and water intake with AI-powered scanning.
                  </Card.Description>
                </Card.Header>
              </Card>

              {/* Sleep */}
              <Card variant="secondary" className="group">
                <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                  <Image src="/sleep.webp" alt="Sleep Tracking" fill className="object-cover transition-transform group-hover:scale-105" />
                </div>
                <Card.Header>
                  <Card.Title>Restorative Sleep</Card.Title>
                  <Card.Description>
                    Analyze sleep patterns and consistency. Wake up refreshed with data-driven insights.
                  </Card.Description>
                </Card.Header>
              </Card>

              {/* Training */}
              <Card variant="secondary" className="group">
                <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                  <Image src="/workout.webp" alt="Workout Tracking" fill className="object-cover transition-transform group-hover:scale-105" />
                </div>
                <Card.Header>
                  <Card.Title>Elite Training</Card.Title>
                  <Card.Description>
                    Track workouts, progressive overload, and recovery metrics to optimize your performance.
                  </Card.Description>
                </Card.Header>
              </Card>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section className="bg-surface-tertiary py-24 px-6 text-center md:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold md:text-4xl">Start Your Journey Today</h2>
            <p className="mt-6 text-lg text-muted-foreground">
              LifeMeter is currently in private beta. Download the latest Android package below.
            </p>
            
            <div className="mt-12 flex flex-col items-center gap-8">
              <Card className="w-full max-w-md border-primary/20">
                <Card.Header>
                  <div className="flex items-center justify-between w-full">
                    <Card.Title>Android Production</Card.Title>
                    <Chip color="accent" variant="primary">v1.2.0</Chip>
                  </div>
                  <Card.Description>Stable release for general testing.</Card.Description>
                </Card.Header>
                <Card.Footer>
                  <Button fullWidth size="lg">Download .apk</Button>
                </Card.Footer>
              </Card>
              
              <p className="text-sm text-muted-foreground">
                iOS version coming soon to the App Store. 
                <Link href="#" className="ml-1 text-primary hover:underline">Notify me</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-divider py-12 px-6 md:px-12">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="LifeMeter Logo" width={24} height={24} />
            <span className="font-bold">LifeMeter.fit</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 LifeMeter. Built with React Native, Expo, and Next.js.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Github</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
