import { Query, Resolver } from "@nestjs/graphql";

import { HealthService, HealthStatus } from "./health.service";

@Resolver("HealthStatus")
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query("health")
  async getHealth(): Promise<HealthStatus> {
    return this.healthService.getHealthStatus();
  }
}
