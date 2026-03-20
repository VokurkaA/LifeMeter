"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  Button,
  Form,
  Input,
  Label,
  TextField,
} from "@/components/ui/heroui";

type LoginFormProps = {
  apiBaseUrl: string;
  isDisabled?: boolean;
};

function extractErrorMessage(text: string, contentType: string | null, apiBaseUrl: string) {
  const trimmed = text.trim();

  if (
    contentType?.includes("text/html") ||
    trimmed.startsWith("<!DOCTYPE html>") ||
    trimmed.startsWith("<html")
  ) {
    return `The local auth proxy returned HTML instead of JSON. Check that the upstream API is running and that NEXT_PUBLIC_API_URL points to the backend origin. Current upstream API base: ${apiBaseUrl}`;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed.error || parsed.message || "Login failed";
  } catch {
    return trimmed || "Login failed";
  }
}

export function LoginForm({ apiBaseUrl, isDisabled = false }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const text = await response.text();
        const contentType = response.headers.get("content-type");
        throw new Error(extractErrorMessage(text, contentType, apiBaseUrl));
      }

      const sessionResponse = await fetch("/api/auth/get-session", {
        credentials: "include",
        cache: "no-store",
      });

      if (!sessionResponse.ok) {
        const text = await sessionResponse.text();
        const contentType = sessionResponse.headers.get("content-type");
        throw new Error(extractErrorMessage(text, contentType, apiBaseUrl));
      }

      const sessionPayload = await sessionResponse.json();

      if (!sessionPayload?.user) {
        throw new Error(
          "Sign-in succeeded, but no local session cookie was available on the next request.",
        );
      }

      router.replace("/admin");
      router.refresh();
    } catch (submitError: any) {
      setError(submitError?.message || "Login failed");
      setIsPending(false);
      return;
    }

    setIsPending(false);
  }

  return (
    <Form className="grid gap-4" onSubmit={handleSubmit}>
      <TextField name="email" type="email" isRequired>
        <Label>Email</Label>
        <Input
          autoComplete="email"
          disabled={isDisabled}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@lifemeter.app"
          value={email}
          variant="secondary"
        />
      </TextField>

      <TextField name="password" type="password" isRequired>
        <Label>Password</Label>
        <Input
          autoComplete="current-password"
          disabled={isDisabled}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          type="password"
          value={password}
          variant="secondary"
        />
      </TextField>

      {error ? (
        <Alert status="danger">
          <AlertContent>
            <AlertTitle>Sign in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </AlertContent>
        </Alert>
      ) : null}

      <Button
        fullWidth
        isDisabled={isDisabled}
        isPending={isPending}
        type="submit"
        variant="primary"
      >
        Sign in
      </Button>

      <p className="admin-muted-copy text-sm">
        Use a Better Auth account that already has the `admin` role.
      </p>
    </Form>
  );
}
