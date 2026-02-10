"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, Pause, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatternSelector } from "./PatternSelector";
import { useToast } from "@/components/ui/toast";
import type { ExecutionPattern, DistributionMode } from "@/types";

interface ExecutionControlsProps {
  level: "project" | "sprint" | "task";
  id: string;
  status: string;
  onStatusChange?: () => void;
  showPatternSelector?: boolean;
}

type ExecutionAction = "run" | "pause" | "cancel";

export function ExecutionControls({
  level,
  id,
  status,
  onStatusChange,
  showPatternSelector = false,
}: ExecutionControlsProps) {
  const [pattern, setPattern] = useState<ExecutionPattern | null>(null);
  const [distribution, setDistribution] = useState<DistributionMode>("single");
  const { addToast } = useToast();

  const executionMutation = useMutation({
    mutationFn: async (action: ExecutionAction) => {
      const body: Record<string, unknown> = { level, id, action };
      if (pattern) body.pattern = pattern;
      if (distribution) body.distribution = distribution;
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Execution failed");
      }

      const data = await response.json();
      return { action, data };
    },
    onSuccess: ({ action, data }) => {
      if (action === "run") {
        if (data?.tasks_started) {
          const patternInfo = data.pattern ? ` with ${data.pattern} pattern` : "";
          addToast(
            `Execution started — ${data.tasks_started} task${data.tasks_started === 1 ? "" : "s"} running${patternInfo}`,
            "success"
          );
        } else {
          addToast("Execution started", "success");
        }
      } else if (action === "pause") {
        addToast("Execution paused", "info");
      } else if (action === "cancel") {
        addToast("Execution cancelled", "info");
      }
      onStatusChange?.();
    },
    onError: (error: Error) => {
      addToast(`Execution failed: ${error.message}`, "error");
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
      {showPatternSelector && (
        <PatternSelector
          pattern={pattern}
          distribution={distribution}
          onPatternChange={setPattern}
          onDistributionChange={setDistribution}
        />
      )}

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
