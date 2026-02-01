"use client";

import { useMutation } from "@tanstack/react-query";
import { Play, Pause, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecutionControlsProps {
  level: "project" | "sprint" | "task";
  id: string;
  status: string;
  onStatusChange?: () => void;
}

type ExecutionAction = "run" | "pause" | "cancel";

export function ExecutionControls({
  level,
  id,
  status,
  onStatusChange,
}: ExecutionControlsProps) {
  const executionMutation = useMutation({
    mutationFn: async (action: ExecutionAction) => {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ level, id, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Execution failed");
      }

      return response.json();
    },
    onSuccess: () => {
      onStatusChange?.();
    },
  });

  const handleRun = () => executionMutation.mutate("run");
  const handlePause = () => executionMutation.mutate("pause");
  const handleCancel = () => executionMutation.mutate("cancel");

  const isPending = executionMutation.isPending;
  const showRun = ["draft", "ready", "paused"].includes(status);
  const showPause = status === "running";
  const showCancel = ["running", "paused"].includes(status);

  return (
    <div className="flex gap-2">
      {showRun && (
        <Button
          onClick={handleRun}
          disabled={isPending}
          variant="default"
          size="sm"
        >
          <Play className="mr-2 h-4 w-4" />
          Run
        </Button>
      )}

      {showPause && (
        <Button
          onClick={handlePause}
          disabled={isPending}
          variant="secondary"
          size="sm"
        >
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
      )}

      {showCancel && (
        <Button
          onClick={handleCancel}
          disabled={isPending}
          variant="destructive"
          size="sm"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  );
}
