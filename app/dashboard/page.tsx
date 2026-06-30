import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function ValidateAuth() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="text-sm font-mono p-3 rounded border max-h-32 overflow-auto">
      {JSON.stringify(data.claims, null, 2)}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <h1>Dashboard
        <Suspense>
          <ValidateAuth />
        </Suspense>
      </h1>
    </main>
  )
}