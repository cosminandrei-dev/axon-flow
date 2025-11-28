import { Controller, Get } from "@nestjs/common";

import { HealthService } from "./health.service";

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): HealthResponse {
    const healthStatus = this.healthService.getHealthStatus();
    return {
      status: healthStatus.status,
      timestamp: healthStatus.timestamp.toISOString(),
      version: healthStatus.version,
    };
  }
}
