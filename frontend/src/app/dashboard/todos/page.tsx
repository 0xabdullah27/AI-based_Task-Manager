import { getInitialTasks } from "@/actions/tasks";
import { TaskCommandCenter } from "../components/TaskCommandCenter";

export default async function TodosPage() {
  const initialData = await getInitialTasks();

  return (
    <TaskCommandCenter
      initialTasks={initialData.tasks}
      initialTotal={initialData.total}
    />
  );
}
