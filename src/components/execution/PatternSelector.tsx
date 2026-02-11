"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import type { ExecutionPattern, DistributionMode } from "@/types";
import { getPatternBadgeText, getPatternBadgeVariant } from "@/lib/status";

interface PatternSelectorProps {
  pattern: ExecutionPattern | null;
  distribution: DistributionMode;
  onPatternChange: (pattern: ExecutionPattern | null) => void;
  onDistributionChange: (distribution: DistributionMode) => void;
  entityType?: "sprints" | "tasks";
  entityId?: string;
  onSaved?: () => void;
}

export function PatternSelector({
  pattern,
  distribution,
  onPatternChange,
  onDistributionChange,
  entityType,
  entityId,
  onSaved,
}: PatternSelectorProps) {
  const [open, setOpen] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (data: { pattern: string | null; distribution: string }) => {
      const response = await fetch('/api/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entityType,
          id: entityId,
          pattern: data.pattern,
          distribution: data.distribution,
        }),
      });
      if (!response.ok) throw new Error('Failed to save pattern');
      return response.json();
    },
    onSuccess: () => {
      onSaved?.();
      setOpen(false);
    },
  });

  const handlePatternChange = (value: string) => {
    onPatternChange((value === "none" ? null : value) as ExecutionPattern | null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Pattern
          {pattern && (
            <Badge variant={getPatternBadgeVariant(pattern)} className="ml-1">
              {getPatternBadgeText(pattern)}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Execution Pattern</DialogTitle>
          <DialogDescription>
            Configure how agents execute the task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pattern Selection */}
          <div>
            <label className="text-sm font-medium">Pattern</label>
            <Select value={pattern || "none"} onValueChange={handlePatternChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Standard (no pattern)</SelectItem>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="cascade">Cascade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Distribution Selection */}
          <div>
            <label className="text-sm font-medium">Distribution</label>
            <Select value={distribution} onValueChange={onDistributionChange as (value: string) => void}>
              <SelectTrigger>
                <SelectValue placeholder="Select distribution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Agent</SelectItem>
                <SelectItem value="swarm">Swarm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pattern Description */}
          {pattern && (
            <div className="mt-4 p-3 bg-muted rounded text-sm">
              {pattern === "tournament" && (
                <p>
                  <strong>Tournament:</strong> Spawn multiple agents competing
                  to solve the task, select winner
                </p>
              )}
              {pattern === "cascade" && (
                <p>
                  <strong>Cascade:</strong> Try progressively more capable
                  models until success
                </p>
              )}
              {pattern === "sequential" && (
                <p>
                  <strong>Sequential:</strong> Run tasks one after another in
                  order
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {entityType && entityId && (
            <Button
              onClick={() => saveMutation.mutate({ pattern, distribution })}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
