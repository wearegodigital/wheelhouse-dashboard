"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, ChevronLeft, ChevronRight, Loader2, CheckCircle2, Lightbulb } from "lucide-react"

// Types matching the hook
interface GuidedQuestion {
  id: string
  prompt: string
  type: "single_choice" | "multi_choice" | "text" | "scale"
  options: Array<{ value: string; label: string; description?: string }>
  recommendation: string | null
  required: boolean
}

interface GuidedStep {
  step_index: number
  step_name: string
  title: string
  description: string
  questions: GuidedQuestion[]
  ready: boolean
}

// --- Sub-components ---

// 4.2a: Single choice renderer — clickable cards
function SingleChoiceQuestion({ question, value, onChange }: {
  question: GuidedQuestion
  value: string | undefined
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{question.prompt}</p>
      <div className="grid gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`text-left p-3 rounded-lg border-2 transition-all ${
              value === opt.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{opt.label}</span>
              {question.recommendation === opt.value && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> Recommended
                </Badge>
              )}
            </div>
            {opt.description && (
              <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// 4.2b: Multi-choice renderer — checkboxes
function MultiChoiceQuestion({ question, value, onChange }: {
  question: GuidedQuestion
  value: string[] | undefined
  onChange: (value: string[]) => void
}) {
  const selected = value || []
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }
  return (
    <div className="space-y-2">
      <p className="font-medium">{question.prompt}</p>
      <div className="grid gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={`text-left p-3 rounded-lg border-2 transition-all ${
              selected.includes(opt.value)
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                selected.includes(opt.value) ? "border-primary bg-primary" : "border-muted-foreground"
              }`}>
                {selected.includes(opt.value) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
              </div>
              <span className="font-medium">{opt.label}</span>
            </div>
            {opt.description && <p className="text-sm text-muted-foreground mt-1 ml-6">{opt.description}</p>}
          </button>
        ))}
      </div>
    </div>
  )
}

// Text input renderer
function TextQuestion({ question, value, onChange }: {
  question: GuidedQuestion
  value: string | undefined
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{question.prompt}</p>
      {question.recommendation && (
        <AIRecommendation text={question.recommendation} />
      )}
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer..."
        className="min-h-[100px]"
      />
    </div>
  )
}

// Scale renderer
function ScaleQuestion({ question, value, onChange }: {
  question: GuidedQuestion
  value: string | undefined
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{question.prompt}</p>
      <div className="flex gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 p-2 text-center rounded-lg border-2 text-sm transition-all ${
              value === opt.value
                ? "border-primary bg-primary/5 font-medium"
                : "border-border hover:border-primary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// 4.2c: AI recommendation callout
function AIRecommendation({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <p className="text-sm text-primary">{text}</p>
    </div>
  )
}

// 4.2d: Step progress indicator
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            i < current ? "bg-primary text-primary-foreground"
            : i === current ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
            : "bg-muted text-muted-foreground"
          }`}>
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`w-8 h-0.5 ${i < current ? "bg-primary" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// Question renderer dispatcher
function QuestionRenderer({ question, value, onChange }: {
  question: GuidedQuestion
  value: unknown
  onChange: (value: unknown) => void
}) {
  switch (question.type) {
    case "single_choice":
      return <SingleChoiceQuestion question={question} value={value as string} onChange={onChange as (v: string) => void} />
    case "multi_choice":
      return <MultiChoiceQuestion question={question} value={value as string[]} onChange={onChange as (v: string[]) => void} />
    case "text":
      return <TextQuestion question={question} value={value as string} onChange={onChange as (v: string) => void} />
    case "scale":
      return <ScaleQuestion question={question} value={value as string} onChange={onChange as (v: string) => void} />
    default:
      return <TextQuestion question={question} value={value as string} onChange={onChange as (v: string) => void} />
  }
}

// 4.2e: Main GuidedWizard component
interface GuidedWizardProps {
  step: GuidedStep | null
  totalSteps: number
  answers: Record<string, unknown>
  status: string
  error: string | null
  onAnswer: (questionId: string, value: unknown) => void
  onNext: () => void
  onBack: () => void
  onGenerate: () => void
}

export function GuidedWizard({
  step, totalSteps, answers, status, error, onAnswer, onNext, onBack, onGenerate,
}: GuidedWizardProps) {
  if (status === "loading") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">AI is analyzing your project...</p>
        </CardContent>
      </Card>
    )
  }

  if (status === "error") {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-medium mb-2">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!step) {
    // All steps complete — ready to generate
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Planning Complete</h3>
          <p className="text-muted-foreground mb-6">All questions answered. Ready to generate the project plan.</p>
          <Button onClick={onGenerate} size="lg" disabled={status === "generating"}>
            {status === "generating" ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Plan...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Plan</>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Check if all required questions are answered
  const allRequiredAnswered = step.questions
    .filter(q => q.required)
    .every(q => {
      const val = answers[q.id]
      return val !== undefined && val !== "" && val !== null
    })

  return (
    <div>
      <StepProgress current={step.step_index} total={totalSteps} />

      <Card>
        <CardHeader>
          <CardTitle>{step.title}</CardTitle>
          <CardDescription>{step.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step.questions.map((q) => (
            <QuestionRenderer
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={(val) => onAnswer(q.id, val)}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={step.step_index === 0 || status === "loading"}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!allRequiredAnswered || status === "loading"}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
