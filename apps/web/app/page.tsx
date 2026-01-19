async function fetchApiStatus() {
  try {
    const res = await fetch('http://localhost:3001/api', { cache: 'no-store' });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    return data || { message: 'API connected' };
  } catch (error) {
    console.error('API fetch error:', error);
    return { message: 'API not connected yet' };
  }
}

export default async function Home() {
  const data = await fetchApiStatus();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Qrave Platform</h1>
      <p className="text-lg text-gray-600">Phase 0: Monorepo foundation (Next.js + NestJS)</p>
      <div className="rounded border px-4 py-2 bg-gray-50">
        <span className="font-mono text-sm">API status: {data.message}</span>
      </div>
    </main>
  );
}
