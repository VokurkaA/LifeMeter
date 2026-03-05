"use client";

import React from "react";
import { Button, Card, Form, Input, Label, TextField, Alert } from "@heroui/react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminLogin() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: loginError } = await authClient.signIn.email({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message || "Invalid credentials");
      setIsLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-6">
      <Card className="w-full max-w-md p-4">
        <Card.Header className="flex flex-col items-center gap-4 text-center">
          <Image src="/logo.svg" alt="LifeMeter Logo" width={48} height={48} />
          <div className="flex flex-col gap-1">
            <Card.Title className="text-2xl font-bold">Admin Portal</Card.Title>
            <Card.Description>Sign in to manage LifeMeter</Card.Description>
          </div>
        </Card.Header>
        
        <Form onSubmit={handleLogin}>
          <Card.Content className="flex flex-col gap-4">
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Authentication Error</Alert.Title>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            
            <TextField isRequired name="email" value={email} onChange={setEmail}>
              <Label>Email</Label>
              <Input type="email" placeholder="admin@lifemeter.fit" />
            </TextField>

            <TextField isRequired name="password" value={password} onChange={setPassword}>
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" />
            </TextField>
          </Card.Content>
          
          <Card.Footer className="mt-4">
            <Button 
              fullWidth 
              variant="primary" 
              type="submit" 
              isPending={isLoading}
            >
              Sign In
            </Button>
          </Card.Footer>
        </Form>
      </Card>
    </div>
  );
}
