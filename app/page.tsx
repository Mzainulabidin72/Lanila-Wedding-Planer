import { redirect } from "next/navigation";
import { WORKSPACE_ID } from "@/lib/mock-data";

export default function RootPage() {
  // In production this would check the signed-in profile's workspace
  // memberships and route to the right one (or /onboarding if none exist).
  redirect(`/w/${WORKSPACE_ID}/dashboard`);
}
