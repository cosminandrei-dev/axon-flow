/**
 * CI Workflow Validator
 *
 * Validates that ci.yml contains all required jobs and configurations
 * matching the Story 0.7 acceptance criteria.
 *
 * Usage: npx tsx workflow-validator.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

const REQUIRED_JOBS = ["setup", "lint", "typecheck", "test", "build"];

const REQUIRED_SERVICES = {
  postgres: "postgres:18-alpine",
  redis: "redis:8-alpine",
  rabbitmq: "rabbitmq:4-management-alpine",
};

function loadWorkflow(workflowPath: string): CIWorkflow {
  if (!existsSync(workflowPath)) {
    throw new Error(`Workflow file not found: ${workflowPath}`);
  }
  const content = readFileSync(workflowPath, "utf-8");
  return parse(content) as CIWorkflow;
}

function validateTriggers(workflow: CIWorkflow): ValidationResult {
  const on = workflow.on;

  if (!on) {
    return { passed: false, message: "No triggers defined" };
  }

  const hasPush = on.push?.branches?.includes("main");
  const hasPR = on.pull_request?.branches?.includes("main");
  const hasDispatch = on.workflow_dispatch !== undefined;

  if (!hasPush) {
    return { passed: false, message: "Missing push trigger for main branch" };
  }
  if (!hasPR) {
    return {
      passed: false,
      message: "Missing pull_request trigger for main branch",
    };
  }
  if (!hasDispatch) {
    return { passed: false, message: "Missing workflow_dispatch trigger" };
  }

  return { passed: true, message: "All triggers configured correctly" };
}

function validateConcurrency(workflow: CIWorkflow): ValidationResult {
  const concurrency = workflow.concurrency;

  if (!concurrency) {
    return { passed: false, message: "No concurrency configuration" };
  }

  if (!concurrency.group) {
    return { passed: false, message: "Missing concurrency group" };
  }

  const cancelInProgress = concurrency["cancel-in-progress"];
  if (cancelInProgress === undefined) {
    return { passed: false, message: "Missing cancel-in-progress setting" };
  }

  // Check that it uses conditional for non-main branches
  const cancelValue = String(cancelInProgress);
  if (!cancelValue.includes("refs/heads/main")) {
    return {
      passed: false,
      message: "cancel-in-progress should use conditional for main branch",
      details: `Current value: ${cancelValue}`,
    };
  }

  return { passed: true, message: "Concurrency configured correctly" };
}

function validateJobs(workflow: CIWorkflow): ValidationResult {
  const jobs = workflow.jobs;

  if (!jobs) {
    return { passed: false, message: "No jobs defined" };
  }

  const missingJobs = REQUIRED_JOBS.filter((job) => !jobs[job]);
  if (missingJobs.length > 0) {
    return {
      passed: false,
      message: `Missing required jobs: ${missingJobs.join(", ")}`,
    };
  }

  return { passed: true, message: "All required jobs defined" };
}

function validateJobDependencies(workflow: CIWorkflow): ValidationResult {
  const jobs = workflow.jobs;
  if (!jobs) {
    return { passed: false, message: "No jobs defined" };
  }

  // lint and typecheck should depend on setup
  if (!jobs.lint?.needs?.includes("setup")) {
    return {
      passed: false,
      message: "lint job should depend on setup",
    };
  }
  if (!jobs.typecheck?.needs?.includes("setup")) {
    return {
      passed: false,
      message: "typecheck job should depend on setup",
    };
  }

  // test should depend on lint and typecheck
  const testNeeds = jobs.test?.needs || [];
  if (!testNeeds.includes("lint") || !testNeeds.includes("typecheck")) {
    return {
      passed: false,
      message: "test job should depend on both lint and typecheck",
    };
  }

  // build should depend on test
  if (!jobs.build?.needs?.includes("test")) {
    return {
      passed: false,
      message: "build job should depend on test",
    };
  }

  return { passed: true, message: "Job dependencies configured correctly" };
}

function validateServiceContainers(workflow: CIWorkflow): ValidationResult {
  const testJob = workflow.jobs?.test;
  if (!testJob) {
    return { passed: false, message: "test job not found" };
  }

  const services = testJob.services;
  if (!services) {
    return { passed: false, message: "No service containers in test job" };
  }

  for (const [name, expectedImage] of Object.entries(REQUIRED_SERVICES)) {
    const service = services[name];
    if (!service) {
      return {
        passed: false,
        message: `Missing service container: ${name}`,
      };
    }
    const expectedPrefix = expectedImage.split(":")[0] ?? expectedImage;
    if (!service.image || !service.image.startsWith(expectedPrefix)) {
      return {
        passed: false,
        message: `Service ${name} should use image ${expectedImage}`,
        details: `Current image: ${service.image ?? "undefined"}`,
      };
    }
  }

  return { passed: true, message: "Service containers configured correctly" };
}

function validateTurboCaching(workflow: CIWorkflow): ValidationResult {
  const env = workflow.env;

  if (!env?.TURBO_TOKEN) {
    return {
      passed: false,
      message: "TURBO_TOKEN not configured at workflow level",
    };
  }
  if (!env?.TURBO_TEAM) {
    return {
      passed: false,
      message: "TURBO_TEAM not configured at workflow level",
    };
  }

  return { passed: true, message: "Turbo caching configured correctly" };
}

function validateParallelExecution(workflow: CIWorkflow): ValidationResult {
  const jobs = workflow.jobs;
  if (!jobs) {
    return { passed: false, message: "No jobs defined" };
  }

  // lint and typecheck should both depend only on setup (parallel execution)
  const lintNeeds = jobs.lint?.needs || [];
  const typecheckNeeds = jobs.typecheck?.needs || [];

  const lintOnlySetup =
    lintNeeds.length === 1 && lintNeeds.includes("setup");
  const typecheckOnlySetup =
    typecheckNeeds.length === 1 && typecheckNeeds.includes("setup");

  if (!lintOnlySetup || !typecheckOnlySetup) {
    return {
      passed: false,
      message: "lint and typecheck should depend only on setup for parallel execution",
      details: `lint needs: [${lintNeeds.join(", ")}], typecheck needs: [${typecheckNeeds.join(", ")}]`,
    };
  }

  return { passed: true, message: "Parallel execution configured correctly" };
}

function main(): void {
  const projectRoot = resolve(__dirname, "../../..");
  const workflowPath = resolve(projectRoot, ".github/workflows/ci.yml");

  console.log("CI Workflow Validator");
  console.log("=====================\n");
  console.log(`Validating: ${workflowPath}\n`);

  let workflow: CIWorkflow;
  try {
    workflow = loadWorkflow(workflowPath);
  } catch (error) {
    console.error(`Failed to load workflow: ${error}`);
    process.exit(1);
  }

  const validations = [
    { name: "Triggers (AC 0.7.1)", fn: () => validateTriggers(workflow) },
    { name: "Concurrency (AC 0.7.1)", fn: () => validateConcurrency(workflow) },
    { name: "Required Jobs", fn: () => validateJobs(workflow) },
    { name: "Job Dependencies", fn: () => validateJobDependencies(workflow) },
    { name: "Service Containers (AC 0.7.4)", fn: () => validateServiceContainers(workflow) },
    { name: "Turbo Caching (AC 0.7.6)", fn: () => validateTurboCaching(workflow) },
    { name: "Parallel Execution (AC 0.7.6)", fn: () => validateParallelExecution(workflow) },
  ];

  let allPassed = true;

  for (const validation of validations) {
    const result = validation.fn();
    const status = result.passed ? "✅" : "❌";
    console.log(`${status} ${validation.name}: ${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (!result.passed) {
      allPassed = false;
    }
  }

  console.log("\n=====================");
  if (allPassed) {
    console.log("All validations passed!");
    process.exit(0);
  } else {
    console.log("Some validations failed.");
    process.exit(1);
  }
}

main();
