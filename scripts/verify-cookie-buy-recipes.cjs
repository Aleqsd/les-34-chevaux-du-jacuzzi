// Pure model + actual Zod schema verification. No HTTP, SQL or checkout writes.
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { createRequire } = require("node:module");
const assert = require("node:assert/strict");
const site = path.resolve(process.argv[2] || process.cwd());
const req = createRequire(path.join(site, "package.json")), ts = req("typescript"), cache = new Map();
function load(file, suffix = "") {
  const key = file + suffix; if (cache.has(key)) return cache.get(key);
  const exports = {};
  const source = fs.readFileSync(path.join(site, file), "utf8") + suffix;
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports, console, require(id) {
    if (id === "@/lib/database") return { database() { throw Error("Database forbidden"); } };
    if (id === "@/lib/wonder-data") return { readWonder() { throw Error("Database forbidden"); } };
    return id.startsWith("@/") ? load(id.slice(2) + ".ts") : req(id);
  } }); cache.set(key, exports); return exports;
}
const g = load("lib/cookie-game.ts");
const schema = load("app/api/cookie/route.ts", "\nexport const __bulkSchema = action;\n").__bulkSchema;
const json = value => JSON.stringify(value), copy = value => JSON.parse(json(value));
const ids = plan => Array.from(plan.recipes, u => u.id);
const near = (a, b) => assert(Math.abs(a - b) <= Math.max(1e-8, Math.abs(b) * 1e-12), `${a} != ${b}`);
const fresh = fields => Object.assign(g.freshCookiePlayer(1000), { nextEventAt: 1e10, nextEventId: "comet" }, fields);
const spoon = balance => { const p = fresh({ balance }); p.buildings[0] = 50; return p; };
const spendBook = kind => ({ cycle: 1, nextAcceptAt: 999999, completed: 0, byKind: {}, bySchool: {},
  active: { id: 1, kind, acceptedAt: 900, referenceRate: 1000, target: 600000, reward: 60000, progress: 0 } });
const passed = [], failures = [];
function check(name, fn) { try { fn(); passed.push(name); } catch (e) { failures.push({ name, error: e.message }); } }

check("preview is pure and does not reorder the recipe catalog", () => {
  const p = spoon(22050), before = json(p), order = g.UPGRADES.map(u => u.id).join(",");
  Object.freeze(p.upgrades); Object.freeze(p.buildings); Object.freeze(p);
  g.recipePurchasePlan(p); assert.equal(json(p), before); assert.equal(g.UPGRADES.map(u => u.id).join(","), order);
});
check("50 spoons and exact 22050 budget purchase the entire dependency chain", () => {
  const p = spoon(22050), plan = g.recipePurchasePlan(p);
  assert.deepEqual(ids(plan), ["spoon_double", "spoon_master", "spoon_signature"]); assert.equal(plan.cost, 22050);
  const result = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: plan.cost }, 1000);
  assert.equal(result.purchasedRecipes, 3); assert.equal(result.recipeCost, 22050); assert.equal(p.balance, 0);
  assert.equal(g.baseProduction(p), 40); assert.equal(p.lifetime, 0); assert.equal(p.runEarned, 0);
});
check("a partial budget stops before the next dependency", () => {
  const p = spoon(4049), result = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 4049 }, 1000);
  assert.deepEqual(Array.from(p.upgrades), ["spoon_double"]); assert.equal(p.balance, 3749);
  assert.equal(result.purchasedRecipes, 1); assert.equal(result.recipeCost, 300);
});
check("cheapest-first wins over catalog order", () => {
  const p = fresh({ balance: 300, clicks: 25 }); p.buildings[0] = 10;
  const result = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 300 }, 1000);
  assert.deepEqual(Array.from(p.upgrades), ["thumb"]); assert.equal(result.recipeCost, 50); assert.equal(p.balance, 250);
});
check("click recipes unlocked by the batch are included", () => {
  const budget = 1e6 + 1e9 + 1e12 + 1e15;
  const p = fresh({ balance: budget, clicks: 100000, upgrades: ["thumb", "hooves"] });
  assert.deepEqual(ids(g.recipePurchasePlan(p)), ["whisk", "mixer", "thunder", "starlight"]);
  const r = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: budget }, 1000);
  assert.equal(r.purchasedRecipes, 4); assert.equal(r.recipeCost, budget); assert.equal(p.balance, 0);
});
check("the client maxCost remains a hard limit despite extra server balance", () => {
  const p = fresh({ balance: 1e9, clicks: 100000 });
  const r = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 50 }, 1000);
  assert.deepEqual(Array.from(p.upgrades), ["thumb"]); assert.equal(r.recipeCost, 50); assert.equal(p.balance, 1e9 - 50);
});
check("server rechecks a balance spent by another action", () => {
  const p = spoon(4049); // UI originally saw the 22050 full-chain plan.
  const r = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 22050 }, 1000);
  assert.equal(r.purchasedRecipes, 1); assert.equal(r.recipeCost, 300); assert.equal(p.balance, 3749);
});
check("no eligible recipe is a friendly rejection with no recipe debit", () => {
  const p = fresh({ balance: 1e6, upgrades: g.UPGRADES.map(u => u.id) }); g.award(p);
  const before = json(p), plan = g.recipePurchasePlan(p); assert.equal(plan.recipes.length, 0); assert.equal(plan.cost, 0);
  assert.throws(() => g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 100 }, 1000), /Aucune recette/);
  assert.equal(json(p), before);
});
check("bad preview budgets produce an empty plan", () => {
  for (const budget of [0, -1, NaN, Infinity, -Infinity]) assert.equal(g.recipePurchasePlan(spoon(22050), budget).recipes.length, 0);
});
check("real action schema requires a finite positive bounded maxCost", () => {
  for (const maxCost of [1, 50, 22050, 1e120, g.COOKIE_CAP]) assert(schema.safeParse({ kind: "buyRecipes", run: 0, maxCost }).success);
  for (const maxCost of [undefined, 0, -1, NaN, Infinity, g.COOKIE_CAP*10, "50"]) assert(!schema.safeParse({ kind: "buyRecipes", run: 0, maxCost }).success);
});

function onlyMissing(id, overrides = {}) {
  return fresh({ balance: 1e100, lifetime: 1e100, clicks: 1000000,
    upgrades: g.UPGRADES.filter(u => u.id !== id).map(u => u.id), ...overrides });
}
check("building, click, historical and synergy prerequisites are rechecked", () => {
  const cases = [
    ["thumb", p => p.clicks = 24, p => p.clicks = 25],
    ["spoon_double", p => p.buildings[0] = 9, p => p.buildings[0] = 10],
    ["rhythm", p => p.lifetime = 999, p => p.lifetime = 1000],
    ["dimension_double", p => { p.buildings[10] = 10; p.lifetime = 1e14 - 1; }, p => p.lifetime = 1e14],
    ["link_spoon_dimension", p => { p.buildings[0] = 49; p.buildings[10] = 5; }, p => p.buildings[0] = 50],
    ["link_spoon_dimension", p => { p.buildings[0] = 50; p.buildings[10] = 4; }, p => p.buildings[10] = 5],
  ];
  for (const [id, lock, unlock] of cases) {
    const p = onlyMissing(id); lock(p); assert.equal(g.recipePurchasePlan(p).recipes.length, 0, id + " incorrectly unlocked");
    unlock(p); assert.deepEqual(ids(g.recipePurchasePlan(p)), [id]);
  }
});
check("investment contract receives nominal cost, capped at its target", () => {
  const p = spoon(22050); p.contracts = spendBook("spend"); p.contracts.active.target = 20000;
  g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 22050 }, 1000);
  assert.equal(p.contracts.active.progress, 20000); assert.equal(p.lifetime, 0); assert.equal(p.runEarned, 0);
});
check("passive time is settled once before purchasing stronger production", () => {
  for (const kind of ["produce", "spend"]) {
    const p = spoon(22000); p.contracts = spendBook(kind);
    p.wonder = { completed: [], active: { stage: 0, target: 10000, referenceRate: 100, progress: 0 } };
    const r = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 22050 }, 11000);
    assert.equal(r.offline, 50); assert.equal(r.recipeCost, 22050); assert.equal(p.balance, 0);
    assert.equal(p.lifetime, 50); assert.equal(p.runEarned, 50); assert.equal(p.wonder.active.progress, 50);
    assert.equal(p.contracts.active.progress, kind === "produce" ? 50 : 22050);
  }
});
check("building discounts neither discount recipes nor consume the merchant offer", () => {
  const p = spoon(22050); p.specialization = "architect";
  p.mastery = { revision: 1, nextChangeAt: 0, ranks: { plans: 3 } };
  p.eventBuffs = { manualMultiplier: 3, discountUntil: 90000 };
  const r = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 22050 }, 1000);
  assert.equal(r.recipeCost, 22050); assert.equal(p.eventBuffs.discountUntil, 90000);
});
check("huge balances still report and credit the nominal small purchase cost", () => {
  const p = onlyMissing("thumb", { balance: 1e90 }); p.contracts = spendBook("spend");
  const r = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: 50 }, 1000);
  assert.equal(r.recipeCost, 50); assert.equal(p.contracts.active.progress, 50); assert.equal(r.purchasedRecipes, 1);
});
check("bulk purchase matches individual purchases at the same server time", () => {
  const bulk = spoon(22050), singles = copy(bulk), plan = g.recipePurchasePlan(bulk);
  g.applyCookieAction(bulk, { kind: "buyRecipes", run: 0, maxCost: plan.cost }, 1000);
  for (const u of plan.recipes) g.applyCookieAction(singles, { kind: "upgrade", upgrade: u.id }, 1000);
  assert.equal(json(bulk), json(singles));
});
check("all endgame recipes terminate, stay unique and award the final collection", () => {
  const p = fresh({ balance: g.COOKIE_CAP, lifetime: g.COOKIE_CAP, clicks: 1000000 }); p.buildings.fill(1000);
  const plan = g.recipePurchasePlan(p), originalOrder = g.UPGRADES.map(u => u.id);
  assert.equal(plan.recipes.length, g.UPGRADES.length); assert(Number.isFinite(plan.cost) && plan.cost <= p.balance);
  for (let i = 1; i < plan.recipes.length; i++) {
    assert(plan.recipes[i].price >= plan.recipes[i - 1].price);
    if (plan.recipes[i].price === plan.recipes[i - 1].price) assert(originalOrder.indexOf(plan.recipes[i].id) > originalOrder.indexOf(plan.recipes[i - 1].id));
  }
  const r = g.applyCookieAction(p, { kind: "buyRecipes", run: 0, maxCost: plan.cost }, 1000);
  assert.equal(r.purchasedRecipes, g.UPGRADES.length); assert.equal(new Set(p.upgrades).size, g.UPGRADES.length);
  assert.equal(p.maxRecipes, g.UPGRADES.length); near(r.recipeCost, plan.cost);
  for (const a of g.COOKIE_ACHIEVEMENTS.filter(a => a.metric === "recipes" && a.target <= g.UPGRADES.length)) assert(p.achievements.includes(a.id));
});

check("a queued purchase cannot spend a new prestige run", () => {
  const p = spoon(1e9); p.clicks=1000; p.lifetime=1e9; p.runEarned=1e9;
  const action = {kind:"buyRecipes",run:p.resets,maxCost:g.recipePurchasePlan(p).cost};
  g.applyCookieAction(p,{kind:"prestige"},1000);
  const balance=p.balance, upgrades=json(p.upgrades);
  assert.throws(()=>g.applyCookieAction(p,action,1000),/ancienne fournée/);
  assert.equal(p.balance,balance); assert.equal(json(p.upgrades),upgrades);
  for(const run of [undefined,-1,0.5,NaN,Infinity]) assert(!schema.safeParse({...action,run}).success);
});

console.log(JSON.stringify({ passed: passed.length, failed: failures.length, checks: passed, failures,
  databaseOrHTTPUsed: false, remainingApiCases: [
    "same UUID retry preserves count/cost and never debits twice",
    "two concurrent bulk purchases never duplicate recipe ownership or overspend",
    "concurrent single upgrade plus bulk recomputes against the latest save",
  ] }, null, 2));
if (failures.length) process.exitCode = 1;
