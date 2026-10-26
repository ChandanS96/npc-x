import OpenAI from 'openai';
import { VerificationEngine } from '../engine/verification-engine.js';
import {
  VerificationRun,
  CounterexampleFinding,
  SecurityFinding,
  PatchAttempt
} from '../types/index.js';
import { MemoryService } from './memory-service.js';

export interface AssistantResponse {
  answer: string;
  citedEvidence: Array<{
    type: string;
    reference: string;
    detail: string;
  }>;
  operatingMode: 'LOCAL_DETERMINISTIC_ENGINE' | 'OPENAI_PROVIDER';
  confidence: number;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type QueryIntent = 'GENERAL_ARCHITECTURE' | 'RUN_SPECIFIC';

export class LlmAssistantService {
  private static openaiClient: OpenAI | null = null;
  private static warnedMissingKey = false;

  public static getOpenAIClient(): OpenAI | null {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_openai_api_key')) {
      if (!this.warnedMissingKey) {
        console.warn('⚠️ [RAZE Assistant] OPENAI_API_KEY is not set (or is placeholder). Using LOCAL_DETERMINISTIC_ENGINE fallback.');
        this.warnedMissingKey = true;
      }
      return null;
    }
    if (!this.openaiClient) {
      console.log('⚡ [RAZE Assistant] Initialized live OpenAI client with configured API key.');
      this.openaiClient = new OpenAI({ apiKey: apiKey.trim() });
    }
    return this.openaiClient;
  }

  public static setApiKey(key: string): void {
    process.env.OPENAI_API_KEY = key.trim();
    this.openaiClient = new OpenAI({ apiKey: key.trim() });
  }

  /**
   * Intelligently detects whether the query is about general platform capabilities
   * or requires a specific verification run's execution trace.
   */
  public static detectIntent(question: string): QueryIntent {
    const qLower = question.toLowerCase();

    // Specific indicators requesting concrete execution trace from a specific run
    const runSpecificTraces = [
      'this run',
      'current run',
      'selected run',
      'this attempt',
      'this patch',
      'why did this fail',
      'why did my patch fail',
      'why did trust collapse on attempt',
      'show the diff',
      'show the patch',
      'show me the diff',
      'show me the patch',
      'this test failure',
      'run logs',
      'execution trace for this run',
      'reproduction command for this run',
      'what was the counterexample for this run'
    ];

    for (const phrase of runSpecificTraces) {
      if (qLower.includes(phrase)) {
        return 'RUN_SPECIFIC';
      }
    }

    return 'GENERAL_ARCHITECTURE';
  }

  public static async answerQuestion(
    runId?: string,
    question: string = '',
    history: ChatMessage[] = [],
    directRunContext?: any
  ): Promise<AssistantResponse> {
    const openai = this.getOpenAIClient();
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // Retrieve run data if available
    const run: VerificationRun | undefined =
      (runId ? VerificationEngine.getRunById(runId) : undefined) || directRunContext;

    const intent = this.detectIntent(question);

    // ==============================================================
    // 1. ACTIVE OPENAI PROVIDER ROUTING
    // ==============================================================
    if (openai) {
      // If user is explicitly demanding run-specific trace when NO run is selected:
      if (!run && intent === 'RUN_SPECIFIC') {
        return {
          answer: `**Run Context Required:**\n\nYou are asking for specific execution traces, failure logs, or patch diffs from a verification run, but no run is currently selected.\n\n👉 **To inspect run-specific empirical evidence:** Click on any verification run from the **Overview**, **Repositories**, or **Runs History** pages.\n\nOtherwise, feel free to ask any general architectural questions about the **Trust Collapse Engine**, **Repair Shadow Workspaces**, or the **6 Autonomous Specialized Agents**.`,
          citedEvidence: [],
          operatingMode: 'OPENAI_PROVIDER',
          confidence: 0.95,
          model
        };
      }

      try {
        return await this.generateOpenAIAnswer(openai, model, question, run, history);
      } catch (err: any) {
        const statusCode = err.status || err.statusCode || 500;
        console.error(`❌ [RAZE Assistant] OpenAI API Call Failed (HTTP ${statusCode}):`, err.message);
        if (statusCode === 401) {
          console.error('👉 Cause: Invalid OpenAI API key. Verify OPENAI_API_KEY in your .env or Vercel environment variables.');
        } else if (statusCode === 429) {
          console.error('👉 Cause: OpenAI Rate limit exceeded or Insufficient Quota. Check your billing at platform.openai.com.');
        }
        const fallback = this.generateDeterministicAnswer(run, question, intent);
        return {
          ...fallback,
          answer: `*(Notice: OpenAI API returned HTTP ${statusCode} [${err.message}]. Served empirical offline analysis below)*\n\n${fallback.answer}`
        };
      }
    }

    // ==============================================================
    // 2. DETERMINISTIC ENGINE (Zero-Cost Offline Fallback)
    // ==============================================================
    return this.generateDeterministicAnswer(run, question, intent);
  }

  /**
   * Generates intelligent, evidence-grounded responses using OpenAI GPT-4o / GPT-4o-mini
   */
  private static async generateOpenAIAnswer(
    openai: OpenAI,
    model: string,
    question: string,
    run?: VerificationRun,
    history: ChatMessage[] = []
  ): Promise<AssistantResponse> {
    const systemPrompt = this.buildSystemPrompt(run);
    const citedEvidence: Array<{ type: string; reference: string; detail: string }> = [];

    // Format chat history for multi-turn conversation
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: question }
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.2, // Low temperature for high empirical precision
      max_tokens: 1200
    });

    const answer = completion.choices[0]?.message?.content || 'No response generated.';

    // Extract structured evidence citations from run context based on content
    if (run) {
      if (
        answer.toLowerCase().includes('counterexample') ||
        answer.toLowerCase().includes('collapse') ||
        answer.toLowerCase().includes('fail')
      ) {
        for (const cx of run.counterexamples.slice(0, 2)) {
          citedEvidence.push({
            type: 'COUNTEREXAMPLE',
            reference: cx.testName,
            detail: `Input: ${cx.inputVector} -> Actual: ${cx.actualOutput}`
          });
        }
      }

      if (answer.toLowerCase().includes('hash') || answer.toLowerCase().includes('attempt')) {
        for (const att of run.attempts.slice(0, 2)) {
          citedEvidence.push({
            type: 'PATCH_HASH',
            reference: `Attempt #${att.attemptNumber}`,
            detail: `SHA-256: ${att.patchHash.substring(0, 16)}...`
          });
        }
      }

      if (answer.toLowerCase().includes('security') || answer.toLowerCase().includes('circuit breaker')) {
        for (const sec of run.securityFindings.slice(0, 2)) {
          citedEvidence.push({
            type: 'SECURITY_FINDING',
            reference: `[${sec.severity}] ${sec.title}`,
            detail: `${sec.affectedFile}:${sec.lineRange}`
          });
        }
      }

      if (answer.toLowerCase().includes('mutation') && run.mutationReport) {
        citedEvidence.push({
          type: 'MUTATION_SCORE',
          reference: 'AST Mutation Engine',
          detail: `${run.mutationReport.mutationScore}% killed (${run.mutationReport.mutantsKilled}/${run.mutationReport.totalMutants})`
        });
      }
    } else {
      // General platform mode citations
      if (answer.toLowerCase().includes('trust collapse')) {
        citedEvidence.push({
          type: 'CORE_ENGINE',
          reference: 'Trust Collapse Engine',
          detail: '7-stage state machine that terminates approval upon counterexample discovery'
        });
      }
      if (answer.toLowerCase().includes('shadow')) {
        citedEvidence.push({
          type: 'SANDBOX_ISOLATION',
          reference: 'Repair Shadow Mode',
          detail: 'Ephemeral workspace cloning preventing host exposure'
        });
      }
      if (answer.toLowerCase().includes('agent')) {
        citedEvidence.push({
          type: 'AGENT_PIPELINE',
          reference: '6 Specialized Agents',
          detail: 'Investigator, Repair, Adversarial Hunter, Security Guardian, Test Strengthener, Release Gate Judge'
        });
      }
    }

    return {
      answer,
      citedEvidence,
      operatingMode: 'OPENAI_PROVIDER',
      confidence: 0.98,
      model
    };
  }

  /**
   * Constructs the structured System Prompt injecting the verification run's empirical data
   * or the complete RAZE Architecture Knowledge Base when in Platform Knowledge Mode.
   */
  private static buildSystemPrompt(run?: VerificationRun): string {
    if (!run) {
      return `You are the RAZE Evidence Assistant, an expert AI software verification and application security specialist.
You are currently operating in **PLATFORM KNOWLEDGE MODE** (no individual run is selected).

Your mission is to provide comprehensive, technical, and accurate answers regarding the RAZE platform architecture:

=== RAZE CORE PHILOSOPHY ===
"AI that doesn't just write code—it proves whether the code is safe to ship."
Every fix must face an adversarial challenge. Every security claim must have evidence. Every unresolved risk must remain visible.

=== 1. THE TRUST COLLAPSE ENGINE ===
- A deterministic 7-stage verification state machine:
  1. Reproduction: Isolate failure with a deterministic test.
  2. Bounded Synthesis: Propose targeted code repair.
  3. Shadow Validation: Apply patch to an isolated workspace copy and execute baseline tests.
  4. Adversarial Falsification: Agent 3 hunts for boundary vectors, malformed types, and edge cases.
  5. Mutation Testing: Agent 5 mutates the AST to verify challenge test assertion strength.
  6. Security & Circuit Breaker: Agent 4 scans for CVEs, prototype pollution, dynamic eval, and prohibited files.
  7. Release Gate: Agent 6 deterministically evaluates all evidence against policy.
- If ANY adversarial counterexample falsifies the repair claim, TRUST IMMEDIATELY COLLAPSES. Automatic approval is revoked, and failure evidence is fed back into bounded repair iterations.

=== 2. REPAIR SHADOW MODE ===
- Workspaces are cloned into ephemeral, isolated sandboxes (inside \`.shadow-workspaces/\`).
- Host machine is strictly protected against arbitrary code execution.
- Ephemeral workspaces are automatically cleaned up post-verification.

=== 3. THE 6 SPECIALIZED AUTONOMOUS AGENTS ===
- Agent 1 (Failure Investigator & Reproduction Specialist): Diagnoses stack traces and isolates deterministic reproduction scripts.
- Agent 2 (Bounded Repair Synthesizer): Synthesizes targeted diffs with disclosed limitations.
- Agent 3 (Adversarial Counterexample Hunter): Actively seeks to break the repair using boundary vectors and negative edge cases.
- Agent 4 (Security Guardian & Circuit Breaker): Evaluates diffs against prohibited file rules, dynamic eval, injection vectors, and trips execution circuit breakers.
- Agent 5 (Challenge Test Suite & Mutation Strengthener): Generates AST mutations (e.g. flipping comparison operators, altering return statements) to guarantee high test assertion kill rates.
- Agent 6 (Evidence Judge & Release Gate): Deterministic policy engine that evaluates empirical test results and seals approvals with cryptographic SHA-256 patch hashes.

=== 4. CRYPTOGRAPHIC VERIFICATION & MEMORY BANK ===
- Patches are SHA-256 hashed and sealed with human sign-offs to guarantee tamper-proof releases.
- Verification Memory Bank persists failure trajectories and counterexample patterns in SQLite WAL mode.

INSTRUCTIONS:
1. Explain platform concepts clearly with technical depth, bold headings, and bullet points.
2. If the user asks about a general feature (e.g. "How does Trust Collapse work?", "Explain Shadow Workspaces", "What agents exist?"), answer thoroughly using the architecture facts above.
3. If the user specifically asks for execution logs or diffs from a run, politely remind them that they can select an active run from the workspace.`;
    }

    // Historical memory lookup
    const memories = MemoryService.searchMemory(run.repositoryId || '', run.repositoryName || 'discount');

    return `You are the RAZE Evidence Assistant, an expert AI software verification and security intelligence specialist.
Your answers MUST be strictly grounded in the empirical facts, test outcomes, and cryptographic hashes provided below.

=== CURRENT VERIFICATION RUN CONTEXT ===
- Run ID: ${run.id}
- Target Repository: ${run.repositoryName}
- Target File: ${run.bugReport?.targetFile || 'Unknown'}
- Bug Title: ${run.bugReport?.title || 'Unknown'}
- Bug Description: ${run.bugReport?.description || 'Unknown'}
- Current Attempt: #${run.currentAttempt} of ${run.attempts?.length || 1}
- Run Status: ${run.status}
- Final Release Recommendation: ${run.recommendation || 'EVALUATING'}

=== TRUST COLLAPSE ENGINE (FALSIFICATION EVIDENCE) ===
- Trust Collapsed: ${run.trustCollapsed ? 'YES (FALSIFIED BY EXECUTABLE TEST)' : 'NO'}
- Trust Collapse Reason: ${run.trustCollapseReason || 'None'}
- Confirmed Counterexamples (${run.counterexamples?.length || 0}):
${(run.counterexamples || [])
  .map(
    (cx: CounterexampleFinding) => `  * Test Name: ${cx.testName} (Attempt #${cx.attemptNumber})
    - Boundary Input Vector: ${cx.inputVector}
    - Expected Output: ${cx.expectedOutput}
    - Actual Observed Output: ${cx.actualOutput}
    - Reproduction Command: ${cx.reproductionCommand}
    - Confirmed Executable: ${cx.confirmed ? 'YES' : 'NO'}`
  )
  .join('\n') || '  Zero active counterexamples'}

=== AST MUTATION TESTING TRUST METRICS ===
${
  run.mutationReport
    ? `- Mutation Score: ${run.mutationReport.mutationScore}%
- Mutants Killed: ${run.mutationReport.mutantsKilled} of ${run.mutationReport.totalMutants}
- Mutants Survived: ${run.mutationReport.mutantsSurvived}
- Integrity Verdict: ${run.mutationReport.survivingAnalysis}`
    : '- Mutation Testing: Pending / Not Yet Executed'
}

=== SECURITY GUARDIAN & CIRCUIT BREAKER ===
- Circuit Breaker Tripped: ${run.circuitBreakerTripped ? `YES (HALTED: ${run.circuitBreakerReason})` : 'NO (Nominal & Armed)'}
- Security Findings (${run.securityFindings?.length || 0}):
${(run.securityFindings || [])
  .map(
    (s: SecurityFinding) => `  * [${s.severity}] ${s.title} in ${s.affectedFile}:${s.lineRange}
    - Detection Method: ${s.detectionMethod}
    - Evidence: ${s.evidence}
    - Recommended Mitigation: ${s.recommendedMitigation}`
  )
  .join('\n') || '  Zero security findings detected'}

=== PATCH PROPOSALS & CRYPTOGRAPHIC HASHES ===
${(run.attempts || [])
  .map(
    (att: PatchAttempt) => `Attempt #${att.attemptNumber} [Status: ${att.status}]:
- SHA-256 Patch Hash: ${att.patchHash}
- Repair Intent: ${att.explanation}
- Expected Behavior: ${att.expectedBehavior}
- Known Risks Disclosed: ${att.knownRisks?.join('; ') || 'None'}
- Test Suite Results: ${att.testPassedCount} Passed, ${att.testFailedCount} Failed
- Patch Diff:
\`\`\`diff
${att.diff.substring(0, 1000)}
\`\`\``
  )
  .join('\n\n')}

=== DETERMINISTIC POLICY EVALUATION RULES ===
${
  run.policyResult
    ? `- Verdict: ${run.policyResult.recommendation}
- Blocking Reasons: ${run.policyResult.blockingReasons.join('; ') || 'None'}
- Evaluated Rules:
${run.policyResult.rulesEvaluated.map((r: any) => `  * [${r.passed ? 'PASS' : 'FAIL'}] ${r.name}: ${r.evidenceSummary}`).join('\n')}`
    : '- Policy Result: Pending'
}

=== HISTORICAL REPAIR PATTERNS FROM MEMORY ===
${memories.slice(0, 2).map((m: any) => `* Memory Record [${m.id}]: ${m.defectPattern} in ${m.repositoryId} -> Root Cause: ${m.rootCause}`).join('\n')}

INSTRUCTIONS FOR YOUR RESPONSE:
1. Ground your answers strictly in the empirical facts, hashes, test names, and counterexamples provided above.
2. If the user asks "Why did trust collapse?", explain precisely which test failed, the boundary input vector (e.g. negative discount or >100%), and how the actual behavior contradicted the expected specification.
3. If the user asks "What changed between attempts?", compare the naive check in Attempt #1 with the hardened type & range checks in Attempt #2.
4. When citing evidence, reference specific attempt numbers, SHA-256 hashes, or reproduction commands.
5. Format your output in concise, highly readable Markdown with bold headings and code blocks.`;
  }

  /**
   * Deterministic fallback engine for offline development or when OPENAI_API_KEY is not set.
   * Fully answers general platform questions even when offline!
   */
  private static generateDeterministicAnswer(
    run?: VerificationRun,
    question: string = '',
    intent: QueryIntent = 'GENERAL_ARCHITECTURE'
  ): AssistantResponse {
    const qLower = question.toLowerCase();
    const citedEvidence: Array<{ type: string; reference: string; detail: string }> = [];
    const operatingMode = 'LOCAL_DETERMINISTIC_ENGINE';

    // ==============================================================
    // A. GENERAL PLATFORM QUESTIONS (When no run is selected OR general query)
    // ==============================================================
    if (!run || intent === 'GENERAL_ARCHITECTURE') {
      // 1. Trust Collapse Engine
      if (qLower.includes('trust collapse') || (qLower.includes('how') && qLower.includes('collapse'))) {
        citedEvidence.push({
          type: 'CORE_ENGINE',
          reference: 'Trust Collapse Engine',
          detail: '7-stage state machine that terminates approval upon counterexample discovery'
        });
        return {
          answer: `**The RAZE Trust Collapse Engine:**\n\n` +
            `The **Trust Collapse Engine** enforces a fundamental rule: *no AI-generated fix is trusted based solely on passing reproduction tests.* It operates as a 7-stage deterministic verification lifecycle:\n\n` +
            `1. **Reproduction:** Agent 1 isolates the failing test case.\n` +
            `2. **Bounded Synthesis:** Agent 2 proposes a patch with strict line bounds and disclosed limitations.\n` +
            `3. **Shadow Validation:** The patch is applied inside an isolated ephemeral shadow sandbox.\n` +
            `4. **Adversarial Falsification:** Agent 3 (Counterexample Hunter) attacks the patch with extreme boundary vectors, type variations, and negative inputs.\n` +
            `5. **Trust Collapse Trigger:** If **any** adversarial check fails, trust immediately collapses. Automatic approval is revoked, and the failure evidence is fed back to synthesize a stronger patch.\n` +
            `6. **Mutation Testing:** Agent 5 verifies the challenge test suite's assertion strength by injecting AST mutations.\n` +
            `7. **Release Gate:** Agent 6 cryptographically seals the verified patch SHA-256 hash.\n\n` +
            `Trust Collapse ensures broken or superficial repairs never reach production.`,
          citedEvidence,
          operatingMode,
          confidence: 0.99
        };
      }

      // 2. Repair Shadow Workspaces
      if (qLower.includes('shadow') || qLower.includes('sandbox')) {
        citedEvidence.push({
          type: 'SANDBOX_ISOLATION',
          reference: 'Repair Shadow Mode',
          detail: 'Ephemeral workspace cloning preventing host exposure'
        });
        return {
          answer: `**Signature Feature: Repair Shadow Mode:**\n\n` +
            `**Repair Shadow Mode** provides ephemeral, isolated execution environments for running untrusted code:\n\n` +
            `- **Isolated Workspace Cloning:** Repositories are cloned into an ephemeral sandbox directory (\`.shadow-workspaces/\`) before any code is modified or executed.\n` +
            `- **Host Security Protection:** Tests and proposed repairs run within this sandbox, preventing malicious scripts or accidental side-effects from affecting the host development system.\n` +
            `- **Cryptographic Patch Verification:** The candidate patch is applied to the clean clone, and its SHA-256 hash is calculated and verified prior to test execution.\n` +
            `- **Automated Cleanup:** Once verification completes, the ephemeral workspace is automatically purged.\n\n` +
            `This enables aggressive automated testing without risking project corruption or host exposure.`,
          citedEvidence,
          operatingMode,
          confidence: 0.99
        };
      }

      // 3. Autonomous Agents
      if (qLower.includes('agent') || qLower.includes('who') || qLower.includes('autonomous')) {
        citedEvidence.push({
          type: 'AGENT_PIPELINE',
          reference: '6 Specialized Agents',
          detail: 'Investigator, Repair, Adversarial Hunter, Security Guardian, Test Strengthener, Release Gate Judge'
        });
        return {
          answer: `**The 6 Autonomous Specialized Agents of RAZE:**\n\n` +
            `1. **Agent 1 — Failure Investigator:** Analyzes issue reports and stack traces to isolate deterministic reproduction scripts.\n` +
            `2. **Agent 2 — Bounded Repair Synthesizer:** Proposes minimal code repairs with strict diff bounds and disclosed limitations.\n` +
            `3. **Agent 3 — Adversarial Counterexample Hunter:** Seeks to falsify the repair by generating extreme boundary vectors and edge cases.\n` +
            `4. **Agent 4 — Security Guardian & Circuit Breaker:** Inspects ASTs for dynamic eval, command injections, and trips the execution circuit breaker if prohibited files are targeted.\n` +
            `5. **Agent 5 — Test Suite Strengthener:** Generates AST code mutations to measure test kill rates and identify coverage blind spots.\n` +
            `6. **Agent 6 — Evidence Judge & Release Gate:** Deterministic policy engine that evaluates rules and seals approved patches with cryptographic SHA-256 hashes.`,
          citedEvidence,
          operatingMode,
          confidence: 0.99
        };
      }

      // 4. Cryptographic Verification & Patch Hashes
      if (qLower.includes('cryptographic') || qLower.includes('hash') || qLower.includes('sha-256')) {
        citedEvidence.push({
          type: 'CRYPTOGRAPHIC_SEAL',
          reference: 'SHA-256 Patch Hash',
          detail: 'Every proposed patch is bound to an immutable SHA-256 cryptographic digest'
        });
        return {
          answer: `**Cryptographic Patch Verification in RAZE:**\n\n` +
            `- Every proposed unified Git patch is hashed using **SHA-256** upon synthesis.\n` +
            `- The test runner, mutation testing engine, and security scanner are all cryptographically bound to that exact patch digest.\n` +
            `- When human sign-off occurs in the Release Gate, the reviewer signs off on the specific SHA-256 hash.\n` +
            `- If even a single byte in the patch changes after testing, the release gate immediately blocks integration.\n\n` +
            `This eliminates the risk of testing one version of a fix while deploying another.`,
          citedEvidence,
          operatingMode,
          confidence: 0.99
        };
      }

      // Fallback only if the user specifically asked for a run trace when no run is selected
      if (!run && intent === 'RUN_SPECIFIC') {
        return {
          answer: `**Run Context Required:**\n\nYou are asking for specific execution traces from a verification run, but no run is currently selected.\n\n👉 **To inspect run-specific empirical evidence:** Click on any verification run from the **Overview**, **Repositories**, or **Runs History** pages.\n\nOr ask general questions about the **Trust Collapse Engine**, **Repair Shadow Workspaces**, or the **6 Autonomous Specialized Agents**.`,
          citedEvidence: [],
          operatingMode,
          confidence: 0.95
        };
      }

      // Default platform knowledge overview
      return {
        answer: `**RAZE Autonomous AI Engineering & Verification Platform:**\n\n` +
          `RAZE is an autonomous software engineering ecosystem built on the philosophy: *"AI that doesn't just write code—it proves whether the code is safe to ship."*\n\n` +
          `Key Architecture Capabilities:\n` +
          `- **Trust Collapse Engine:** Real-time falsification engine that revokes approval if boundary counterexamples are found.\n` +
          `- **Repair Shadow Mode:** Ephemeral sandbox cloning protecting the host from arbitrary execution.\n` +
          `- **6 Autonomous Agents:** Continuous pipeline from investigation to adversarial hunting and release gates.\n` +
          `- **Cryptographic Patch Sealing:** SHA-256 patch hashes bound to empirical test reports.\n\n` +
          `*Tip: Select any verification run in the workspace to inspect live execution traces and counterexamples!*`,
        citedEvidence,
        operatingMode,
        confidence: 0.95
      };
    }

    // ==============================================================
    // B. RUN-SPECIFIC GROUNDED REASONING (When run is active)
    // ==============================================================
    // Trust Collapse & Failures
    if (qLower.includes('fail') || qLower.includes('collapse') || qLower.includes('why')) {
      if (run.trustCollapsed || run.counterexamples.length > 0) {
        const cx = run.counterexamples[0];
        if (cx) {
          citedEvidence.push({
            type: 'COUNTEREXAMPLE',
            reference: cx.testName,
            detail: `Input: ${cx.inputVector} -> Actual: ${cx.actualOutput}`
          });
        }
        return {
          answer: `**Trust Collapse Triggered on Attempt #${cx?.attemptNumber ?? 1}:**\n\n` +
            `The initial patch proposed by Agent 2 passed the reproduction test, but was falsified by the Adversarial Counterexample Hunter.\n\n` +
            `- **Triggering Test:** \`${cx?.testName || 'Boundary check'}\`\n` +
            `- **Boundary Input:** \`${cx?.inputVector || 'calculateDiscount(100, 150)'}\`\n` +
            `- **Observed Output:** ${cx?.actualOutput || 'Discounts > 100% accepted'}\n` +
            `- **Expected Behavior:** ${cx?.expectedOutput || 'RangeError: Must be between 0 and 100'}\n\n` +
            `Because trust was falsified by an executable test in the shadow workspace, automatic approval was terminated and failure evidence was dispatched to synthesize Attempt #2.`,
          citedEvidence,
          operatingMode,
          confidence: 0.98
        };
      } else if (run.status === 'BLOCKED') {
        return {
          answer: `The verification run was blocked by policy conditions: ${run.policyResult?.blockingReasons.join('; ') || 'Unsatisfied release gate rules'}.`,
          citedEvidence: (run.policyResult?.blockingReasons || []).map((r: string) => ({
            type: 'POLICY_BLOCK',
            reference: 'DeterministicPolicy',
            detail: r
          })),
          operatingMode,
          confidence: 0.96
        };
      }
    }

    // Counterexamples
    if (qLower.includes('counterexample') || qLower.includes('which test')) {
      if (run.counterexamples.length > 0) {
        for (const cx of run.counterexamples) {
          citedEvidence.push({
            type: 'COUNTEREXAMPLE',
            reference: cx.testName,
            detail: `Command: ${cx.reproductionCommand}`
          });
        }
        const cxList = run.counterexamples
          .map((c: CounterexampleFinding) => `• **${c.testName}**: \`${c.inputVector}\` (Reproduction: \`${c.reproductionCommand}\`)`)
          .join('\n');
        return {
          answer: `The Adversarial Hunter confirmed ${run.counterexamples.length} counterexample(s) in the isolated shadow workspace:\n\n${cxList}\n\nEach check is verifiable by running the reproduction command.`,
          citedEvidence,
          operatingMode,
          confidence: 0.99
        };
      }
      return {
        answer: 'Zero active counterexamples on the latest patch attempt. All adversarial boundary checks passed.',
        citedEvidence: [],
        operatingMode,
        confidence: 0.95
      };
    }

    // Security & Circuit Breaker
    if (qLower.includes('security') || qLower.includes('circuit') || qLower.includes('vulnerability')) {
      if (run.securityFindings.length > 0) {
        const secList = run.securityFindings
          .map((s: SecurityFinding) => `• **[${s.severity}] ${s.title}** (${s.affectedFile}:${s.lineRange}) — ${s.recommendedMitigation}`)
          .join('\n');
        for (const s of run.securityFindings) {
          citedEvidence.push({ type: 'SECURITY_FINDING', reference: s.title, detail: s.evidence });
        }
        return {
          answer: `Security Guardian evaluated the patch diff:\n\n${secList}\n\nCircuit Breaker Status: **${run.circuitBreakerTripped ? 'TRIPPED (' + run.circuitBreakerReason + ')' : 'NOMINAL (Armed)'}**`,
          citedEvidence,
          operatingMode,
          confidence: 0.97
        };
      }
      return {
        answer: 'Security Guardian AST scanner validated the patch. Zero vulnerabilities or prohibited operations detected (no dynamic eval, command injection, secret leakage, or path traversals).',
        citedEvidence: [],
        operatingMode,
        confidence: 0.95
      };
    }

    // Default overview for active run
    return {
      answer: `**Verification Run \`${run.id}\` — Overview:**\n\n` +
        `- **Repository:** \`${run.repositoryName}\` (\`${run.bugReport.targetFile}\`)\n` +
        `- **Current Attempt:** #${run.currentAttempt} (${run.attempts.length} total attempt(s))\n` +
        `- **Cryptographic Patch SHA-256:** \`${run.currentPatchHash ? run.currentPatchHash.substring(0, 16) + '...' : 'Pending'}\`\n` +
        `- **Trust Collapsed:** ${run.trustCollapsed ? 'YES' : 'NO'}\n` +
        `- **Release Gate Recommendation:** **${run.recommendation || 'EVALUATING'}**\n\n` +
        `Ask me specific questions such as: "Why did trust collapse?", "Which test caught the counterexample?", or "What changed between repair attempts?"`,
      citedEvidence: [],
      operatingMode,
      confidence: 0.9
    };
  }
}
