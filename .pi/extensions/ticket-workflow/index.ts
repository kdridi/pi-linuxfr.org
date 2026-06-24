import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join, posix } from "node:path";

const TICKET_ROOT = "tickets";
const TICKET_STATES = ["backlog", "planned", "ongoing", "completed", "rejected"] as const;
const TICKET_FILE_PATTERN = /^PLF-\d+\.md$/;
const TICKET_ID_PATTERN = /^PLF-\d+$/;
const ADVISORY_ARTIFACT_ROOT = posix.join(TICKET_ROOT, ".artifacts");
const ADVISORY_ARTIFACT_TYPES = ["readiness", "plans", "verification", "completion"] as const;
const ADVISORY_ARTIFACT_NOTICE =
  "Advisory artifact only. Ticket files and ticket state directories remain authoritative.";

export type TicketState = (typeof TICKET_STATES)[number];
export type AdvisoryArtifactType = (typeof ADVISORY_ARTIFACT_TYPES)[number];

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
