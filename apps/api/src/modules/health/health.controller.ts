import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { getMetrics, getMetricsContentType } from "@repo/observability";

import { HealthService } from "./health.service";

interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("health")
  check(): HealthResponse {
    const healthStatus = this.healthService.getHealthStatus();
    return {
      status: healthStatus.status,
      timestamp: healthStatus.timestamp.toISOString(),
      version: healthStatus.version,
    };
  }

  @Get("metrics")
  async getMetricsEndpoint(@Res() res: Response): Promise<void> {
    res.set("Content-Type", getMetricsContentType());
    res.send(await getMetrics());
  }
}
