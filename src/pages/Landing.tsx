
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navbar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="text-xl">SharedAI Chat</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/app">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link to="/app">
              <Button size="sm">
                Start Chatting
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center flex-1 py-12 text-center md:py-24">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Collaborate with AI <span className="text-primary">Together</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Share AI conversations with your team, friends, or clients in real-time.
            Multiple users, one AI, unlimited possibilities.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row justify-center pt-6">
            <Link to="/app">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Shared Conversations</h3>
              <p className="text-muted-foreground">
                Invite multiple participants to collaborate in the same AI conversation in real-time.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Private & Secure</h3>
              <p className="text-muted-foreground">
                Your conversations are private and secure. You control who has access to each chat.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="mb-4 rounded-full bg-primary/10 p-3 w-fit">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Powerful AI</h3>
              <p className="text-muted-foreground">
                Leverage state-of-the-art AI to solve problems, generate ideas, and boost productivity together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Choose the plan that's right for you and start collaborating with AI today.
          </p>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Free</h3>
                <div className="mt-2 text-3xl font-bold">$0<span className="text-muted-foreground text-sm font-normal">/month</span></div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Up to 3 shared chats
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Basic AI capabilities
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Up to 3 users per chat
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/app">Get Started</Link>
              </Button>
            </div>

            {/* Premium Tier */}
            <div className="border rounded-lg p-6 bg-primary/5 border-primary relative">
              <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Popular
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold">Premium</h3>
                <div className="mt-2 text-3xl font-bold">$19<span className="text-muted-foreground text-sm font-normal">/month</span></div>
              </div>
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
              <Button className="w-full" asChild>
                <Link to="/subscribe">Subscribe Now</Link>
              </Button>
            </div>

            {/* Enterprise Tier */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="mb-4">
                <h3 className="text-xl font-bold">Enterprise</h3>
                <div className="mt-2 text-3xl font-bold">Custom<span className="text-muted-foreground text-sm font-normal"> pricing</span></div>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Custom AI integration
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Unlimited users
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Dedicated support
                </li>
                <li className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  Custom branding
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-8">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 font-semibold mb-4 md:mb-0">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>SharedAI Chat</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SharedAI Chat. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
