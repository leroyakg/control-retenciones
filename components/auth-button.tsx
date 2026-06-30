import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
// import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  if (!user) {
    return (
      <Button asChild size="lg" variant="outline">
        <Link href="/auth/login">Iniciar sesión</Link>
      </Button>
    );
  }

  return (
    <Button asChild size="lg">
      <Link href="/dashboard">Ir al panel</Link>
    </Button>
  );
}
