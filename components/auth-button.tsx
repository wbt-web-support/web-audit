import { NavButton } from "./ui/nav-button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <NavButton href="/auth/login" size="sm" variant="outline">
        Sign in
      </NavButton>
      <NavButton href="/auth/sign-up" size="sm" variant="default">
        Sign up
      </NavButton>
    </div>
  );
}
