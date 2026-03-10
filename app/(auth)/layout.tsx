export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <span className="text-2xl">{"{ }"}</span>
          <span>Mock API Playground</span>
        </h2>
      </div>
      {children}
    </div>
  );
}
