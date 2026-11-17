import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("browser analytics waits for anonymous server identity and stays off if it cannot load", () => {
  const url = new URL("../src/analytics.ts", import.meta.url).href;
  const result = spawnSync(
    process.execPath,
    [
      "--eval",
      `
    import assert from 'node:assert/strict';
    import { mock } from 'bun:test';
    const configs = [];
    mock.module('posthog-js', () => ({ default: {
      init: (_token, config) => configs.push(config),
      get_distinct_id: () => configs.at(-1).bootstrap.distinctID,
      get_session_id: () => 'browser-session',
    } }));
    const analytics = await import(${JSON.stringify(url)});
    globalThis.fetch = async () => { throw new Error('offline'); };
    await analytics.initializeAnalytics();
    assert.equal(analytics.analyticsEnabled, false);
    assert.deepEqual(analytics.analyticsHeaders(), {});
    globalThis.fetch = async () => Response.json({ distinctId: 'localhost' });
    await analytics.initializeAnalytics();
    assert.equal(configs.length, 0);
    let respond;
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/api/analytics/identity');
      assert.equal(options.cache, 'no-store');
      return await new Promise(resolve => { respond = resolve; });
    };
    const ready = analytics.initializeAnalytics();
    assert.equal(configs.length, 0);
    const id = '456bc254-d4cd-4f7b-b074-2f72c29ba5cc';
    respond(Response.json({ distinctId: id }));
    await ready;
    assert.equal(analytics.analyticsEnabled, true);
    assert.equal(configs.length, 1);
    assert.deepEqual(configs[0].bootstrap, { distinctID: id, isIdentifiedID: false });
    assert.equal(configs[0].persistence, 'memory');
    assert.equal(configs[0].person_profiles, 'always');
    assert.equal(analytics.analyticsHeaders()['X-POSTHOG-DISTINCT-ID'], id);
    await analytics.initializeAnalytics();
    assert.equal(configs.length, 1);
  `,
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        VITE_PUBLIC_POSTHOG_KEY: "phc_test",
        VITE_PUBLIC_POSTHOG_HOST: "https://unused.invalid",
      },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr);
});
