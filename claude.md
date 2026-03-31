# CLAUDE.md
Lead Engine — Claude Code Project Context

This file defines the architecture, rules, conventions, and security policies
for the Lead Engine SaaS platform.

Claude Code must follow these instructions when analyzing, modifying,
or generating code in this repository.

This file acts as the persistent context for AI development.

---

# 1. Project Overview

Lead Engine is a SaaS platform designed to automatically generate,
enrich, and nurture qualified B2B leads.

The system performs three main operations:

1. Lead Generation (Scraping)
2. Lead Enrichment
3. Lead Nurturing Automation

The goal is that users only see **sales-ready leads**
instead of raw unqualified contacts.

Automation handles early outreach, but **a human always takes over when a lead replies**.

This is a **Human-in-the-Loop (HITL)** system.

---

# 2. Core Product Concepts

## Lead Generation (Scraping)

Leads are discovered based on an ICP (Ideal Customer Profile).

Extraction is primarily performed via LinkedIn using Apify-based pipelines.

Scraping must be:

• rate limited  
• randomized  
• paced over time  

to avoid platform bans.

---

## Lead Enrichment

Each lead profile contains:

• personal data  
• company data  
• AI-generated ICP match explanation  
• company context
• potential outreach angles

This enrichment is used by the AI outreach system.

---

## Lead Nurturing

The system runs automated outreach sequences.

Supported channels:

• LinkedIn
• Email

Messages are:

• AI-generated
• personalized
• contextualized using company knowledge (RAG)

The system **must never behave as a chatbot**.

Automation stops immediately when the lead replies.

---

# 3. Technology Stack

Frontend
Next.js 16 (App Router)
React 19
TypeScript (strict mode)

Styling
Tailwind CSS v4
Lucide React icons
Inter font

Backend
Supabase
PostgreSQL
Supabase Auth

Scripting / Pipelines
Python 3.12
Async pipelines
Apify LinkedIn extraction

AI Integration
Google Gemini (message generation)

Vector DB (RAG)
TBD

• Supabase pgvector
• Pinecone
• Weaviate

Internationalization
English
Spanish
German

---

# 4. Architecture Overview

The system has three main layers.

Frontend
Next.js App Router dashboard.

Backend
Supabase database, auth, and server functions.

Data Pipelines
Python scraping and enrichment services.

Architecture principle:

Frontend must **never access privileged data directly**.

Sensitive logic must live in:

• server actions
• API routes
• Supabase policies
• backend pipelines

---

# 5. Directory Layout


src/
app/ # Next.js routes
components/ # UI components
lib/ # utilities, clients
hooks/ # custom hooks
types/ # TypeScript types
styles/ # Tailwind globals

scripts/
lead_scraper.py
config.py
db.py

supabase/
migrations/
functions/
seed.sql

tests/
unit/
integration/
e2e/


.env.local must never be committed.

Secrets must never appear in source code.

---

# 6. AI Agent Behavior Rules

Claude Code must follow these principles.

## 1 Never break existing behavior

Unless explicitly instructed.

## 2 Minimal changes

Prefer small reversible edits.

## 3 Inspect → Plan → Implement → Verify

Claude must analyze the codebase before editing.

## 4 Never change UI theme

The SaaS UI design is finalized.

Only modify visuals if requested.

## 5 Always consider security

Especially around:

• authentication
• secrets
• database access
• pipelines

## 6 Write maintainable code

Avoid unnecessary abstractions.

Favor clarity over cleverness.

---

# 7 Next.js Development Rules

Default to **Server Components**.

Only add `"use client"` when needed for:

• React hooks
• browser APIs
• event handlers

Server Components may:

• fetch database data
• access secrets
• call APIs

Client Components should be UI-only when possible.

---

# 8 Tailwind CSS Rules

Tailwind v4 uses **CSS-based configuration**.

Theme tokens must be defined in:


src/styles/globals.css


Do NOT create tailwind.config.js customizations.

Use design tokens:

• color-brand-primary
• color-brand-accent
• shadow-card
• radius-card

---

# 9 Supabase Rules

All database tables must enable:

Row Level Security (RLS)

All queries must respect tenant isolation.

Users may only access data belonging to their organization.

Example pattern:


organisation_id = (
SELECT organisation_id
FROM profiles
WHERE id = auth.uid()
)


Database access must go through:


src/lib/supabase


Never expose the service role key to the client.

---

# 10 Python Pipeline Rules

Python scripts run background data operations.

Examples:

• scraping
• enrichment
• batch processing

Requirements:

Python 3.12+
Async architecture
httpx for networking

Do NOT use synchronous requests.

Always include:

• rate limiting
• retries
• structured logging

Scraping must include jitter delays between requests.

---

# 11 Human in the Loop (HITL)

Critical system requirement.

Before outreach sequences begin:

AI generates messages.

The user must:

• review
• edit
• approve

before sending.

Automation must stop immediately if:

• a lead replies
• a human intervenes

---

# 12 AI Security Requirements

Follow OWASP AI security guidance.

## Prompt Injection

User input must never directly control system prompts.

Mitigation:

• sanitize inputs
• detect malicious instructions
• keep system prompts immutable

---

## Data Poisoning

Training or RAG data may be manipulated.

Mitigation:

• signed datasets
• hash verification
• drift monitoring

---

## Broken Access Control

Never trust client identifiers.

Always verify authorization server-side.

Use:

• RBAC
• Supabase RLS
• scoped tokens

---

## Cryptographic Failures

All sensitive data must be encrypted.

Requirements:

TLS 1.3+
AES-256 at rest

Never log secrets.

Use managed key systems when possible.

---

## Insecure Authentication

Security requirements:

• MFA enabled
• session expiration
• rate limiting
• login attempt protection

Sessions must use:

HttpOnly cookies  
SameSite protection

---

# 13 API Security Rules

Never expose:

• API keys
• service tokens
• internal endpoints

API calls must occur from:

• server actions
• backend routes
• edge functions

Secrets must live in:


.env.local


and be excluded via `.gitignore`.

---

# 14 Input Validation

All server actions must validate inputs.

Use:

Zod (TypeScript)

Example rule:

Never trust client form data.

Always validate before database operations.

---

# 15 Rate Limiting

All external integrations must implement rate limiting.

This includes:

• LinkedIn scraping
• AI APIs
• enrichment services

Implement:

• exponential backoff
• retry limits
• jitter delays

---

# 16 AI Agent Tasks (Recommended)

Claude Code is best used for:

Architecture analysis

Code refactoring

Test generation

Security audits

Documentation

PR review

Avoid asking the agent to redesign the entire system at once.

Use small scoped tasks.

---

# 17 Testing Strategy

Testing pyramid:

Unit tests
Vitest

Component tests
React Testing Library

Integration tests
Vitest

E2E tests
Playwright

Python tests
pytest

---

# 18 CI/CD

CI pipelines run:

lint
typecheck
tests
build

Deployment:

Frontend
Vercel

Python pipelines
Railway / scheduled jobs

Database migrations
Supabase CLI

---

# 19 Monitoring

Recommended observability stack:

Frontend errors
Sentry

Performance
Vercel Analytics

Logs
Pino structured logging

Pipeline logs
Python structlog

Database metrics
Supabase dashboard

---

# 20 Claude Code Workflow

Recommended workflow:

1 Analyze repository
2 Propose implementation plan
3 Implement small change
4 Run lint/tests
5 Perform security review
6 Commit

Never modify large sections of code without confirming the plan.

---

# 21 Code Quality

Requirements:

TypeScript strict mode

No `any` types

Prefer `type` over `interface`

Use path aliases:


@/*


Avoid long relative imports.

---

# 22 Multi-Language UI

The system must support:

English
Spanish
German

Avoid hardcoded text when possible.

Prepare components for i18n.

---

# 23 Key Principle

Lead Engine is a **sales acceleration platform**, not a spam automation tool.

AI must always produce:

• personalized outreach
• relevant messaging
• contextual company knowledge

Generic template spam is forbidden.

---

# 24 Claude Behavior Summary

Claude Code must:

• preserve system architecture
• prioritize security
• produce maintainable code
• respect RLS
• avoid unnecessary complexity
• follow Next.js App Router conventions
• never expose secrets
• implement features incrementally