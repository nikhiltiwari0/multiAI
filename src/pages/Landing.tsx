import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-8 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">SharedAI</h1>
          <nav>
            <ul className="flex gap-6">
              <li>
                <Link to="/auth" className="hover:underline">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/chat-demo" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Chat Demo
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8">Welcome to SharedAI</h2>
          <p className="text-xl text-gray-600 mb-10">
            A platform for real-time communication and AI collaboration.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
            <div className="p-8 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-semibold mb-4">Real-time Chat</h3>
              <p className="text-gray-600 mb-6">
                Experience seamless real-time messaging with automatic updates and notifications.
              </p>
              <Link to="/chat-demo" className="inline-block px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                Try Chat Demo
              </Link>
            </div>
            
            <div className="p-8 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-semibold mb-4">Full Application</h3>
              <p className="text-gray-600 mb-6">
                Sign in to explore the complete suite of features available in SharedAI.
              </p>
              <Link to="/auth" className="inline-block px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} SharedAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" to="/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 15V6" />
            <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            <path d="M12 12H3" />
            <path d="M16 6H3" />
            <path d="M12 18H3" />
          </svg>
          <span className="ml-2 text-xl font-bold">Shared AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {user ? (
            <Link to="/app">
              <Button>Go to App</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Shared AI Chat Experience
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Chat with both AI and team members in a collaborative environment. Tag the AI with @AI to get responses or tag team members for targeted conversations.
                </p>
              </div>
              <div className="space-x-4">
                {user ? (
                  <Link to="/app">
                    <Button>Go to App</Button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button>Get Started</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Collaborate with AI and Team
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform combines the power of AI assistance with seamless team collaboration.
                </p>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">@AI Tagging</h3>
                  <p className="text-muted-foreground">
                    Just tag @AI in your message to get responses from our intelligent AI assistant.
                  </p>
                </div>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">Team Mentions</h3>
                  <p className="text-muted-foreground">
                    Tag team members with @username to direct conversations and get their attention.
                  </p>
                </div>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">Multiple Chats</h3>
                  <p className="text-muted-foreground">
                    Create different chat rooms for various projects and discussions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          © 2025 Shared AI. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          {/* <Link className="text-xs hover:underline underline-offset-4" to="/">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" to="/">
            Privacy
          </Link> */}
        </nav>
      </footer>
    </div>
  );
}
