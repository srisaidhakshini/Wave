import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted">That page doesn&rsquo;t exist.</p>
        <Link href="/app" className="btn-primary mt-6">Go to Wave</Link>
      </div>
    </div>
  );
}
