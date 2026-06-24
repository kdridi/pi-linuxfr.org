# Pi-Native Ticket Workflow Orchestration Design

## 1. Executive Recommendation

**What should be built first:**
- A minimal set of read-only advisory commands for ticket readiness analysis and implementation planning
- Simple artifact generation that captures the analysis in a structured, inspectable format
- A single orchestration command that chains these analyses with clear human checkpoints

**What should remain manual:**
- All ticket state transitions (moving files between directories)
- Final approval of implementation plans
- Decision to split or refine tickets
- Verification and completion confirmation

**What should explicitly not be automated yet:**
- Any write operations to the repository
- Actual implementation of tickets
- Dependency resolution decisions
- Commit operations

This approach maximizes value while minimizing risk. The most time-consuming rituals are the repeated analyses and document preparation, not the actual state transitions. By automating the analysis while keeping the decisions manual, we preserve human control while reducing context consumption.

## 2. Workflow Architecture

**Orchestrator-child relationship:**
The main Pi session acts as a human-facing orchestrator with no direct file access beyond what's necessary for command execution. It interprets human intent, invokes appropriate commands, and presents results for approval. Child sessions are ephemeral, read-only, and produce structured output that the orchestrator formats for human review.

**Approach comparison:**
- CLI child process: Simple, explicit, easy to debug, but requires careful argument passing
- JSON mode: Provides structured output, but still requires CLI invocation
- RPC mode: More complex setup, overkill for this use case
- SDK: Tightest integration but adds dependency complexity
- Extension commands: Cleanest integration but requires more upfront work
- Prompt-template-only: Too fragile, hard to enforce constraints

**Recommendation:**
Start with CLI child process + JSON mode. This approach:
1. Leverages Pi's existing non-interactive capabilities
2. Provides clear input/output boundaries
3. Makes permissions explicit at the command level
4. Is easily inspectable and debuggable
5. Can be migrated to extensions later without changing the conceptual model

## 3. Command Design

### `ticket-analyze`
- **Purpose:** Analyze a backlog ticket's readiness for planning
- **Input arguments:** `ticket-path` (relative path to ticket file)
- **Preconditions:** Ticket exists in backlog/
- **Read/write permissions:** Read-only
- **Spawns child Pi:** Yes, with read-only tool restrictions
- **Expected artifact:** Readiness brief in tickets/backlog/.artifacts/
- **Reports to orchestrator:** Structured readiness assessment with specific gaps
- **Failure modes:** 
  - Ticket file not found: Clear error message
  - Malformed ticket: Partial analysis with identified issues
  - Circular dependencies: Explicit detection and reporting

### `ticket-plan`
- **Purpose:** Create implementation plan for a planned ticket
- **Input arguments:** `ticket-path` (relative path to ticket file)
- **Preconditions:** Ticket exists in planned/, all dependencies resolved or explicitly accepted
- **Read/write permissions:** Read-only
- **Spawns child Pi:** Yes, with read-only tool restrictions
- **Expected artifact:** Implementation plan in tickets/planned/.artifacts/
- **Reports to orchestrator:** Structured plan with steps, files to modify, risks
- **Failure modes:**
  - Missing dependencies: Explicit listing of unresolved dependencies
  - Unclear scope: Questions for human clarification
  - Overly complex: Suggestion to split ticket

### `ticket-verify`
- **Purpose:** Verify implementation against ticket requirements
- **Input arguments:** `ticket-path` (relative path to ticket file)
- **Preconditions:** Ticket exists in ongoing/, implementation files exist
- **Read/write permissions:** Read-only
- **Spawns child Pi:** Yes, with read-only tool restrictions
- **Expected artifact:** Verification brief in tickets/ongoing/.artifacts/
- **Reports to orchestrator:** Pass/fail assessment with specific evidence
- **Failure modes:**
  - Missing implementation: Explicit listing of unimplemented requirements
  - Partial implementation: Clear identification of gaps
  - Scope creep: Identification of changes outside ticket scope

### `workflow-status`
- **Purpose:** Provide overview of current workflow state
- **Input arguments:** None
- **Preconditions:** tickets/ directory exists
- **Read/write permissions:** Read-only
- **Spawns child Pi:** No, handled by orchestrator
- **Expected artifact:** None (inline output only)
- **Reports to orchestrator:** Count of tickets in each state, current ongoing ticket, blocked tickets
- **Failure modes:** 
  - Malformed directory structure: Error message
  - Multiple tickets in ongoing/: Warning and listing

### `ticket-orchestrate`
- **Purpose:** Guide human through complete workflow for a ticket
- **Input arguments:** `ticket-path` (relative path to ticket file)
- **Preconditions:** Ticket exists in any state
- **Read/write permissions:** Read-only (orchestrator suggests, human executes)
- **Spawns child Pi:** Yes, for analysis/plan/verify as needed
- **Expected artifact:** Multiple artifacts as needed for workflow stage
- **Reports to orchestrator:** Next recommended action with specific instructions
- **Failure modes:**
  - Invalid state transition: Clear explanation of valid transitions
  - Missing prerequisites: Specific list of what needs to be done first

## 4. Artifact Design

**Artifact location:**
Artifacts should live in a `.artifacts` subdirectory within each ticket's state directory:
```
tickets/
  backlog/
    .artifacts/
      ticket-001-readiness.md
  planned/
    .artifacts/
      ticket-001-plan.md
  ongoing/
    .artifacts/
      ticket-001-verification.md
```

**Readiness brief schema:**
```markdown
---
ticket: "ticket-001.md"
type: "readiness-brief"
generated: "2023-07-20T14:30:00Z"
status: "ready" | "needs-refinement" | "needs-split"
---

# Readiness Assessment: Ticket-001

## Summary
[One paragraph assessment of overall readiness]

## Objective Clarity
[Assessment of whether the objective is clear and atomic]

## Scope Definition
[Assessment of scope boundaries and potential issues]

## Acceptance Criteria
[Assessment of measurability and completeness]

## Dependencies
[List of dependencies and their status]

## Expected Artifacts
[Assessment of whether outputs are well-defined]

## Verification Approach
[Assessment of verifiability]

## Gaps and Questions
[Specific items that need clarification before planning]

## Recommendations
[Specific actions to take before moving to planned/]
```

**Implementation plan schema:**
```markdown
---
ticket: "ticket-001.md"
type: "implementation-plan"
generated: "2023-07-20T14:30:00Z"
estimated-complexity: "low" | "medium" | "high"
estimated-files: 3
---

# Implementation Plan: Ticket-001

## Approach
[High-level implementation strategy]

## Steps
1. [Step 1 description]
   - Files to modify: [list]
   - Expected changes: [description]
2. [Step 2 description]
   - Files to modify: [list]
   - Expected changes: [description]
[...]

## Risk Assessment
[Implementation risks and mitigations]

## Testing Strategy
[How to verify each step and the final implementation]

## Edge Cases
[Known edge cases to handle]

## Commit Strategy
[Suggested commit structure if multiple commits needed]
```

**Verification brief schema:**
```markdown
---
ticket: "ticket-001.md"
type: "verification-brief"
generated: "2023-07-20T14:30:00Z"
status: "pass" | "partial" | "fail"
---

# Verification Report: Ticket-001

## Acceptance Criteria Assessment
- [Criteria 1]: [Pass/Fail] - [Evidence]
- [Criteria 2]: [Pass/Fail] - [Evidence]
[...]

## Implementation Completeness
[Assessment of whether all planned changes were made]

## Scope Adherence
[Assessment of whether implementation stayed within ticket scope]

## Code Quality
[Assessment of code quality and maintainability]

## Testing
[Assessment of test coverage and quality]

## Gaps and Issues
[Specific items that don't meet requirements]

## Recommendations
[Specific actions to take before completion]
```

**Artifact authority:**
- Artifacts are advisory only and can be regenerated at any time
- The ticket file itself remains the authoritative definition of requirements
- The actual code changes remain the authoritative implementation
- Artifacts older than their ticket's last modification date should be considered stale

**Avoiding stale artifacts:**
- Each artifact includes the generation timestamp
- Commands should check if artifact is newer than ticket file
- Orchestrator should warn when using stale artifacts
- Human can always request regeneration

## 5. Guardrails and Safety

**Preventing child session mutations:**
- Child sessions are launched with explicit read-only tool restrictions
- No file write, shell execution with side effects, or git operations
- Child sessions receive a system prompt emphasizing read-only nature
- Child session output is validated to ensure no mutation instructions

**Preventing recursive command spawning:**
- Child sessions are launched with a restricted tool set that excludes the orchestration commands
- Child sessions receive a system prompt prohibiting command invocation
- Orchestrator validates child session output for any command invocations

**Enforcing single ongoing ticket:**
- `ticket-orchestrate` checks ongoing/ before suggesting activation
- `workflow-status` warns if multiple tickets in ongoing/
- Activation command explicitly checks and fails if ongoing/ not empty

**Preventing scope exceedance:**
- Implementation plan includes explicit file list and change descriptions
- Verification checks implementation against planned scope
- Orchestrator warns if implementation touches files not in plan

**Keeping commits atomic:**
- Implementation plan suggests commit structure
- Verification checks if changes match suggested commits
- Orchestrator can suggest splitting changes if verification detects multiple concerns

**Handling failed/partial child sessions:**
- Child sessions have explicit timeouts
- Orchestrator validates child output structure before presenting
- Partial results are clearly marked as incomplete
- Failed sessions generate error artifacts with diagnostic information

## 6. Child-Session Prompt Design

**Prompt patterns:**
Child sessions should receive a structured prompt with:
1. System role definition emphasizing read-only, advisory nature
2. Explicit tool restrictions
3. Specific task description with clear inputs
4. Required output format specification
5. Error handling instructions

**Embedded context:**
- Workflow rules relevant to the specific task
- Definitions of key concepts (e.g., "acceptance criteria" for readiness analysis)
- Output format requirements
- Constraints and boundaries

**File inspection:**
Child sessions should discover through inspection:
- Ticket content and structure
- Related files mentioned in tickets
- Existing artifacts for context
- Project structure relevant to the task

**Output structure:**
Child sessions should produce:
- JSON-formatted output for programmatic consumption
- Structured sections matching the artifact schema
- Clear separation of facts, analysis, and recommendations
- Explicit identification of uncertainties and gaps

**Example child prompt for readiness analysis:**
```
You are a read-only ticket analyst for a Pi-assisted workflow.
You MUST NOT write any files, execute any commands with side effects, or make any changes to the project.
Your role is purely advisory - to analyze and report.

Task: Analyze the readiness of a backlog ticket for planning.

Input: Read the ticket file at {ticket-path}

Analysis requirements:
1. Evaluate objective clarity: Is the goal atomic and unambiguous?
2. Evaluate scope definition: Are boundaries clear and appropriate?
3. Evaluate acceptance criteria: Are they measurable and complete?
4. Identify dependencies: What must exist before this ticket?
5. Evaluate expected artifacts: Are outputs well-defined?
6. Assess verification approach: Can success be objectively measured?

Output format (JSON):
{
  "status": "ready" | "needs-refinement" | "needs-split",
  "summary": "One paragraph assessment",
  "objective_clarity": {"assessment": "...", "issues": ["..."]},
  "scope_definition": {"assessment": "...", "issues": ["..."]},
  "acceptance_criteria": {"assessment": "...", "issues": ["..."]},
  "dependencies": [{"id": "...", "description": "...", "status": "..."}],
  "expected_artifacts": {"assessment": "...", "issues": ["..."]},
  "verification_approach": {"assessment": "...", "issues": ["..."]},
  "gaps": ["Specific items needing clarification"],
  "recommendations": ["Specific actions to take"]
}

If you cannot complete the analysis, return:
{
  "error": "Description of what went wrong",
  "partial_analysis": {...}  // Any completed portions
}
```

## 7. Human-in-the-Loop Checkpoints

**Explicit approval required for:**
- Moving a ticket from backlog/ to planned/
- Moving a ticket from planned/ to ongoing/
- Moving a ticket from ongoing/ to completed/
- Moving a ticket to rejected/
- Splitting a ticket
- Merging tickets
- Accepting a ticket with unresolved dependencies

**Decisions the orchestrator should never make alone:**
- Whether a ticket is "ready enough" despite gaps
- Whether to split a ticket or refine it
- Whether to proceed with unresolved dependencies
- Whether implementation meets acceptance criteria
- Whether to commit changes

**Surfacing questions when a ticket is not ready:**
- Orchestrator should explicitly list gaps and questions
- Questions should be formatted for easy human response
- Orchestrator should offer specific options (refine, split, reject, etc.)
- Uncertainties should be highlighted, not buried in prose

## 8. Incremental Implementation Plan

### Ticket 1: Basic Readiness Analysis Command
- **Objective:** Implement the `ticket-analyze` command for basic backlog ticket readiness assessment
- **Scope:** 
  - Command definition in `.pi/commands/ticket-analyze.md`
  - Child prompt template for readiness analysis
  - Basic artifact generation for readiness briefs
  - Simple orchestrator integration to invoke and display results
- **Acceptance Criteria:**
  - `ticket-analyze` can be invoked with a backlog ticket path
  - It generates a structured readiness brief in the appropriate location
  - It correctly identifies missing acceptance criteria, dependencies, and scope issues
  - It provides clear recommendations for refinement
  - It does not modify any files outside the .artifacts directory
- **Likely Files:**
  - `.pi/commands/ticket-analyze.md`
  - `.pi/prompts/readiness-analysis.md`
  - `.pi/scripts/ticket-analyze.sh` (wrapper script)
- **Dependencies:** None
- **Verification:**
  - Create test tickets with various issues (missing criteria, unclear scope, etc.)
  - Run `ticket-analyze` on each
  - Verify artifacts are generated correctly
  - Verify no mutations occur outside .artifacts
  - Verify recommendations address identified issues

### Ticket 2: Workflow Status Command
- **Objective:** Implement the `workflow-status` command to provide overview of ticket workflow state
- **Scope:**
  - Command definition in `.pi/commands/workflow-status.md`
  - Logic to count tickets in each state
  - Detection of workflow violations (multiple ongoing tickets)
  - Formatted output for human consumption
- **Acceptance Criteria:**
  - `workflow-status` provides counts of tickets in each state
  - It identifies the current ongoing ticket if any
  - It warns if multiple tickets are in ongoing/
  - It lists tickets with unresolved dependencies
  - It does not modify any files
- **Likely Files:**
  - `.pi/commands/workflow-status.md`
  - `.pi/scripts/workflow-status.sh` (wrapper script)
- **Dependencies:** None
- **Verification:**
  - Create test tickets in various states
  - Run `workflow-status` and verify correct counts
  - Add multiple tickets to ongoing/ and verify warning
  - Verify no mutations occur

### Ticket 3: Implementation Planning Command
- **Objective:** Implement the `ticket-plan` command for creating implementation plans
- **Scope:**
  - Command definition in `.pi/commands/ticket-plan.md`
  - Child prompt template for implementation planning
  - Artifact generation for implementation plans
  - Dependency checking before planning
- **Acceptance Criteria:**
  - `ticket-plan` can be invoked with a planned ticket path
  - It checks that dependencies are resolved or explicitly accepted
  - It generates a structured implementation plan
  - It identifies files to modify and expected changes
  - It assesses risks and suggests testing approach
  - It does not modify any files outside the .artifacts directory
- **Likely Files:**
  - `.pi/commands/ticket-plan.md`
  - `.pi/prompts/implementation-planning.md`
  - `.pi/scripts/ticket-plan.sh` (wrapper script)
- **Dependencies:** Ticket 1 (for artifact pattern)
- **Verification:**
  - Create test tickets with various complexity levels
  - Run `ticket-plan` on each
  - Verify plans are generated correctly
  - Verify dependency checking works
  - Verify no mutations occur outside .artifacts

### Ticket 4: Verification Command
- **Objective:** Implement the `ticket-verify` command for verifying implementation against requirements
- **Scope:**
  - Command definition in `.pi/commands/ticket-verify.md`
  - Child prompt template for verification
  - Artifact generation for verification briefs
  - Comparison against acceptance criteria and implementation plan
- **Acceptance Criteria:**
  - `ticket-verify` can be invoked with an ongoing ticket path
  - It checks implementation against acceptance criteria
  - It verifies scope adherence against implementation plan
  - It identifies gaps and issues
  - It provides clear pass/fail assessment
  - It does not modify any files outside the .artifacts directory
- **Likely Files:**
  - `.pi/commands/ticket-verify.md`
  - `.pi/prompts/verification.md`
  - `.pi/scripts/ticket-verify.sh` (wrapper script)
- **Dependencies:** Ticket 1, Ticket 3 (for plan comparison)
- **Verification:**
  - Create test tickets with implementation
  - Run `ticket-verify` on each
  - Verify assessments are accurate
  - Verify gap identification works
  - Verify no mutations occur outside .artifacts

### Ticket 5: Basic Orchestration Command
- **Objective:** Implement a basic `ticket-orchestrate` command that chains analyses with human checkpoints
- **Scope:**
  - Command definition in `.pi/commands/ticket-orchestrate.md`
  - Logic to determine appropriate next action based on ticket state
  - Integration with other commands (analyze, plan, verify)
  - Human checkpoint management
- **Acceptance Criteria:**
  - `ticket-orchestrate` can be invoked with a ticket in any state
  - It determines the appropriate next action based on state
  - It invokes the appropriate analysis command
  - It presents results with clear options for human decision
  - It suggests specific next steps
  - It does not perform any state transitions automatically
- **Likely Files:**
  - `.pi/commands/ticket-orchestrate.md`
  - `.pi/scripts/ticket-orchestrate.sh` (wrapper script)
- **Dependencies:** Tickets 1-4
- **Verification:**
  - Create test tickets in various states
  - Run `ticket-orchestrate` on each
  - Verify correct next action is suggested
  - Verify human checkpoints are clear
  - Verify no automatic state transitions

## 9. Premortem

**Assuming the command system failed after a month, likely causes:**

1. **Over-reliance on artifacts without regeneration**
   - Early warning: Decisions based on outdated analysis
   - Mitigation: Clear staleness indicators, easy regeneration, freshness checks

2. **Child sessions producing low-quality analysis**
   - Early warning: Humans ignoring artifacts and reverting to manual analysis
   - Mitigation: Iterative prompt refinement, quality checks in orchestrator, human feedback loop

3. **Too much friction in the workflow**
   - Early warning: Commands being bypassed in favor of direct file manipulation
   - Mitigation: Streamlined command interface, clear value proposition, gradual adoption

4. **Scope creep in command implementation**
   - Early warning: Commands taking longer to implement than the tickets they manage
   - Mitigation: Strict ticket scoping, incremental implementation, regular value assessment

5. **Inconsistent ticket quality undermining analysis**
   - Early warning: Analysis constantly failing due to malformed tickets
   - Mitigation: Ticket templates, clear quality criteria, refinement as first-class workflow step

**Design choices that reduce these risks:**

1. **Read-only by default** - Prevents catastrophic failures from automation
2. **Explicit human checkpoints** - Ensures human remains in control
3. **Artifact staleness tracking** - Makes outdated information obvious
4. **Incremental implementation** - Allows course correction before over-investment
5. **Clear separation of concerns** - Makes components independently testable and replaceable

## 10. Critique and Alternatives

**Critique of the proposed design:**

**Over-engineered aspects:**
- The artifact schema might be too structured for early adoption
- The incremental implementation plan might be too granular
- The child session prompt design might be too prescriptive

**Too weak aspects:**
- No automatic validation of ticket file format
- No integration with git for commit message validation
- No automatic detection of stale artifacts
- No metrics or feedback loop to improve analysis quality

**Simpler alternative:**
A single `ticket-advice` command that:
- Takes a ticket path and a question as arguments
- Uses a single child session to answer the question
- Returns inline advice without generating artifacts
- Leaves all formatting and organization to the human

This would be faster to implement but loses the structured, inspectable artifacts that provide long-term value.

**More ambitious alternative:**
A full workflow state machine that:
- Enforces all workflow rules automatically
- Provides a TUI for workflow navigation
- Integrates with git for automatic commit validation
- Tracks metrics on ticket flow and analysis quality
- Implements a feedback loop to improve prompts based on human corrections

This would provide more value but adds significant complexity and reduces transparency.

## 11. Agent Behavior Recommendations

**As the orchestrator Pi session:**
1. Always start with `workflow-status` to understand current state
2. Use `ticket-orchestrate` as the primary entry point for ticket work
3. Present analysis results with clear options, not just information
4. Highlight uncertainties and gaps prominently
5. Suggest specific next actions, not just observations
6. Check artifact freshness before relying on previous analysis
7. Confirm human understanding before suggesting state transitions
8. Keep command invocations explicit and logged for transparency

**As a child Pi session:**
1. Strictly adhere to read-only constraints
2. Focus on objective analysis, not recommendations for action
3. Clearly distinguish between facts, inferences, and uncertainties
4. Provide specific evidence for all assessments
5. Use structured output formats as specified
6. Avoid making assumptions beyond what's in the ticket
7. Report partial results if full analysis isn't possible
8. Be explicit about limitations and constraints

**Information that makes the system fast, reliable, and useful:**
1. Clear, atomic ticket objectives
2. Measurable, complete acceptance criteria
3. Explicit dependency declarations
4. Well-defined expected artifacts
5. Verification approach in the ticket itself
6. Consistent ticket file format
7. Examples of good tickets for reference
8. Project-specific context about architecture and conventions

The most effective optimization is improving ticket quality at the source. Well-structured tickets make analysis more reliable and reduce the need for clarification loops. The command system should evolve to not just analyze tickets but help improve their quality over time.