"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Turnstile from "@/components/turnstile";
import { useUserStore } from "@/store/userStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const setUserRole = useUserStore((state) => state.setUserRole);
  const handleVerify = (token: string) => {
    setToken(token);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    if (!token) {
      setError("Please complete the CAPTCHA verification");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Now proceed with the Supabase authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: token, // Pass the Turnstile token to Supabase
        },
      });
      
      if (signInError) {
        throw signInError;
      }
      
      if (data?.user) {
        // Successful login
        router.push("/protected"); // or your default authenticated route
        router.refresh(); // Refresh the page to update auth state
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
      console.error(err);
      // Reset Turnstile if there's an error
      // We're setting the token to null, but keeping the isLoading to false
      setToken(null);
      
      // Force refresh the Turnstile component
      // This will create a new instance of the Turnstile widget
      const turnstileContainer = document.getElementById('turnstile-container');
      if (turnstileContainer) {
        turnstileContainer.innerHTML = '';
        (window as any).turnstile?.render('#turnstile-container', {
          sitekey: '0x4AAAAAABBaVePB9txPEfir',
          callback: handleVerify,
          theme: 'light'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Image 
            src="/logo.png" 
            alt="Utilitek Solutions Logo" 
            width={150} 
            height={150}
            className="h-20 w-auto"
            priority
          />
        </div>
        
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Employee Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember" 
                  checked={rememberMe} 
                  onCheckedChange={(checked) => setRememberMe(checked === "indeterminate" ? false : checked)} 
                />
                <Label 
                  htmlFor="remember" 
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              
              {/* Turnstile CAPTCHA */}
              <div className="my-4 h-50" id="turnstile-container">
                <Turnstile 
                  siteKey="0x4AAAAAABBaVePB9txPEfir" 
                  onVerify={handleVerify}
                  theme="light"
                />
                {!token && error && (
                  <p className="text-sm text-red-500 mt-2">Please complete the CAPTCHA verification</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-[#f6733c] hover:bg-[#e45f2d]" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        
        </Card>
      </div>
    </div>
  );
}