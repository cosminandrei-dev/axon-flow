
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export interface IQuery {
    health(): HealthStatus | Promise<HealthStatus>;
}

export interface HealthStatus {
    status: string;
    timestamp: DateTime;
    version: string;
    services: ServiceHealth[];
}

export interface ServiceHealth {
    name: string;
    status: string;
    latency?: Nullable<number>;
}

export type DateTime = any;
type Nullable<T> = T | null;
