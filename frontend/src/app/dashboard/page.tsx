import { getInitialTasks } from "@/actions/tasks";
import { TaskCommandCenter } from "./components/TaskCommandCenter";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialData = await getInitialTasks();

  return (
    <TaskCommandCenter
      initialTasks={initialData.tasks}
      initialTotal={initialData.total}
    />
  );
}
