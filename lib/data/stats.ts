"use cache";

import { cacheLife, cacheTag } from "next/cache";
import { goClient } from "@/lib/go-client";

export type NumericAggregate = {
  type: "scale_1_10" | "number";
  bucket_min: number;
  histogram: number[];
  mean: number;
  median: number;
  count: number;
};

export type ChoiceAggregate = {
  type: "single_choice" | "multi_choice";
  choices: Record<string, number>;
  order: string[];
};

export type TextAggregate = {
  type: "short_text" | "long_text";
  values: Array<{ value: string; count: number }>;
  count: number;
};

export type Aggregate = NumericAggregate | ChoiceAggregate | TextAggregate;

export type StatsAggregates = {
  total_submissions: number;
  aggregates: Record<string, Aggregate>;
};

// getStatsAggregates wraps the Go /stats/aggregates endpoint behind the
// Cache Components cache. The Go API owns the de-anonymization floor.
export async function getStatsAggregates(): Promise<StatsAggregates> {
  cacheLife("hours");
  cacheTag("stats");
  return goClient.get<StatsAggregates>("/stats/aggregates");
}
