"use client";

import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { TaskCreateInput } from "@/lib/validations/task";

import { useState } from "react";

export default function CreateTaskPage() {
  const router = useRouter();
  const { createTask, isLoading } = useTasks();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleCreateTask = async (data: TaskCreateInput) => {
    try {
      await createTask(data);
      toast.success("Task created successfully");
      setIsRedirecting(true);
      router.push("/dashboard/todos");
    } catch (error) {
      toast.error("Failed to create task");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          disabled={isLoading || isRedirecting}
          className="cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
          <p className="text-muted-foreground text-sm">
            Add a new task to your list with priority, tags, and description.
          </p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            onSubmit={handleCreateTask}
            onCancel={() => router.back()}
            isLoading={isLoading || isRedirecting}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
