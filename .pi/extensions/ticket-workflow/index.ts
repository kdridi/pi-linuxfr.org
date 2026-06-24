import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, posix } from "node:path";

const TICKET_ROOT = "tickets";
const TICKET_STATES = ["backlog", "planned", "ongoing", "completed", "rejected"] as const;
const TICKET_FILE_PATTERN = /^PLF-\d+\.md$/;
const TICKET_ID_PATTERN = /^PLF-\d+$/;
const ADVISORY_ARTIFACT_ROOT = posix.join(TICKET_ROOT, ".artifacts");
const ADVISORY_ARTIFACT_TYPES = ["readiness", "plans", "verification", "completion"] as const;
const ADVISORY_ARTIFACT_NOTICE =
  "Advisory artifact only. Ticket files and ticket state directories remain authoritative.";
const CHILD_PI_GUARD_ENV = "PI_TICKET_CHILD";
const CHILD_PI_TOOL_ALLOWLIST = ["read", "grep", "find", "ls"] as const;
const CHILD_PI_DEFAULT_TIMEOUT_MS = 120_000;

export type TicketState = (typeof TICKET_STATES)[number];
export type AdvisoryArtifactType = (typeof ADVISORY_ARTIFACT_TYPES)[number];

export type AdvisoryParentHandoffParams = {
  commandName: string;
  originalRequest: string;
  advisoryResult: string;
  artifactPath?: string;
};

export type AdvisoryParentHandoffDelivery =
  | {
      sent: true;
      message: string;
    }
  | {
      sent: false;
      message: string;
      suggestedHandoff: string;
    };

type StateStatus = {
  state: TicketState;
  path: string;
  exists: boolean;
  ticketFiles: string[];
  error?: string;
};

type TicketStatus = {
  states: StateStatus[];
  activeTicket?: string;
  workflowErrors: string[];
  missingDirectories: string[];
};

export type AdvisoryArtifactMetadata = {
  artifactType: AdvisoryArtifactType;
  commandName: string;
  generatedAt: string;
  ticketId: string;
  ticketPath: string;
  ticketState?: TicketState;
  ticketSha256: string;
  advisory: true;
  advisoryNotice: string;
};

export type ReadOnlyChildPiAdvisoryResult = {
  command: string;
  args: string[];
  cwd: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  markdown: string;
  timedOut: boolean;
};

type TicketDependencyStatus = {
  dependency: string;
  state?: TicketState;
  resolved: boolean;
  note: string;
};

export default function (pi: ExtensionAPI) {
  pi.registerCommand("ticket-status", {
    description: "Inspect the file-based ticket workflow without mutating repository files",
    handler: async (_args, ctx) => {
      const status = await inspectTicketStatus(ctx.cwd);
      const text = renderTicketStatus(status);

      if (ctx.mode === "print") {
        process.stdout.write(`${text}\n`);
        return;
      }

      pi.sendMessage({
        customType: "ticket-status",
        content: text,
        display: true,
        details: status,
      });
    },
  });

  pi.registerCommand("ticket-child-diagnostic", {
    description: "Run a bounded read-only child Pi advisory diagnostic",
    handler: async (args, ctx) => {
      const prompt = buildChildDiagnosticPrompt(args);
      const startingText = renderChildDiagnosticStarting();

      if (ctx.mode === "print") {
        process.stdout.write(`${startingText}\n\n`);
      } else {
        pi.sendMessage({
          customType: "ticket-child-diagnostic-starting",
          content: startingText,
          display: true,
          details: {
            childTools: [...CHILD_PI_TOOL_ALLOWLIST],
            childResourcesDisabled: ["extensions", "skills", "prompt templates", "themes", "session persistence"],
          },
        });
      }

      const result = await runReadOnlyChildPiAdvisory(ctx.cwd, { prompt });
      const text = renderChildDiagnostic(result);

      if (ctx.mode === "print") {
        process.stdout.write(`${text}\n`);
        return;
      }

      pi.sendMessage({
        customType: "ticket-child-diagnostic",
        content: text,
        display: true,
        details: result,
      });
    },
  });

  pi.registerCommand("ticket-readiness", {
    description: "Create a read-only advisory readiness brief for a backlog ticket",
    handler: async (args, ctx) => {
      const ticketId = parseTicketIdArg(args, "ticket-readiness");
      const ticketPath = requireBacklogTicketPath(ctx.cwd, ticketId);
      const artifactPath = buildAdvisoryArtifactPath(ticketId, "readiness");
      const startingText = renderReadinessStarting(ticketId, ticketPath, artifactPath);

      if (ctx.mode === "print") {
        process.stdout.write(`${startingText}\n\n`);
      } else {
        pi.sendMessage({
          customType: "ticket-readiness-starting",
          content: startingText,
          display: true,
          details: {
            ticketId,
            ticketPath,
            artifactPath,
            childTools: [...CHILD_PI_TOOL_ALLOWLIST],
          },
        });
      }

      const childResult = await runReadOnlyChildPiAdvisory(ctx.cwd, {
        prompt: buildReadinessPrompt(ticketId, ticketPath),
      });
      const metadata = await buildAdvisoryArtifactMetadata(ctx.cwd, {
        artifactType: "readiness",
        commandName: "ticket-readiness",
        ticketPath,
      });
      const artifact = renderReadinessArtifact(metadata, childResult.markdown);

      await mkdir(join(ctx.cwd, posix.dirname(artifactPath)), { recursive: true });
      await writeFile(join(ctx.cwd, artifactPath), artifact, "utf8");

      const text = renderReadinessResult(ticketId, ticketPath, artifactPath, childResult.markdown);
      const handoffParams = {
        commandName: "ticket-readiness",
        originalRequest: `/ticket-readiness ${args.trim()}`.trim(),
        advisoryResult: childResult.markdown,
        artifactPath,
      };

      if (ctx.mode === "print") {
        process.stdout.write(`${text}\n\n`);
        deliverAdvisoryParentHandoff(pi, ctx, handoffParams);
        return;
      }

      if (shouldSendAdvisoryParentHandoff(ctx)) {
        pi.sendMessage({
          customType: "ticket-readiness",
          content: text,
          display: true,
          details: {
            ticketId,
            ticketPath,
            artifactPath,
            childResult,
          },
        });
        deliverAdvisoryParentHandoff(pi, ctx, handoffParams);
        return;
      }

      const delivery = deliverAdvisoryParentHandoff(pi, ctx, handoffParams);
      const content = delivery.sent ? text : `${text}\n\n${delivery.suggestedHandoff}`;
      pi.sendMessage({
        customType: "ticket-readiness",
        content,
        display: true,
        details: {
          ticketId,
          ticketPath,
          artifactPath,
          childResult,
          parentHandoff: delivery,
        },
      });
    },
  });

  pi.registerCommand("ticket-plan", {
    description: "Create a read-only advisory implementation plan for a planned ticket",
    handler: async (args, ctx) => {
      const ticketId = parseTicketIdArg(args, "ticket-plan");
      const ticketPath = requirePlannedTicketPath(ctx.cwd, ticketId);
      const artifactPath = buildAdvisoryArtifactPath(ticketId, "plans");
      const dependencies = await inspectTicketDependencies(ctx.cwd, ticketPath);
      const startingText = renderPlanStarting(ticketId, ticketPath, artifactPath, dependencies);

      if (ctx.mode === "print") {
        process.stdout.write(`${startingText}\n\n`);
      } else {
        pi.sendMessage({
          customType: "ticket-plan-starting",
          content: startingText,
          display: true,
          details: {
            ticketId,
            ticketPath,
            artifactPath,
            dependencies,
            childTools: [...CHILD_PI_TOOL_ALLOWLIST],
          },
        });
      }

      const childResult = await runReadOnlyChildPiAdvisory(ctx.cwd, {
        prompt: buildPlanPrompt(ticketId, ticketPath, dependencies),
      });
      const metadata = await buildAdvisoryArtifactMetadata(ctx.cwd, {
        artifactType: "plans",
        commandName: "ticket-plan",
        ticketPath,
      });
      const advisoryResult = renderPlanAdvisoryMarkdown(dependencies, childResult.markdown);
      const artifact = renderPlanArtifact(metadata, advisoryResult);

      await mkdir(join(ctx.cwd, posix.dirname(artifactPath)), { recursive: true });
      await writeFile(join(ctx.cwd, artifactPath), artifact, "utf8");

      const text = renderPlanResult(ticketId, ticketPath, artifactPath, advisoryResult);
      const handoffParams = {
        commandName: "ticket-plan",
        originalRequest: `/ticket-plan ${args.trim()}`.trim(),
        advisoryResult,
        artifactPath,
      };

      if (ctx.mode === "print") {
        process.stdout.write(`${text}\n\n`);
        deliverAdvisoryParentHandoff(pi, ctx, handoffParams);
        return;
      }

      if (shouldSendAdvisoryParentHandoff(ctx)) {
        pi.sendMessage({
          customType: "ticket-plan",
          content: text,
          display: true,
          details: {
            ticketId,
            ticketPath,
            artifactPath,
            dependencies,
            childResult,
          },
        });
        deliverAdvisoryParentHandoff(pi, ctx, handoffParams);
        return;
      }

      const delivery = deliverAdvisoryParentHandoff(pi, ctx, handoffParams);
      const content = delivery.sent ? text : `${text}\n\n${delivery.suggestedHandoff}`;
      pi.sendMessage({
        customType: "ticket-plan",
        content,
        display: true,
        details: {
          ticketId,
          ticketPath,
          artifactPath,
          dependencies,
          childResult,
          parentHandoff: delivery,
        },
      });
    },
  });
}

export async function runReadOnlyChildPiAdvisory(
  cwd: string,
  params: {
    prompt: string;
    timeoutMs?: number;
    signal?: AbortSignal;
  },
): Promise<ReadOnlyChildPiAdvisoryResult> {
  if (process.env[CHILD_PI_GUARD_ENV]) {
    throw new Error("Refusing to spawn a nested ticket child Pi session.");
  }

  const timeoutMs = params.timeoutMs ?? CHILD_PI_DEFAULT_TIMEOUT_MS;
  const args = buildReadOnlyChildPiArgs(params.prompt);
  const invocation = getPiInvocation(args);
  const result = await spawnChildPi(invocation.command, invocation.args, cwd, timeoutMs, params.signal);

  if (result.exitCode !== 0 || result.timedOut) {
    const reason = result.timedOut ? `timed out after ${timeoutMs}ms` : `exited with code ${result.exitCode}`;
    const stderr = result.stderr.trim();
    throw new Error(`Read-only child Pi advisory run failed: ${reason}${stderr ? `\n${stderr}` : ""}`);
  }

  return result;
}

function buildReadOnlyChildPiArgs(prompt: string): string[] {
  return [
    "--approve",
    "--no-session",
    "--no-extensions",
    "--no-skills",
    "--no-prompt-templates",
    "--no-themes",
    "--tools",
    CHILD_PI_TOOL_ALLOWLIST.join(","),
    "-p",
    prompt,
  ];
}

function getPiInvocation(args: string[]): { command: string; args: string[] } {
  const currentScript = process.argv[1];
  const isBunVirtualScript = currentScript?.startsWith("/$bunfs/root/");

  if (currentScript && !isBunVirtualScript && existsSync(currentScript)) {
    return { command: process.execPath, args: [currentScript, ...args] };
  }

  const execName = basename(process.execPath).toLowerCase();
  const isGenericRuntime = /^(node|bun)(\.exe)?$/.test(execName);

  if (!isGenericRuntime) {
    return { command: process.execPath, args };
  }

  return { command: "pi", args };
}

async function spawnChildPi(
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
  signal: AbortSignal | undefined,
): Promise<ReadOnlyChildPiAdvisoryResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        [CHILD_PI_GUARD_ENV]: "1",
      },
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => {
        if (!child.killed) {
          child.kill("SIGKILL");
        }
      }, 5_000).unref();
    }, timeoutMs);
    timeout.unref();

    const abort = () => {
      child.kill("SIGTERM");
    };

    if (signal?.aborted) {
      abort();
    } else {
      signal?.addEventListener("abort", abort, { once: true });
    }

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString("utf8");
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString("utf8");
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      reject(error);
    });

    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      resolve({
        command,
        args,
        cwd,
        exitCode,
        stdout,
        stderr,
        markdown: stdout.trim(),
        timedOut,
      });
    });
  });
}

function buildChildDiagnosticPrompt(args: string): string {
  const requestedTask = args.trim() || "Confirm that this child session can inspect files read-only.";

  return [
    "You are a read-only child Pi advisory session for the pi-linuxfr.org ticket workflow.",
    "Do not modify files. Do not attempt to use write, edit, or bash.",
    "Use only read-only inspection if needed.",
    "Return concise Markdown with these sections: Result, Evidence, Safety Boundary.",
    `Task: ${requestedTask}`,
  ].join("\n");
}

function buildReadinessPrompt(ticketId: string, ticketPath: string): string {
  return [
    "You are a read-only child Pi advisory session for the pi-linuxfr.org ticket workflow.",
    "Do not modify files. Do not move tickets. Do not create artifacts. Do not attempt to use write, edit, or bash.",
    "Assess whether the target backlog ticket is ready to move to tickets/planned/ according to the project workflow.",
    "Read these sources at minimum:",
    "- tickets/README.md",
    "- docs/ticket-workflow-commands.md",
    `- ${ticketPath}`,
    "Also inspect completed dependency tickets if useful and explicitly named by the target ticket.",
    "Return concise Markdown with these sections:",
    "1. Verdict — exactly one of ready, not-ready, split-recommended, or defer-or-reject, with one sentence of rationale.",
    "2. Definition of Ready Review — evaluate objective, scope, acceptance criteria, artifacts, dependencies, size, verification, and fresh-session implementability.",
    "3. Missing Information or Blockers — list concrete gaps, or say none.",
    "4. Human Questions — list questions needed before planning, or say none.",
    "5. Recommended Next Action — recommend the next manual workflow action without performing it.",
    "6. Safety Boundary — confirm this was read-only advisory analysis.",
    `Target ticket: ${ticketId}`,
  ].join("\n");
}

function buildPlanPrompt(ticketId: string, ticketPath: string, dependencies: TicketDependencyStatus[]): string {
  return [
    "You are a read-only child Pi advisory session for the pi-linuxfr.org ticket workflow.",
    "Do not modify files. Do not move tickets. Do not create artifacts. Do not attempt to use write, edit, or bash.",
    "Prepare an implementation plan for the target planned ticket. The plan is advisory only and must not activate the ticket.",
    "Read these sources at minimum:",
    "- tickets/README.md",
    "- docs/ticket-workflow-commands.md",
    `- ${ticketPath}`,
    "Also inspect likely code or documentation files needed to implement the ticket, and completed dependency tickets when useful.",
    "Dependency pre-check from the parent command:",
    renderDependencyStatusList(dependencies),
    "Return concise Markdown with these sections:",
    "1. Objective Restatement — summarize the exact outcome.",
    "2. Scope Boundaries — list in-scope and out-of-scope work.",
    "3. Dependency Review — call out unresolved or uncertain dependencies, or say none.",
    "4. Likely Files — list likely files and mark uncertainty explicitly.",
    "5. Implementation Steps — provide a small step-by-step plan.",
    "6. Acceptance Criteria to Verification Map — map each acceptance criterion to implementation and verification steps where practical.",
    "7. Risks and Uncertainties — list concrete risks or say none.",
    "8. Stop Conditions — name conditions that should stop implementation and ask the human before continuing.",
    "9. Safety Boundary — confirm this was read-only advisory analysis and no ticket transition was performed.",
    `Target ticket: ${ticketId}`,
  ].join("\n");
}

function renderChildDiagnosticStarting(): string {
  return [
    "# Ticket Child Diagnostic",
    "",
    "Starting read-only child Pi advisory run...",
    "",
    "Safety boundary: child tools are limited to `read`, `grep`, `find`, and `ls`.",
    "Child extensions, skills, prompt templates, themes, and session persistence are disabled.",
  ].join("\n");
}

function renderChildDiagnostic(result: ReadOnlyChildPiAdvisoryResult): string {
  return [
    "# Ticket Child Diagnostic",
    "",
    "A child Pi process was launched with read-only tools only: `read`, `grep`, `find`, and `ls`.",
    "Child extensions, skills, prompt templates, themes, and session persistence were disabled.",
    "",
    "## Child output",
    "",
    result.markdown || "(no child output)",
  ].join("\n");
}

function renderReadinessStarting(ticketId: string, ticketPath: string, artifactPath: string): string {
  return [
    "# Ticket Readiness",
    "",
    `Starting read-only readiness analysis for ${ticketId}.`,
    "",
    `Source ticket: ${ticketPath}`,
    `Advisory artifact: ${artifactPath}`,
    "Safety boundary: the command only accepts backlog tickets and the child analysis uses `read`, `grep`, `find`, and `ls`.",
  ].join("\n");
}

function renderReadinessResult(
  ticketId: string,
  ticketPath: string,
  artifactPath: string,
  advisoryMarkdown: string,
): string {
  return [
    "# Ticket Readiness",
    "",
    `Source ticket: ${ticketPath}`,
    `Advisory artifact: ${artifactPath}`,
    "",
    "This result is advisory only. Ticket files and ticket directories remain authoritative.",
    "No ticket state transition was performed.",
    "",
    "## Advisory result",
    "",
    advisoryMarkdown || "(no advisory result)",
    "",
    "## Recommended parent action",
    "",
    `Review the advisory result for ${ticketId}, ask any required human questions, and only then decide whether to manually refine or move the ticket.`,
  ].join("\n");
}

function renderReadinessArtifact(metadata: AdvisoryArtifactMetadata, advisoryMarkdown: string): string {
  return [
    renderAdvisoryArtifactFrontmatter(metadata),
    `# Readiness Brief: ${metadata.ticketId}`,
    "",
    metadata.advisoryNotice,
    "",
    "## Source",
    "",
    `- Ticket: \`${metadata.ticketPath}\``,
    `- Ticket state at generation: \`${metadata.ticketState ?? "unknown"}\``,
    `- Ticket SHA-256: \`${metadata.ticketSha256}\``,
    "",
    "## Advisory Result",
    "",
    advisoryMarkdown || "(no advisory result)",
  ].join("\n");
}

function renderPlanStarting(
  ticketId: string,
  ticketPath: string,
  artifactPath: string,
  dependencies: TicketDependencyStatus[],
): string {
  return [
    "# Ticket Plan",
    "",
    `Starting read-only implementation planning for ${ticketId}.`,
    "",
    `Source ticket: ${ticketPath}`,
    `Advisory artifact: ${artifactPath}`,
    "Safety boundary: the command only accepts planned tickets and the child analysis uses `read`, `grep`, `find`, and `ls`.",
    "",
    "## Dependency pre-check",
    "",
    renderDependencyStatusList(dependencies),
  ].join("\n");
}

function renderPlanResult(ticketId: string, ticketPath: string, artifactPath: string, advisoryMarkdown: string): string {
  return [
    "# Ticket Plan",
    "",
    `Source ticket: ${ticketPath}`,
    `Advisory artifact: ${artifactPath}`,
    "",
    "This result is advisory only. Ticket files and ticket directories remain authoritative.",
    "No ticket state transition was performed.",
    "",
    "## Advisory result",
    "",
    advisoryMarkdown || "(no advisory result)",
    "",
    "## Recommended parent action",
    "",
    `Review the implementation plan for ${ticketId}, ask any required human questions, and only then decide whether to activate the ticket manually.`,
  ].join("\n");
}

function renderPlanArtifact(metadata: AdvisoryArtifactMetadata, advisoryMarkdown: string): string {
  return [
    renderAdvisoryArtifactFrontmatter(metadata),
    `# Implementation Plan: ${metadata.ticketId}`,
    "",
    metadata.advisoryNotice,
    "",
    "## Source",
    "",
    `- Ticket: \`${metadata.ticketPath}\``,
    `- Ticket state at generation: \`${metadata.ticketState ?? "unknown"}\``,
    `- Ticket SHA-256: \`${metadata.ticketSha256}\``,
    "",
    "## Advisory Result",
    "",
    advisoryMarkdown || "(no advisory result)",
  ].join("\n");
}

function renderPlanAdvisoryMarkdown(dependencies: TicketDependencyStatus[], childMarkdown: string): string {
  return [
    "## Parent Dependency Pre-check",
    "",
    renderDependencyStatusList(dependencies),
    "",
    "## Child Implementation Plan",
    "",
    childMarkdown || "(no advisory result)",
  ].join("\n");
}

function renderDependencyStatusList(dependencies: TicketDependencyStatus[]): string {
  if (dependencies.length === 0) {
    return "- No ticket dependencies declared in frontmatter.";
  }

  return dependencies
    .map((dependency) => {
      const state = dependency.state ? `tickets/${dependency.state}/` : "not found";
      const marker = dependency.resolved ? "resolved" : "unresolved";
      return `- \`${dependency.dependency}\` — ${marker}; ${state}; ${dependency.note}`;
    })
    .join("\n");
}

function renderAdvisoryArtifactFrontmatter(metadata: AdvisoryArtifactMetadata): string {
  const lines = [
    "---",
    `artifactType: ${yamlString(metadata.artifactType)}`,
    `commandName: ${yamlString(metadata.commandName)}`,
    `generatedAt: ${yamlString(metadata.generatedAt)}`,
    `ticketId: ${yamlString(metadata.ticketId)}`,
    `ticketPath: ${yamlString(metadata.ticketPath)}`,
  ];

  if (metadata.ticketState) {
    lines.push(`ticketState: ${yamlString(metadata.ticketState)}`);
  }

  lines.push(
    `ticketSha256: ${yamlString(metadata.ticketSha256)}`,
    "advisory: true",
    `advisoryNotice: ${yamlString(metadata.advisoryNotice)}`,
    "---",
  );

  return lines.join("\n");
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function parseTicketIdArg(args: string, commandName: string): string {
  const ticketId = args.trim().split(/\s+/, 1)[0];

  if (!ticketId) {
    throw new Error(`Usage: /${commandName} PLF-123`);
  }

  assertValidTicketId(ticketId);
  return ticketId;
}

function requireBacklogTicketPath(cwd: string, ticketId: string): string {
  const backlogPath = posix.join(TICKET_ROOT, "backlog", `${ticketId}.md`);

  if (existsSync(join(cwd, backlogPath))) {
    return backlogPath;
  }

  const currentState = TICKET_STATES.find((state) =>
    existsSync(join(cwd, posix.join(TICKET_ROOT, state, `${ticketId}.md`))),
  );

  if (currentState) {
    throw new Error(`Ticket ${ticketId} is in tickets/${currentState}/; /ticket-readiness only accepts backlog tickets.`);
  }

  throw new Error(`Ticket ${ticketId} was not found in tickets/backlog/.`);
}

function requirePlannedTicketPath(cwd: string, ticketId: string): string {
  const plannedPath = posix.join(TICKET_ROOT, "planned", `${ticketId}.md`);

  if (existsSync(join(cwd, plannedPath))) {
    return plannedPath;
  }

  const currentState = TICKET_STATES.find((state) =>
    existsSync(join(cwd, posix.join(TICKET_ROOT, state, `${ticketId}.md`))),
  );

  if (currentState) {
    throw new Error(`Ticket ${ticketId} is in tickets/${currentState}/; /ticket-plan only accepts planned tickets.`);
  }

  throw new Error(`Ticket ${ticketId} was not found in tickets/planned/.`);
}

async function inspectTicketDependencies(cwd: string, ticketPath: string): Promise<TicketDependencyStatus[]> {
  const content = await readFile(join(cwd, ticketPath), "utf8");
  const dependencies = parseFrontmatterDependencies(content);

  return dependencies.map((dependency) => {
    const state = TICKET_ID_PATTERN.test(dependency) ? findTicketState(cwd, dependency) : undefined;
    const resolved = state === "completed";
    const note = resolved
      ? "dependency ticket is completed"
      : state
        ? `dependency ticket is still in ${state}`
        : "dependency ticket was not found in the local ticket directories";

    return {
      dependency,
      state,
      resolved,
      note,
    };
  });
}

function parseFrontmatterDependencies(content: string): string[] {
  const match = content.match(/^dependencies:\s*\[(.*)\]\s*$/m);

  if (!match) {
    return [];
  }

  return Array.from(match[1].matchAll(/["']([^"']+)["']/g), (dependency) => dependency[1]);
}

function findTicketState(cwd: string, ticketId: string): TicketState | undefined {
  return TICKET_STATES.find((state) => existsSync(join(cwd, posix.join(TICKET_ROOT, state, `${ticketId}.md`))));
}

async function inspectTicketStatus(cwd: string): Promise<TicketStatus> {
  const states = await Promise.all(TICKET_STATES.map((state) => inspectState(cwd, state)));
  const ongoing = states.find((state) => state.state === "ongoing");
  const ongoingTickets = ongoing?.ticketFiles ?? [];
  const workflowErrors: string[] = [];
  const missingDirectories = states.filter((state) => !state.exists).map((state) => state.path);

  for (const state of states) {
    if (state.error) {
      workflowErrors.push(`Cannot inspect ${state.path}: ${state.error}`);
    }
  }

  if (ongoingTickets.length > 1) {
    workflowErrors.push(`More than one ongoing ticket found: ${ongoingTickets.join(", ")}`);
  }

  return {
    states,
    activeTicket: ongoingTickets.length === 1 ? ticketIdFromFile(ongoingTickets[0]) : undefined,
    workflowErrors,
    missingDirectories,
  };
}

export function buildAdvisoryArtifactPath(ticketId: string, artifactType: AdvisoryArtifactType): string {
  assertValidTicketId(ticketId);
  assertValidAdvisoryArtifactType(artifactType);

  return posix.join(ADVISORY_ARTIFACT_ROOT, artifactType, `${ticketId}.md`);
}

export async function buildAdvisoryArtifactMetadata(
  cwd: string,
  params: {
    artifactType: AdvisoryArtifactType;
    commandName: string;
    ticketPath: string;
    generatedAt?: Date;
  },
): Promise<AdvisoryArtifactMetadata> {
  assertValidAdvisoryArtifactType(params.artifactType);

  const ticketPath = normalizeRelativeTicketPath(params.ticketPath);
  const ticketId = ticketIdFromPath(ticketPath);

  return {
    artifactType: params.artifactType,
    commandName: params.commandName,
    generatedAt: (params.generatedAt ?? new Date()).toISOString(),
    ticketId,
    ticketPath,
    ticketState: ticketStateFromPath(ticketPath),
    ticketSha256: await computeTicketSha256(cwd, ticketPath),
    advisory: true,
    advisoryNotice: ADVISORY_ARTIFACT_NOTICE,
  };
}

export async function computeTicketSha256(cwd: string, ticketPath: string): Promise<string> {
  const normalizedTicketPath = normalizeRelativeTicketPath(ticketPath);
  const content = await readFile(join(cwd, normalizedTicketPath));
  return createHash("sha256").update(content).digest("hex");
}

export function buildAdvisoryParentHandoffMessage(params: AdvisoryParentHandoffParams): string {
  return [
    "A ticket workflow advisory command completed.",
    "",
    `Command: ${params.commandName}`,
    "",
    "Original request:",
    params.originalRequest.trim() || "(none provided)",
    "",
    "Advisory artifact:",
    params.artifactPath?.trim() || "(none)",
    "",
    "Advisory result:",
    params.advisoryResult.trim() || "(no advisory result)",
    "",
    "This is advisory only. Ticket files and ticket directories remain authoritative.",
    "Please synthesize the result for the user, explain what matters, propose the next action, and do not mutate ticket state, edit ticket files, commit, or perform workflow transitions without explicit human approval.",
  ].join("\n");
}

export function shouldSendAdvisoryParentHandoff(ctx: Pick<ExtensionCommandContext, "mode">): boolean {
  return ctx.mode === "tui" || ctx.mode === "rpc";
}

export function deliverAdvisoryParentHandoff(
  pi: ExtensionAPI,
  ctx: Pick<ExtensionCommandContext, "isIdle" | "mode">,
  params: AdvisoryParentHandoffParams,
): AdvisoryParentHandoffDelivery {
  const message = buildAdvisoryParentHandoffMessage(params);

  if (shouldSendAdvisoryParentHandoff(ctx)) {
    if (ctx.isIdle()) {
      pi.sendUserMessage(message);
    } else {
      pi.sendUserMessage(message, { deliverAs: "followUp" });
    }

    return { sent: true, message };
  }

  const suggestedHandoff = renderSuggestedAdvisoryParentHandoff(message);

  if (ctx.mode === "print") {
    process.stdout.write(`${suggestedHandoff}\n`);
  }

  return { sent: false, message, suggestedHandoff };
}

function renderSuggestedAdvisoryParentHandoff(message: string): string {
  return [
    "# Suggested Parent LLM Handoff",
    "",
    "This command is running in a non-interactive mode, so it did not trigger a parent LLM follow-up.",
    "Paste this message into an interactive parent Pi session if you want conversational synthesis:",
    "",
    message,
  ].join("\n");
}

async function inspectState(cwd: string, state: TicketState): Promise<StateStatus> {
  const relativePath = join(TICKET_ROOT, state);
  const absolutePath = join(cwd, relativePath);

  try {
    const entries = await readdir(absolutePath, { withFileTypes: true });
    const ticketFiles = entries
      .filter((entry) => entry.isFile() && TICKET_FILE_PATTERN.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));

    return {
      state,
      path: relativePath,
      exists: true,
      ticketFiles,
    };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === "ENOENT") {
      return {
        state,
        path: relativePath,
        exists: false,
        ticketFiles: [],
      };
    }

    return {
      state,
      path: relativePath,
      exists: false,
      ticketFiles: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function renderTicketStatus(status: TicketStatus): string {
  const lines = [
    "# Ticket Status",
    "",
    "Ticket state source of truth: the `tickets/<state>/` directories.",
    "This command is read-only and does not perform ticket transitions.",
    "",
    "## Counts",
  ];

  for (const state of status.states) {
    const suffix = state.exists ? "" : " (missing directory)";
    lines.push(`- ${state.state}: ${state.ticketFiles.length}${suffix}`);
  }

  lines.push("", "## Active ticket");

  const ongoing = status.states.find((state) => state.state === "ongoing");
  const ongoingTickets = ongoing?.ticketFiles ?? [];
  if (ongoingTickets.length === 0) {
    lines.push("No ticket is active.");
  } else if (ongoingTickets.length === 1) {
    lines.push(`Active ticket: ${ticketIdFromFile(ongoingTickets[0])}`);
  } else {
    lines.push(`Workflow error: multiple ongoing tickets found (${ongoingTickets.join(", ")}).`);
  }

  if (status.missingDirectories.length > 0) {
    lines.push("", "## Missing directories");
    for (const directory of status.missingDirectories) {
      lines.push(`- ${directory}`);
    }
  }

  if (status.workflowErrors.length > 0) {
    lines.push("", "## Workflow errors");
    for (const error of status.workflowErrors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join("\n");
}

function ticketIdFromFile(fileName: string): string {
  return basename(fileName, ".md");
}

function ticketIdFromPath(ticketPath: string): string {
  const fileName = basename(ticketPath);

  if (!TICKET_FILE_PATTERN.test(fileName)) {
    throw new Error(`Expected a PLF ticket file path, got ${ticketPath}`);
  }

  return ticketIdFromFile(fileName);
}

function ticketStateFromPath(ticketPath: string): TicketState | undefined {
  const parts = ticketPath.split("/");
  const possibleState = parts[1];

  return isTicketState(possibleState) ? possibleState : undefined;
}

function normalizeRelativeTicketPath(ticketPath: string): string {
  const normalized = ticketPath.replaceAll("\\", "/").replace(/^\.\//, "");

  if (!normalized.startsWith(`${TICKET_ROOT}/`)) {
    throw new Error(`Expected a path under ${TICKET_ROOT}/, got ${ticketPath}`);
  }

  return normalized;
}

function assertValidTicketId(ticketId: string): void {
  if (!TICKET_ID_PATTERN.test(ticketId)) {
    throw new Error(`Expected a PLF ticket ID, got ${ticketId}`);
  }
}

function assertValidAdvisoryArtifactType(artifactType: string): asserts artifactType is AdvisoryArtifactType {
  if (!ADVISORY_ARTIFACT_TYPES.includes(artifactType as AdvisoryArtifactType)) {
    throw new Error(`Unknown advisory artifact type: ${artifactType}`);
  }
}

function isTicketState(value: string | undefined): value is TicketState {
  return TICKET_STATES.includes(value as TicketState);
}

function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && "code" in error;
}
