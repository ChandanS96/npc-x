# RAZE Platform — HackToBerFest-VVCE (Team t2c2-npc-x)
## The Self-Healing, Self-Protecting Autonomous Engineering Ecosystem

> **Project Status:** Repo Access Confirmed & Integrated  
> **Tagline:** AI that doesn't just write code—it proves whether the code is safe to ship.  
> **Product Philosophy:** Every fix must face a challenge. Every security claim must have evidence. Every unresolved risk must remain visible. Never claim arbitrary software is "100% Safe".

---

## 1. System Architecture & Design Philosophy

Traditional AI coding assistants stop at generating a syntactically plausible snippet. They cannot answer whether the patch actually works in a clean snapshot, whether it breaks edge cases, whether adversarial inputs cause silent data corruption, or whether tests are sensitive enough to catch regressions.

**RAZE** is a full-stack, empirical engineering platform designed to investigate defects, synthesize bounded test-driven repairs, independently challenge its own patches with executable counterexamples, execute mutation tests to measure test strength, enforce deterministic release policies, and preserve historical failures in persistent verification memory.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   RAZE VERIFICATION                    │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
    ┌───────────────────────────┐                               ┌───────────────────────────┐
    │  STAGE 1: BASELINE AUDIT  │                               │ REPAIR SHADOW WORKSPACE   │
    │  • Reproduce defect #104  │                               │ • Ephemeral clone of repo │
    │  • Record exit code & logs│                               │ • Isolated from host disk │
    └────────────┬──────────────┘                               │ • Patch applied & hashed  │
                 │                                              └─────────────┬─────────────┘
                 ▼                                                            │
    ┌───────────────────────────┐                                             │
    │  STAGE 2: MINIMAL REPAIR  │─────────────────────────────────────────────┘
    │  • Agent 2 proposes patch │
    │  • SHA-256 Hash calculated│
    └────────────┬──────────────┘
                 │
                 ▼
    ┌───────────────────────────┐
    │ STAGE 3: ADVERSARIAL HUNT │◀── Agent 3 hunts edge cases & boundary inputs (150%, NaN, -50)
    └────────────┬──────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [Failure Found]   [All Passed]
        │                 │
        ▼                 ▼
┌───────────────────┐ ┌──────────────────────────────────┐
│ STAGE 5: COLLAPSE │ │ STAGE 5.5: MUTATION TEST TRUST   │
│ UNSUPPORTED TRUST │ │ • Agent 5 synthesizes AST mutants│
│ • Approval BLOCKED│ │ • Tests mutants (Killed vs Surv) │
│ • Failure evidence│ │ • Mutation score calculated      │
│   fed to Attempt 2│ └────────────────┬─────────────────┘
└────────┬──────────┘                  │
         │                             ▼
         ▼                    ┌──────────────────────────────────┐
┌───────────────────┐         │ STAGE 6: DETERMINISTIC GATE      │
│ STAGE 6: REPAIR   │         │ • Strict policy rule matrix      │
│ CHALLENGE AGAIN   │         │ • Blocks if tests/security fail  │
│ (Attempt #2 fix)  │         │ • Verifies exact SHA-256 hash    │
└───────────────────┘         └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │ STAGE 7: HUMAN INTEGRATION SIGN  │
                              │ • "Ready for Human Review"       │
                              │ • Sealed in Verification Memory  │
                              └──────────────────────────────────┘
```

---

## 2. Six Specialized Autonomous Agents

RAZE avoids monolithic or conversational personas. Each agent executes a deterministic role and returns structured artifacts:

| Agent | Specialized Role | Execution Output |
| :--- | :--- | :--- |
| **Agent 1: Repository Investigator** | Inspects target source and reproduces baseline failure. | Root-cause hypotheses, affected symbols, reproduction commands, historical precedents. |
| **Agent 2: Autonomous Repair Engineer** | Synthesizes bounded, minimal patches without unrelated refactoring. | Unified Git patch, changed files list, SHA-256 patch hash, expected behavior, known risks. |
| **Agent 3: Adversarial Counterexample Hunter** | Challenges fixes independently with malformed, negative, and extreme inputs. | Executable counterexample finding, reproduction command, input vector, expected vs actual behavior. |
| **Agent 4: Security Guardian & Circuit Breaker** | Evaluates diff for path traversal, dynamic eval, prototype pollution, exposed secrets. | Severity findings, file line range, remediation guide, circuit breaker trip signal. |
| **Agent 5: Test Integrity Engineer** | Evaluates whether verification itself is trustworthy via mutation testing. | Mutants executed, killed, survived, timed-out, mutation score %, and suggested stronger tests. |
| **Agent 6: Evidence Judge & Release Gate** | Evaluates accumulated evidence against deterministic policy rules. | Policy matrix, recommendation (`BLOCKED`, `NEEDS_REVIEW`, `READY_FOR_HUMAN_REVIEW`). |

---

## 3. Signature Features

### 1. The Trust Collapse Engine
AI claims cannot be accepted without proof. When an AI agent claims a bug is repaired, the engine creates boundary conditions (e.g., discounts exceeding 100%, negative pricing, `NaN`). If any check fails, unsupported trust is instantly collapsed. The failure evidence is bound to the attempt history and fed back to the repair workflow for bounded iteration (Attempt #2).

### 2. Repair Shadow Mode
All patches are evaluated in an isolated temporary working directory (`data/workspaces/shadow-<runId>-<attempt>`) copied cleanly from the base snapshot. The patch is applied, its SHA-256 hash verified, tests run, and temporary workspaces torn down when done.

### 3. Mutation-Based Test Trust
A green test suite is not proof of safety if tests are insensitive. RAZE integrates an AST-based mutation runner that systematically mutates comparison operators (`<` to `<=`), arithmetic operators (`-` to `+`), and return values. Mutants caught by tests are marked **Killed**; mutants passing tests are marked **Survived**, highlighting test suite gaps and suggesting stronger regression tests.

### 4. Security Circuit Breaker
If a patch attempts to modify sensitive system files (`.env`, `id_rsa`, `/etc/*`), introduces dynamic execution (`eval()`, `new Function()`), or experiences an execution timeout (>15s), the Circuit Breaker trips immediately, halting execution safely and preserving diagnostic evidence.

### 5. Persistent Verification Memory
Repository-specific historical failures, confirmed counterexamples, and successful regression tests are persisted in SQLite. When a new run starts, historical precedents are queried and injected into the investigation and repair stages.

---

## 4. Deterministic Approval Policy

The backend policy engine enforces clear deterministic release criteria. An LLM cannot override a failed test or fabricate safety claims:

- **`BLOCKED`**:
  - One or more unit/regression tests failed.
  - Active confirmed adversarial counterexamples exist.
  - Critical or High security findings remain unresolved.
  - Security Circuit Breaker was tripped.
  - Reviewed patch hash differs from tested patch hash.
- **`NEEDS_REVIEW`**:
  - Mutation score is below the minimum integrity threshold (70%).
  - Inconclusive execution results.
- **`READY_FOR_HUMAN_REVIEW`**:
  - All unit, regression, adversarial, and security checks passed.
  - Patch hash cryptographically verified.
  - Known limitations explicitly disclosed.
  - A human engineer must sign off using their identity and seal the exact SHA-256 patch hash.

---

## 5. Technology Stack

- **Backend:** Node.js v24, Express, TypeScript, Zod validation, `node:sqlite` (synchronous SQLite with WAL mode).
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Event Streaming:** Real-time Server-Sent Events (SSE) with durable sequence tracking and reconnection replay.
- **Bundled Demo Repositories:**
  1. `pricing-service`: Deliberate boundary failure #104 in `calculateDiscount`.
  2. `auth-guardian`: Deliberate path traversal vulnerability in `resolveTenantPath`.

---

## 6. How to Run the Platform

### Prerequisites
- Node.js (v20+ or v24+ recommended)
- npm

### 1. Install Dependencies
```bash
# In repository root
npm.cmd install

# In client directory
npm.cmd --prefix client install
```

### 2. Run Automated Quality Checks
```bash
# Run backend test suite (validates security, shadow workspace, policy engine, memory)
npm.cmd test:unit
```

### 3. Build Production Bundles
```bash
# Compiles both server and client
npm.cmd run build
```

### 4. Start Development Dev Servers
```bash
# Terminal 1: Backend API server (Port 4000)
npm.cmd run dev:server

# Terminal 2: Frontend Vite dev server (Port 5173)
npm.cmd run dev:client
```
Navigate your browser to **http://localhost:5173**.

---

## 7. Step-by-Step Live Demonstration Walkthrough

1. Open **http://localhost:5173**.
2. Click **"Launch Live Trust Collapse Demonstration"** on the hero banner.
3. Observe **Stage 1 (Repository Investigator)**:
   - Reproduces baseline defect #104: `AssertionError: Missing expected exception RangeError` when passing negative discount `-15`.
4. Observe **Stage 2 (Repair Engineer)**:
   - Synthesizes Attempt #1 patch: checks `discountPercent < 0`. Computes SHA-256 hash.
   - Applies patch in isolated **Repair Shadow Workspace**.
5. Observe **Stage 3 & 5 (Trust Collapse Engine Activation)**:
   - **Adversarial Hunter** challenges Attempt #1 with boundary vector `calculateDiscount(100, 150)`.
   - Result: Returned final price `-$50`!
   - **Unsupported Trust Collapses!** Approval is instantly BLOCKED. Failure evidence is captured and dispatched to Attempt #2.
6. Observe **Stage 6 (Repair and Challenge Again)**:
   - Attempt #2 synthesizes hardened patch with `Number.isFinite()`, non-negative price checking, and range `[0, 100]`.
   - Re-runs adversarial suite: All 7 boundary tests PASS!
7. Observe **Stage 5.5 (Mutation Testing Trust Score)**:
   - Agent 5 executes AST mutation checks in shadow workspace. Achieves 100% Mutation Trust Score.
8. Observe **Stage 7 (Deterministic Policy Evaluation)**:
   - Release Gate evaluates all rules. Verdict: **`READY_FOR_HUMAN_REVIEW`**.
9. Sign off the patch:
   - Enter your name under Human Review Controls and click **"Approve for Integration (Hash Verified)"**.
   - Notice the approval binds cryptographically to the exact SHA-256 patch hash.
10. Click **"Ask Assistant"** to query: *"Why did trust collapse?"* or *"Which test caught the counterexample?"*.
11. Download the full verification audit report as Markdown or JSON!

---

## 8. Disclosed Security & Execution Boundaries

- **Arbitrary Code Execution Limitation:** When arbitrary untrusted repositories are loaded, host execution is disabled by default. Execution is restricted to the bundled sandboxed demonstration repositories (`pricing-service` and `auth-guardian`) to prevent sandbox escape.
- **Empirical Boundary:** RAZE uses test-driven falsification, adversarial exploration, and mutation analysis. This does not constitute a formal mathematical proof of correctness for unobserved inputs.
