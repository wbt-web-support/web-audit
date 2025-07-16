import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button variant="outline" size="sm">
        <LogOut className="h-4 w-4 lg:before:mr-2" />
        <span className="hidden lg:block">Logout</span>
      </Button>
    </form>
  );
}
