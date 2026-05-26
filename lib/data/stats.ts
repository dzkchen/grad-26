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

export type Aggregate = NumericAggregate | ChoiceAggregate;

export type StatsAggregates = {
  total_submissions: number;
  aggregates: Record<string, Aggregate>;
};

// getStatsAggregates wraps the Go /stats/aggregates endpoint behind the
// Cache Components cache. The `min` argument is the de-anonymization floor;
// production callers must use the default (5). The /dev/stats preview page
// passes min=1 so charts render off a single test submission.
export async function getStatsAggregates(min?: number): Promise<StatsAggregates> {
  cacheLife("hours");
  cacheTag("stats");
  return goClient.get<StatsAggregates>("/stats/aggregates", { min });
}
