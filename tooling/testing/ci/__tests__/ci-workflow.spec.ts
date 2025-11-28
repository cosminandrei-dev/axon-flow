/**
 * CI Workflow Validation Tests
 *
 * These tests validate that the GitHub Actions CI workflow file
 * meets the requirements defined in Story 0.7.
 *
 * Run with: pnpm test (from tooling/testing/ci directory)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, it, expect, beforeAll } from "vitest";
import { parse } from "yaml";

interface WorkflowJob {
  name?: string;
  "runs-on"?: string;
  needs?: string[];
  services?: Record<string, ServiceConfig>;
  env?: Record<string, string>;
  steps?: WorkflowStep[];
}

interface ServiceConfig {
  image?: string;
  env?: Record<string, string>;
  ports?: string[];
  options?: string;
}

interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, string>;
  env?: Record<string, string>;
}

interface CIWorkflow {
  name?: string;
  on?: {
    push?: { branches?: string[] };
    pull_request?: { branches?: string[] };
    workflow_dispatch?: unknown;
  };
  concurrency?: {
    group?: string;
    "cancel-in-progress"?: string | boolean;
  };
  env?: Record<string, string>;
  jobs?: Record<string, WorkflowJob>;
}

const PROJECT_ROOT = resolve(__dirname, "../../../..");
const WORKFLOW_PATH = resolve(PROJECT_ROOT, ".github/workflows/ci.yml");

let workflow: CIWorkflow;

beforeAll(() => {
  if (!existsSync(WORKFLOW_PATH)) {
    throw new Error(`CI workflow not found at ${WORKFLOW_PATH}`);
  }
  const content = readFileSync(WORKFLOW_PATH, "utf-8");
  workflow = parse(content) as CIWorkflow;
});

describe("CI Workflow", () => {
  describe("AC 0.7.1 - CI Triggers", () => {
    it("should have all required jobs defined", () => {
      expect(workflow.jobs).toBeDefined();
      expect(workflow.jobs?.setup).toBeDefined();
      expect(workflow.jobs?.lint).toBeDefined();
      expect(workflow.jobs?.typecheck).toBeDefined();
      expect(workflow.jobs?.test).toBeDefined();
      expect(workflow.jobs?.build).toBeDefined();
    });

    it("should trigger on push to main branch", () => {
      expect(workflow.on?.push?.branches).toContain("main");
    });

    it("should trigger on pull request to main branch", () => {
      expect(workflow.on?.pull_request?.branches).toContain("main");
    });

    it("should have workflow_dispatch for manual trigger", () => {
      expect(workflow.on?.workflow_dispatch).toBeDefined();
    });

    it("should cancel in-progress runs for non-main branches", () => {
      expect(workflow.concurrency).toBeDefined();
      expect(workflow.concurrency?.group).toBeDefined();

      const cancelInProgress = String(workflow.concurrency?.["cancel-in-progress"] ?? "");
      // Should use conditional to not cancel main branch runs
      expect(cancelInProgress).toContain("refs/heads/main");
    });
  });

  describe("AC 0.7.2 - Lint Job", () => {
    it("should have lint job defined", () => {
      expect(workflow.jobs?.lint).toBeDefined();
    });

    it("should run on ubuntu-latest", () => {
      expect(workflow.jobs?.lint?.["runs-on"]).toBe("ubuntu-latest");
    });

    it("should depend on setup job", () => {
      expect(workflow.jobs?.lint?.needs).toContain("setup");
    });

    it("should run pnpm lint command", () => {
      const steps = workflow.jobs?.lint?.steps || [];
      const lintStep = steps.find((s) => s.run?.includes("pnpm lint"));
      expect(lintStep).toBeDefined();
    });
  });

  describe("AC 0.7.3 - Typecheck Job", () => {
    it("should have typecheck job defined", () => {
      expect(workflow.jobs?.typecheck).toBeDefined();
    });

    it("should run on ubuntu-latest", () => {
      expect(workflow.jobs?.typecheck?.["runs-on"]).toBe("ubuntu-latest");
    });

    it("should depend on setup job", () => {
      expect(workflow.jobs?.typecheck?.needs).toContain("setup");
    });

    it("should run pnpm typecheck command", () => {
      const steps = workflow.jobs?.typecheck?.steps || [];
      const typecheckStep = steps.find((s) => s.run?.includes("pnpm typecheck"));
      expect(typecheckStep).toBeDefined();
    });
  });

  describe("AC 0.7.4 - Test Job with Docker Services", () => {
    it("should have test job defined", () => {
      expect(workflow.jobs?.test).toBeDefined();
    });

    it("should have PostgreSQL 18-alpine service container", () => {
      const services = workflow.jobs?.test?.services;
      expect(services?.postgres).toBeDefined();
      expect(services?.postgres?.image).toMatch(/^postgres:18/);
    });

    it("should have Redis 8-alpine service container", () => {
      const services = workflow.jobs?.test?.services;
      expect(services?.redis).toBeDefined();
      expect(services?.redis?.image).toMatch(/^redis:8/);
    });

    it("should have RabbitMQ 4-management service container", () => {
      const services = workflow.jobs?.test?.services;
      expect(services?.rabbitmq).toBeDefined();
      expect(services?.rabbitmq?.image).toMatch(/^rabbitmq:4-management/);
    });

    it("should have health check options for PostgreSQL", () => {
      const postgres = workflow.jobs?.test?.services?.postgres;
      expect(postgres?.options).toContain("health-cmd");
    });

    it("should have health check options for Redis", () => {
      const redis = workflow.jobs?.test?.services?.redis;
      expect(redis?.options).toContain("health-cmd");
    });

    it("should have health check options for RabbitMQ", () => {
      const rabbitmq = workflow.jobs?.test?.services?.rabbitmq;
      expect(rabbitmq?.options).toContain("health-cmd");
    });

    it("should have environment variables for database connections", () => {
      const env = workflow.jobs?.test?.env;
      expect(env?.DATABASE_URL).toBeDefined();
      expect(env?.REDIS_URL).toBeDefined();
      expect(env?.RABBITMQ_URL).toBeDefined();
    });

    it("should run pnpm test command", () => {
      const steps = workflow.jobs?.test?.steps || [];
      const testStep = steps.find((s) => s.run?.includes("pnpm test"));
      expect(testStep).toBeDefined();
    });

    it("should upload coverage artifacts", () => {
      const steps = workflow.jobs?.test?.steps || [];
      const uploadStep = steps.find((s) => s.uses?.includes("actions/upload-artifact"));
      expect(uploadStep).toBeDefined();
    });
  });

  describe("AC 0.7.5 - Build Job", () => {
    it("should have build job defined", () => {
      expect(workflow.jobs?.build).toBeDefined();
    });

    it("should depend on test job", () => {
      expect(workflow.jobs?.build?.needs).toContain("test");
    });

    it("should run pnpm build command", () => {
      const steps = workflow.jobs?.build?.steps || [];
      const buildStep = steps.find((s) => s.run?.includes("pnpm build"));
      expect(buildStep).toBeDefined();
    });
  });

  describe("AC 0.7.6 - Turbo Caching and Parallelism", () => {
    it("should have Turborepo remote caching configured", () => {
      expect(workflow.env?.TURBO_TOKEN).toBeDefined();
      expect(workflow.env?.TURBO_TEAM).toBeDefined();
    });

    it("should run lint and typecheck in parallel", () => {
      // Both should depend only on setup (not on each other)
      const lintNeeds = workflow.jobs?.lint?.needs || [];
      const typecheckNeeds = workflow.jobs?.typecheck?.needs || [];

      // lint should not depend on typecheck
      expect(lintNeeds).not.toContain("typecheck");
      // typecheck should not depend on lint
      expect(typecheckNeeds).not.toContain("lint");

      // Both should depend on setup
      expect(lintNeeds).toContain("setup");
      expect(typecheckNeeds).toContain("setup");
    });

    it("should have test job wait for both lint and typecheck", () => {
      const testNeeds = workflow.jobs?.test?.needs || [];
      expect(testNeeds).toContain("lint");
      expect(testNeeds).toContain("typecheck");
    });

    it("should have correct job dependency chain", () => {
      // setup -> lint, typecheck (parallel) -> test -> build
      expect(workflow.jobs?.lint?.needs).toEqual(["setup"]);
      expect(workflow.jobs?.typecheck?.needs).toEqual(["setup"]);
      expect(workflow.jobs?.test?.needs).toEqual(
        expect.arrayContaining(["lint", "typecheck"])
      );
      expect(workflow.jobs?.build?.needs).toContain("test");
    });
  });

  describe("Node.js and pnpm Configuration", () => {
    it("should use Node.js 24", () => {
      const setupSteps = workflow.jobs?.setup?.steps || [];
      const nodeStep = setupSteps.find((s) => s.uses?.includes("actions/setup-node"));
      expect(nodeStep?.with?.["node-version"]).toBe("24");
    });

    it("should use pnpm 10", () => {
      const setupSteps = workflow.jobs?.setup?.steps || [];
      const pnpmStep = setupSteps.find((s) => s.uses?.includes("pnpm/action-setup"));
      // YAML may parse version as integer or string
      expect(String(pnpmStep?.with?.version)).toBe("10");
    });

    it("should use frozen lockfile for installs", () => {
      const allJobs = Object.values(workflow.jobs || {});
      for (const job of allJobs) {
        const installSteps = (job.steps || []).filter((s) =>
          s.run?.includes("pnpm install")
        );
        for (const step of installSteps) {
          expect(step.run).toContain("--frozen-lockfile");
        }
      }
    });
  });

  describe("GitHub Actions Best Practices", () => {
    it("should use ubuntu-latest for all jobs", () => {
      const allJobs = Object.values(workflow.jobs || {});
      for (const job of allJobs) {
        expect(job["runs-on"]).toBe("ubuntu-latest");
      }
    });

    it("should use actions/checkout@v4", () => {
      const allJobs = Object.values(workflow.jobs || {});
      for (const job of allJobs) {
        const checkoutStep = (job.steps || []).find((s) =>
          s.uses?.startsWith("actions/checkout")
        );
        if (checkoutStep) {
          expect(checkoutStep.uses).toBe("actions/checkout@v4");
        }
      }
    });

    it("should use actions/setup-node@v4", () => {
      const allJobs = Object.values(workflow.jobs || {});
      for (const job of allJobs) {
        const nodeStep = (job.steps || []).find((s) =>
          s.uses?.startsWith("actions/setup-node")
        );
        if (nodeStep) {
          expect(nodeStep.uses).toBe("actions/setup-node@v4");
        }
      }
    });

    it("should use pnpm/action-setup@v4", () => {
      const allJobs = Object.values(workflow.jobs || {});
      for (const job of allJobs) {
        const pnpmStep = (job.steps || []).find((s) =>
          s.uses?.startsWith("pnpm/action-setup")
        );
        if (pnpmStep) {
          expect(pnpmStep.uses).toBe("pnpm/action-setup@v4");
        }
      }
    });
  });
});
