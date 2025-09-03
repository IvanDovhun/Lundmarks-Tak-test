import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Redirect } from "wouter";
import { useState, useEffect } from "react";
import logoSrc from '../icons/logo.png';

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" },
  });

  // Clear error message on input change
  useEffect(() => {
    const subscription = loginForm.watch(() => {
      if (errorMessage) {
        setErrorMessage(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [loginForm, errorMessage]);

  // Show error if login mutation fails
  useEffect(() => {
    if (loginMutation.isError) {
      setErrorMessage("Fel lösenord/användarnamn");
    }
  }, [loginMutation.isError]);

  const handleSubmit = (data: InsertUser) => {
    // Check if fields are empty
    if (!data.username || !data.password) {
      setErrorMessage("Fel lösenord/användarnamn");
      return;
    }
    loginMutation.mutate(data);
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="items-center">
        <Card className="login-box">
          <CardHeader>
            <img src={logoSrc} className="login-logo"/>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="login-text">Användarnamn</FormLabel>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="login-text">Lösenord</FormLabel>
                      <Input type="password" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {errorMessage && (
                  <div className="text-red-500 text-sm font-medium">{errorMessage}</div>
                )}
                <Button type="submit" className="login-button" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Loggar in..." : "Logga in"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}