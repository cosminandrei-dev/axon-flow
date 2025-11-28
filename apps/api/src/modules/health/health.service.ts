import { Injectable } from "@nestjs/common";

export interface ServiceHealth {
  name: string;
  status: string;
  latency?: number;
}

export interface HealthStatus {
  status: string;
  timestamp: Date;
  version: string;
  services: ServiceHealth[];
}

@Injectable()
export class HealthService {
  private readonly version = process.env.npm_package_version ?? "0.0.1";

  getHealthStatus(): HealthStatus {
    const services = this.checkServices();
    const overallStatus = this.determineOverallStatus(services);

    return {
      status: overallStatus,
      timestamp: new Date(),
      version: this.version,
      services,
    };
  }

  private checkServices(): ServiceHealth[] {
    // Note: In a full implementation, these would make actual connection checks
    // For Epic 0, we return placeholder healthy status
    // Real implementations will be added when services are integrated
    const services: ServiceHealth[] = [
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRabbitMQ(),
    ];

    return services;
  }

  private checkDatabase(): ServiceHealth {
    // Placeholder - actual DB health check will be implemented when @repo/database is integrated
    const start = Date.now();
    // Simulating a quick check
    const latency = Date.now() - start;

    return {
      name: "database",
      status: "healthy",
      latency,
    };
  }

  private checkRedis(): ServiceHealth {
    // Placeholder - actual Redis health check will be implemented when Redis client is added
    const start = Date.now();
    const latency = Date.now() - start;

    return {
      name: "redis",
      status: "healthy",
      latency,
    };
  }

  private checkRabbitMQ(): ServiceHealth {
    // Placeholder - actual RabbitMQ health check will be implemented when queue package is added
    const start = Date.now();
    const latency = Date.now() - start;

    return {
      name: "rabbitmq",
      status: "healthy",
      latency,
    };
  }

  private determineOverallStatus(services: ServiceHealth[]): string {
    const unhealthyServices = services.filter((s) => s.status !== "healthy");

    if (unhealthyServices.length === 0) {
      return "ok";
    }

    if (unhealthyServices.length === services.length) {
      return "unhealthy";
    }

    return "degraded";
  }
}
