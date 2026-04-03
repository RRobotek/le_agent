import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex h-full w-full bg-zinc-950">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        Select an agent or create a new one.
      </main>
    </div>
  );
}
