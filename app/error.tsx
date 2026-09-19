"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">An unexpected error occurred. Your data is safe.</p>
        <button className="btn-primary mt-6" onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
