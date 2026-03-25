import { describe, expect, test } from "bun:test";
import {
  clusterAppleSleepSamples,
  normalizeAppleHealthBloodPressureRecord,
  normalizeHealthConnectHeartRateRecord,
  stableStringify,
} from "@/services/health.sync.normalizer";

describe("health.sync.normalizer", () => {
  test("stableStringify sorts object keys recursively", () => {
    const a = {
      b: 2,
      a: {
        d: 4,
        c: 3,
      },
    };
    const b = {
      a: {
        c: 3,
        d: 4,
      },
      b: 2,
    };

    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  test("normalizeHealthConnectHeartRateRecord expands samples into stable source items", () => {
    const normalized = normalizeHealthConnectHeartRateRecord({
      kind: "heartRate",
      sourceId: "hc-heart-rate-1",
      startTime: "2026-03-20T10:00:00.000Z",
      endTime: "2026-03-20T10:05:00.000Z",
      samples: [
        { time: "2026-03-20T10:01:00.000Z", beatsPerMinute: 70 },
        { time: "2026-03-20T10:02:00.000Z", beatsPerMinute: 72 },
      ],
      metadata: null,
    });

    expect(normalized).toHaveLength(2);
    expect(normalized[0]?.source.sourceItemId).toBe(
      "hc-heart-rate-1:2026-03-20T10:01:00.000Z:0",
    );
    expect(normalized[0]?.target.bpm).toBe(70);
    expect(normalized[1]?.target.bpm).toBe(72);
  });

  test("normalizeAppleHealthBloodPressureRecord rounds values to integer mmHg", () => {
    const normalized = normalizeAppleHealthBloodPressureRecord({
      kind: "bloodPressure",
      uuid: "bp-1",
      startDate: "2026-03-20T08:00:00.000Z",
      endDate: "2026-03-20T08:00:00.000Z",
      systolicMmhg: 121.6,
      diastolicMmhg: 79.5,
    });

    expect(normalized.target.systolicMmhg).toBe(122);
    expect(normalized.target.diastolicMmhg).toBe(80);
  });

  test("clusterAppleSleepSamples groups contiguous category samples into one session", () => {
    const clusters = clusterAppleSleepSamples([
      {
        source: {
          provider: "apple-health",
          sourceType: "sleep",
          sourceItemId: "sleep-1",
          rawPayload: {},
          checksum: "1",
          sourceStartAt: "2026-03-20T22:00:00.000Z",
          sourceEndAt: "2026-03-20T23:30:00.000Z",
          sourceLastModifiedAt: null,
          usedSyntheticId: false,
        },
        record: {
          kind: "sleep",
          uuid: "sleep-1",
          startDate: "2026-03-20T22:00:00.000Z",
          endDate: "2026-03-20T23:30:00.000Z",
          value: 2,
        },
        existingTargetRowId: null,
        ownsTarget: false,
      },
      {
        source: {
          provider: "apple-health",
          sourceType: "sleep",
          sourceItemId: "sleep-2",
          rawPayload: {},
          checksum: "2",
          sourceStartAt: "2026-03-20T23:40:00.000Z",
          sourceEndAt: "2026-03-21T06:30:00.000Z",
          sourceLastModifiedAt: null,
          usedSyntheticId: false,
        },
        record: {
          kind: "sleep",
          uuid: "sleep-2",
          startDate: "2026-03-20T23:40:00.000Z",
          endDate: "2026-03-21T06:30:00.000Z",
          value: 3,
        },
        existingTargetRowId: null,
        ownsTarget: false,
      },
      {
        source: {
          provider: "apple-health",
          sourceType: "sleep",
          sourceItemId: "sleep-3",
          rawPayload: {},
          checksum: "3",
          sourceStartAt: "2026-03-21T08:00:00.000Z",
          sourceEndAt: "2026-03-21T08:20:00.000Z",
          sourceLastModifiedAt: null,
          usedSyntheticId: false,
        },
        record: {
          kind: "sleep",
          uuid: "sleep-3",
          startDate: "2026-03-21T08:00:00.000Z",
          endDate: "2026-03-21T08:20:00.000Z",
          value: 1,
        },
        existingTargetRowId: null,
        ownsTarget: false,
      },
    ]);

    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toEqual({
      sleepStart: "2026-03-20T22:00:00.000Z",
      sleepEnd: "2026-03-21T06:30:00.000Z",
      sourceItemIds: ["sleep-1", "sleep-2"],
    });
    expect(clusters[1]?.sourceItemIds).toEqual(["sleep-3"]);
  });
});
