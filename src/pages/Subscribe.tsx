
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

export default function Subscribe() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-xl">SharedAI Chat</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/app">
              <Button variant="ghost" size="sm">
                Go to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-12 grid place-items-center">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Premium Subscription</h1>
            <p className="text-muted-foreground">
              Unlock the full potential of SharedAI Chat
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Premium Plan</CardTitle>
              <CardDescription>$19 per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Unlimited shared chats
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Advanced AI capabilities
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Up to 10 users per chat
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Priority support
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Subscribe Now
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Payment is secured by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container flex justify-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} SharedAI Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
