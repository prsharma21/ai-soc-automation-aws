import type { EvaluationMetric, EvaluationRun, ScenarioResult } from "@/types";
import { minutesAgo } from "./seed";

const DATASET = "synthetic-soc-scenarios-v1";
const CASE_COUNT = 12;
const EVALUATOR = "None — illustrative sample values";

interface MetricValues {
  precision: number;
  recall: number;
  f1: number;
  fpr: number;
  relevance: number;
  groundedness: number;
  citation: number;
  toolSuccess: number;
  completeness: number;
  latencyMs: number;
}

/** `null` values mean the run did not produce the metric (e.g. it failed). */
function metrics(values: MetricValues | null): EvaluationMetric[] {
  const v = (key: keyof MetricValues) => (values ? values[key] : null);
  return [
    { key: "precision", label: "Classification precision", value: v("precision"), unit: "ratio", target: 0.9, higherIsBetter: true },
    { key: "recall", label: "Classification recall", value: v("recall"), unit: "ratio", target: 0.9, higherIsBetter: true },
    { key: "f1", label: "F1 score", value: v("f1"), unit: "ratio", target: 0.9, higherIsBetter: true },
    { key: "fpr", label: "False-positive rate", value: v("fpr"), unit: "ratio", target: 0.1, higherIsBetter: false },
    { key: "relevance", label: "RAG retrieval relevance", value: v("relevance"), unit: "ratio", target: 0.8, higherIsBetter: true },
    { key: "groundedness", label: "Groundedness", value: v("groundedness"), unit: "ratio", target: 0.9, higherIsBetter: true },
    { key: "citation", label: "Citation correctness", value: v("citation"), unit: "ratio", target: 0.9, higherIsBetter: true },
    { key: "tool_success", label: "Tool-call success rate", value: v("toolSuccess"), unit: "ratio", target: 0.95, higherIsBetter: true },
    { key: "completeness", label: "Incident summary completeness", value: v("completeness"), unit: "ratio", target: 0.85, higherIsBetter: true },
    { key: "latency", label: "End-to-end latency (p50)", value: v("latencyMs"), unit: "ms", target: 60000, higherIsBetter: false },
    { key: "cost", label: "Estimated cost per investigation", value: null, unit: "usd", target: null, higherIsBetter: false },
  ];
}

const latestResults: ScenarioResult[] = [
  { caseId: "EV-A-01", scenario: "A_suspicious_login", description: "Success after 14 failures, unfamiliar IP", expected: "true_positive", predicted: "true_positive", expectedSeverity: "critical", predictedSeverity: "critical", passed: true, latencyMs: 47800, notes: "Correct escalation and two approvals proposed." },
  { caseId: "EV-A-02", scenario: "A_suspicious_login", description: "Failures only, no success", expected: "true_positive", predicted: "true_positive", expectedSeverity: "high", predictedSeverity: "high", passed: true, latencyMs: 39100, notes: "" },
  { caseId: "EV-A-03", scenario: "A_suspicious_login", description: "Success after failures from known office IP", expected: "benign", predicted: "true_positive", expectedSeverity: "low", predictedSeverity: "high", passed: false, latencyMs: 44200, notes: "Office allow-list not consulted; over-escalated." },
  { caseId: "EV-B-01", scenario: "B_unusual_access", description: "Off-hours bulk read, no schedule", expected: "true_positive", predicted: "true_positive", expectedSeverity: "medium", predictedSeverity: "medium", passed: true, latencyMs: 41000, notes: "Correctly paused for review." },
  { caseId: "EV-B-02", scenario: "B_unusual_access", description: "Off-hours access during month-end with ticket", expected: "benign", predicted: "benign", expectedSeverity: "low", predictedSeverity: "low", passed: true, latencyMs: 36700, notes: "" },
  { caseId: "EV-B-03", scenario: "B_unusual_access", description: "Off-hours access by on-call engineer", expected: "benign", predicted: "true_positive", expectedSeverity: "info", predictedSeverity: "medium", passed: false, latencyMs: 38800, notes: "On-call rota not retrieved by RAG." },
  { caseId: "EV-C-01", scenario: "C_simulated_malware", description: "EICAR file + encoded PowerShell", expected: "true_positive", predicted: "true_positive", expectedSeverity: "high", predictedSeverity: "high", passed: true, latencyMs: 40900, notes: "" },
  { caseId: "EV-C-02", scenario: "C_simulated_malware", description: "EICAR file during scheduled exercise", expected: "benign", predicted: "benign", expectedSeverity: "info", predictedSeverity: "info", passed: true, latencyMs: 33500, notes: "PB-006 retrieved and applied." },
  { caseId: "EV-C-03", scenario: "C_simulated_malware", description: "Test signature on server", expected: "true_positive", predicted: "true_positive", expectedSeverity: "critical", predictedSeverity: "critical", passed: true, latencyMs: 45200, notes: "" },
  { caseId: "EV-D-01", scenario: "D_false_positive", description: "New country with approved travel", expected: "false_positive", predicted: "false_positive", expectedSeverity: "low", predictedSeverity: "low", passed: true, latencyMs: 30100, notes: "No containment proposed." },
  { caseId: "EV-D-02", scenario: "D_false_positive", description: "New device after laptop refresh", expected: "false_positive", predicted: "false_positive", expectedSeverity: "info", predictedSeverity: "info", passed: true, latencyMs: 28800, notes: "" },
  { caseId: "EV-D-03", scenario: "D_false_positive", description: "VPN from new ISP at home", expected: "false_positive", predicted: "false_positive", expectedSeverity: "low", predictedSeverity: "low", passed: true, latencyMs: 29700, notes: "" },
];

function run(id: string, ageMinutes: number, values: MetricValues | null, results: ScenarioResult[], status: EvaluationRun["status"] = "completed"): EvaluationRun {
  return { id, startedAt: minutesAgo(ageMinutes), dataset: DATASET, executionMode: "mock", evaluator: EVALUATOR, status, caseCount: CASE_COUNT, metrics: metrics(values), scenarioResults: results };
}

export const evaluationRuns: EvaluationRun[] = [
  run("EVAL-005", 180, { precision: 0.91, recall: 0.89, f1: 0.9, fpr: 0.08, relevance: 0.84, groundedness: 0.93, citation: 0.9, toolSuccess: 0.96, completeness: 0.88, latencyMs: 39800 }, latestResults),
  run("EVAL-004", 1600, { precision: 0.88, recall: 0.87, f1: 0.875, fpr: 0.11, relevance: 0.8, groundedness: 0.9, citation: 0.86, toolSuccess: 0.94, completeness: 0.85, latencyMs: 42100 }, latestResults.map((r) => ({ ...r }))),
  run("EVAL-003", 4400, { precision: 0.84, recall: 0.86, f1: 0.85, fpr: 0.14, relevance: 0.77, groundedness: 0.87, citation: 0.82, toolSuccess: 0.91, completeness: 0.8, latencyMs: 47300 }, latestResults.map((r) => ({ ...r }))),
  run("EVAL-002", 7300, null, [], "failed"),
  run("EVAL-001", 10100, { precision: 0.79, recall: 0.81, f1: 0.8, fpr: 0.19, relevance: 0.71, groundedness: 0.82, citation: 0.75, toolSuccess: 0.88, completeness: 0.74, latencyMs: 55600 }, latestResults.map((r) => ({ ...r }))),
];
