"use client";
import { useState } from "react";
import SignIn from "@/components/sign-in";
import SignUp from "@/components/sign-up";
import { useSession } from "@/lib/auth-client";
import FoodSearchPanel from "@/features/foods/components/FoodSearchPanel";
import AuthEndpointsTester from "@/features/auth/components/AuthEndpointsTester";

export default function AuthGateway() {
  const { data, isPending } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("login");

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (data?.session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-start gap-6 p-6 w-full">
        <div className="p-6 rounded-md border w-full max-w-xl space-y-4">
          <h2 className="text-xl font-semibold">Welcome</h2>
          <pre className="text-xs whitespace-pre-wrap break-all bg-muted p-2 rounded max-h-60 overflow-auto">
            {JSON.stringify(data.session, null, 2)}
          </pre>
          <FoodSearchPanel />
          <AuthEndpointsTester />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 gap-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("login")}
          className={`px-3 py-1 rounded text-sm border ${mode === "login" ? "bg-primary text-primary-foreground" : ""}`}
        >
          Login
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`px-3 py-1 rounded text-sm border ${mode === "signup" ? "bg-primary text-primary-foreground" : ""}`}
        >
          Sign Up
        </button>
      </div>
      {mode === "login" ? (
        <SignIn onSuccess={() => { /* session refetch auto */ }} />
      ) : (
        <SignUp onSuccess={() => setMode("login")} />
      )}
      <div className="w-full max-w-xl">
        <AuthEndpointsTester />
      </div>
    </div>
  );
}