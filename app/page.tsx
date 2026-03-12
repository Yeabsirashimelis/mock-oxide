import Link from "next/link";
import { getServerSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function Home() {
  try {
    const session = await getServerSession();
    if (session) {
      redirect("/dashboard");
    }
  } catch {
    // Session check failed, continue to show landing page
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono text-blue-400">{"{ }"}</span>
            <span className="font-bold">Mock API Playground</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Build Mock APIs in Seconds
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            Define a JSON schema, get a public URL that returns realistic mock data.
            Perfect for frontend development, testing, and prototyping.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Start Building
            </Link>
            <Link
              href="#features"
              className="px-6 py-3 border border-zinc-700 hover:border-zinc-600 rounded-lg font-medium transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Code Preview */}
        <div className="mt-16 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-sm text-zinc-500 font-mono">schema.json</span>
          </div>
          <pre className="p-6 text-sm font-mono overflow-x-auto">
            <code className="text-zinc-300">
{`{
  "id": "uuid",
  "name": "fullName",
  "email": "email",
  "avatar": "avatar",
  "role": "enum:admin,user,guest",
  "age": "integer:18-65",
  "active": "boolean",
  "createdAt": "datetime"
}`}
            </code>
          </pre>
        </div>

        {/* Features */}
        <div id="features" className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-400 text-xl">{"{ }"}</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Schema-Based</h3>
            <p className="text-zinc-400">
              Define your data structure with a simple JSON schema. Support for 50+ data types.
            </p>
          </div>

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-400 text-xl">&lt;/&gt;</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">REST & CRUD</h3>
            <p className="text-zinc-400">
              Full REST support with GET, POST, PUT, PATCH, DELETE. Stateful CRUD operations.
            </p>
          </div>

          <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-400 text-xl">#</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant URLs</h3>
            <p className="text-zinc-400">
              Get shareable URLs immediately. Use them in your frontend, tests, or demos.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-24">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-zinc-500">
          <p>Mock API Playground - Build APIs without a backend</p>
        </div>
      </footer>
    </div>
  );
}
