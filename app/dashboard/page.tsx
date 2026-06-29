import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/automationService";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats(session!.user.id);

  return <DashboardOverview stats={stats} />;
}
