/**
 * Read-only checks of the live checkout's model and its REAL Zod action schema.
 * No server, HTTP request, database, production fixture or checkout write.
 * Usage: node verify-cookie-tuna.cjs [absolute-site-directory]
 * Exits nonzero until the 200k / 20-per-second / 40-request patch is present.
 * API UUID receipts and SQL concurrency still need the existing local API suite.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const assert = require("node:assert/strict");
const site = path.resolve(process.argv[2] || process.cwd());
const siteRequire = createRequire(path.join(site, "package.json"));
const ts = siteRequire("typescript");
const cache = new Map();
const denyIO = () => { throw new Error("This verification must never access the database."); };

function load(relative, suffix = "") {
  const cacheKey = relative + suffix;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const filename = path.join(site, relative);
  const source = fs.readFileSync(filename, "utf8") + suffix;
  const compiled = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
  } }).outputText;
  const exports = {};
  const scope = {
    exports,
    require(name) {
      if (name === "@/lib/database") return { database: denyIO };
      if (name === "@/lib/wonder-data") return { readWonder: denyIO };
      if (name.startsWith("@/")) return load(name.slice(2) + ".ts");
      return siteRequire(name);
    },
    console,
  };
  vm.runInNewContext(compiled, scope, { filename });
  cache.set(cacheKey, exports);
  return exports;
}

const game = load("lib/cookie-game.ts");
const insights = load("lib/cookie-insights.ts");
const schema = load("app/api/cookie/route.ts", "\nexport const __tunaActionSchema = action;\n").__tunaActionSchema;
const failures = [], passed = [];
const fresh = (fields = {}) => Object.assign(game.freshCookiePlayer(1000), fields);
const json = value => JSON.stringify(value);
const near = (actual, expected) => assert(Math.abs(actual - expected) <= Math.max(1e-8, Math.abs(expected) * 1e-12), `${actual} != ${expected}`);
function check(name, test) {
  try { test(); passed.push(name); }
  catch (error) { failures.push({ name, error: error.message }); }
}

check("all legacy speed boundaries remain unchanged", () => {
  assert.equal([1999, 2000, 4999, 5000, 14999, 15000, 49999, 50000, 199999]
    .map(game.autoClickRate).join(","), "0,2,2,4,4,6,6,10,10");
});
check("tuna unlocks at exactly 200000 total clicks", () => {
  for (const clicks of [200000, 200001, 250000, 1000000]) assert.equal(game.autoClickRate(clicks), 20);
  const tuna = game.AUTO_TIERS.find(tier => tier.clicks === 200000);
  assert(tuna && tuna.rate === 20 && /thon/i.test(tuna.name));
});
check("real API schema accepts legacy and new automatic batches", () => {
  for (const count of [1, 20, 25, 26, 39, 40]) assert(schema.safeParse({ kind: "auto", count }).success, `auto ${count} rejected`);
});
check("real API schema rejects malformed or oversized automatic batches", () => {
  for (const count of [0, -1, 41, 100, 1.5, NaN, Infinity]) assert(!schema.safeParse({ kind: "auto", count }).success, `auto ${count} accepted`);
});
check("manual and trial request ceilings remain 25", () => {
  for (const kind of ["click", "trialClick"]) {
    const extra = kind === "trialClick" ? { runId: 1 } : {};
    assert(schema.safeParse({ kind, count: 25, ...extra }).success);
    assert(!schema.safeParse({ kind, count: 26, ...extra }).success);
    assert(!schema.safeParse({ kind, count: 40, ...extra }).success);
  }
});
check("one second replenishes exactly 20 automatic clicks", () => {
  const p = fresh({ clicks: 200000, autoCredit: 0 });
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 2000).acceptedClicks, 20);
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 2000).acceptedClicks, 0);
  assert.equal(p.clicks, 200020);
});
check("the two-second automatic burst is 40 and shared by requests", () => {
  const p = fresh({ clicks: 200000, autoCredit: 40 });
  const first = game.applyCookieAction(p, { kind: "auto", count: 25 }, 1000).acceptedClicks;
  const second = game.applyCookieAction(p, { kind: "auto", count: 25 }, 1000).acceptedClicks;
  assert.equal(first, 25); assert.equal(second, 15); assert.equal(p.clicks, 200040);
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 1000).acceptedClicks, 0);
});
check("frequent requests cannot exceed 20 automatic clicks per second", () => {
  const p = fresh({ clicks: 200000, autoCredit: 0 });
  let total = 0;
  for (let now = 1100; now <= 21000; now += 100) total += game.applyCookieAction(p, { kind: "auto", count: 40 }, now).acceptedClicks;
  assert(total >= 399 && total <= 400, `accepted ${total} in 20 seconds`);
});
check("a long timer stall grants only the two-second burst", () => {
  const p = fresh({ clicks: 200000, autoCredit: 0 });
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 121000).acceptedClicks, 40);
  assert.equal(p.clicks, 200040);
});
check("offline settlement never generates automatic clicks or income", () => {
  const p = fresh({ clicks: 200000 });
  game.settle(p, 1000 + 8 * 3600000);
  assert.equal(p.clicks, 200000); assert.equal(p.balance, 0); assert.equal(p.autoCredit, 40);
});
check("old speed tiers keep their smaller server-side burst", () => {
  for (const [clicks, burst] of [[2000, 4], [5000, 8], [15000, 12], [50000, 20], [199999, 20]]) {
    const p = fresh({ clicks, autoCredit: 999 });
    assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 1000).acceptedClicks, burst);
  }
});
check("automatic crossing grants speed without retroactively doubling credit", () => {
  const p = fresh({ clicks: 199999, autoCredit: 20 });
  game.applyCookieAction(p, { kind: "auto", count: 1 }, 1000);
  assert.equal(p.clicks, 200000); assert.equal(p.autoCredit, 19); assert.equal(game.autoClickRate(p.clicks), 20);
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 2000).acceptedClicks, 39);
});
check("manual crossing also unlocks the tier without adding auto credit", () => {
  const p = fresh({ clicks: 199999, autoCredit: 10 });
  game.applyCookieAction(p, { kind: "click", count: 1 }, 1000);
  assert.equal(p.clicks, 200000); assert.equal(p.autoCredit, 10);
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 1500).acceptedClicks, 20);
});
check("automatic and manual token buckets remain independent", () => {
  const p = fresh({ clicks: 200000, autoCredit: 40 });
  assert.equal(game.MANUAL_CPS, 12); assert.equal(game.MANUAL_BURST, 24);
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 1000).acceptedClicks, 40);
  assert.equal(game.applyCookieAction(p, { kind: "click", count: 25 }, 1000).acceptedClicks, 24);
  assert.equal(game.applyCookieAction(p, { kind: "click", count: 25 }, 2000).acceptedClicks, 12);
  assert.equal(game.applyCookieAction(p, { kind: "auto", count: 40 }, 2000).acceptedClicks, 20);
});
check("the tuna tier never gives automatic production inside trials", () => {
  const p = fresh({ clicks: 200000, lifetime: 1e12, autoCredit: 40 });
  game.applyCookieAction(p, { kind: "trialStart", scenario: "hands", cycle: 0 }, 1000);
  const before = p.trials.active.produced;
  game.applyCookieAction(p, { kind: "auto", count: 40 }, 1000);
  assert.equal(p.trials.active.produced, before);
  game.applyCookieAction(p, { kind: "trialClick", runId: 1, count: 25 }, 1000);
  assert.equal(p.trials.active.produced, game.MANUAL_BURST * 25);
});
check("prestige preserves total clicks and the unlocked tier", () => {
  const p = fresh({ clicks: 200123, lifetime: 1e12, runEarned: 1e12, autoCredit: 17 });
  game.applyCookieAction(p, { kind: "prestige" }, 1000);
  assert.equal(p.clicks, 200123); assert.equal(game.autoClickRate(p.clicks), 20); assert.equal(p.autoCredit, 17);
});
check("legacy JSON saves unlock tuna without resetting existing progress", () => {
  const p = fresh({ clicks: 234380, balance: 12345, lifetime: 1e18, runEarned: 100000, banked: 200000,
    upgrades: ["thumb", "hooves"], achievements: ["bake0"], missions: ["m1"], goldenClicks: 4 });
  p.buildings[0] = 31; game.award(p);
  const previous = JSON.parse(json(p));
  const restored = JSON.parse(json(p)); delete restored.autoCredit;
  game.settle(restored, 1000);
  for (const key of ["clicks", "balance", "lifetime", "runEarned", "banked", "buildings", "upgrades", "achievements", "missions", "goldenClicks"]) {
    assert.equal(json(restored[key]), json(previous[key]), `${key} changed`);
  }
  assert.equal(game.autoClickRate(restored.clicks), 20); assert.equal(restored.autoCredit, 0);
});
check("temporary bonuses multiply income, never the 20-per-second allowance", () => {
  const p = fresh({ clicks: 200000, autoCredit: 0, trialBoostUntil: 5000,
    rhythm: { cycle: 0, boostUntil: 5000 }, eventBuffs: { manualMultiplier: 3, manualUntil: 5000 } });
  const power = game.clickPower(p, 2000);
  const result = game.applyCookieAction(p, { kind: "auto", count: 40 }, 2000);
  assert.equal(result.acceptedClicks, 20); near(p.balance, power * 20);
});
check("purchase advice and new contract terms use the real 20-per-second rate", () => {
  const p = fresh({ clicks: 200000, lifetime: 1e12, upgrades: ["thumb", "hooves", "rhythm", "cadence"] });
  p.buildings[1] = 10;
  const expected = game.baseProduction(p) + 20 * game.clickPower(p, 0);
  near(insights.steadyIncome(p, true), expected);
  near(insights.steadyIncome(p, false), game.baseProduction(p));
  near(game.contractTerms(p, "produce").referenceRate, expected);
});
check("previously accepted contract targets remain frozen at a tier crossing", () => {
  const p = fresh({ clicks: 199999, autoCredit: 20, contracts: { cycle: 1, nextAcceptAt: 0,
    completed: 0, byKind: {}, bySchool: {}, active: { id: 1, kind: "produce", acceptedAt: 500,
      referenceRate: 123, target: 73800, reward: 7380, progress: 0 } } });
  game.applyCookieAction(p, { kind: "auto", count: 1 }, 1000);
  assert.equal(p.contracts.active.referenceRate, 123); assert.equal(p.contracts.active.target, 73800);
  assert.equal(p.contracts.active.reward, 7380);
});
check("existing global avatar indices remain unchanged", () => {
  assert.equal(game.COOKIE_AVATARS.slice(0, 18).map(a => a.index).join(","),
    Array.from({ length: 18 }, (_, i) => i + 60).join(","));
});

console.log(JSON.stringify({ checkout: site, passed: passed.length, failed: failures.length,
  checks: passed, failures, databaseOrNetworkAccess: false,
  remainingIntegrationChecks: ["API UUID replay of a 40-click request", "two parallel API requests share 40 credits",
    "UI ON/OFF preference and hidden-tab pause", "delayed UI timer sends a valid batch of 40"],
}, null, 2));
if (failures.length) process.exitCode = 1;
