import test from "node:test";
import assert from "node:assert/strict";
import AboutPage from "../src/models/aboutPage.model.js";
import { aboutItemSchemas, aboutSectionSchemas } from "../src/validations/aboutPage.validation.js";
import { createAboutItem, deleteAboutItem, getAdminAboutPage, getPublicAboutPage, updateAboutItem } from "../src/controllers/aboutPage.controller.js";
import { ABOUT_CONTENT_VERSION, defaultAboutPageContent } from "../src/data/aboutPage.defaults.js";

const capture = (handler, req) => new Promise((resolve, reject) => {
  const res = { status(code) { this.code = code; return this; }, json(payload) { resolve({ code: this.code, payload }); return this; } };
  handler(req, res, reject);
});

test("validates About singleton links, icons, and display values", () => {
  const valid = aboutSectionSchemas.hero.safeParse({ title: "A Legacy of Brilliance", primaryButtonLink: "/collections", imageUrl: "https://example.com/hero.webp", overlayStrength: "60", isActive: "true" });
  assert.equal(valid.success, true);
  assert.equal(valid.data.overlayStrength, 60);
  assert.equal(aboutSectionSchemas.hero.safeParse({ title: "Story", primaryButtonLink: "javascript:alert(1)" }).success, false);
  assert.equal(aboutItemSchemas.coreValues.safeParse({ title: "Integrity", description: "Transparent sourcing", icon: "Unknown", sortOrder: 0, isActive: true }).success, false);
});

test("default About content satisfies every section and item validator", () => {
  for (const section of ["hero", "missionVision", "ethicsPromise", "callToAction"]) {
    assert.equal(aboutSectionSchemas[section].safeParse(defaultAboutPageContent[section]).success, true, section);
  }
  for (const collection of ["statistics", "coreValues", "benefits"]) {
    for (const item of defaultAboutPageContent[collection]) {
      assert.equal(aboutItemSchemas[collection].safeParse(item).success, true, `${collection}: ${item.label || item.title}`);
    }
  }
});

test("admin About request creates complete suitable content when no document exists", async (t) => {
  const originalFindOne = AboutPage.findOne;
  const originalCreate = AboutPage.create;
  t.after(() => { AboutPage.findOne = originalFindOne; AboutPage.create = originalCreate; });
  AboutPage.findOne = async () => null;
  AboutPage.create = async (payload) => payload;

  const result = await capture(getAdminAboutPage, {});
  assert.equal(result.code, 200);
  assert.equal(result.payload.data.contentVersion, ABOUT_CONTENT_VERSION);
  assert.equal(result.payload.data.hero.title, defaultAboutPageContent.hero.title);
  assert.equal(result.payload.data.statistics.length, 4);
  assert.equal(result.payload.data.coreValues.length, 4);
  assert.equal(result.payload.data.benefits.length, 4);
});

test("public About response filters inactive items, sorts active items, and removes image ownership fields", async (t) => {
  const original = AboutPage.findOne; t.after(() => { AboutPage.findOne = original; });
  AboutPage.findOne = async () => ({ isPublished: true, contentVersion: ABOUT_CONTENT_VERSION, toObject: () => ({
    pageKey: "about", isPublished: true, contentVersion: ABOUT_CONTENT_VERSION,
    hero: { title: "Story", isActive: true, imagePublicId: "private-id" },
    statistics: [{ value: "2", label: "Second", sortOrder: 2, isActive: true }, { value: "1", label: "First", sortOrder: 1, isActive: true }, { value: "0", label: "Hidden", sortOrder: 0, isActive: false }],
    coreValues: [], benefits: [], missionVision: { isActive: false }, ethicsPromise: null, callToAction: null,
  }) });
  const result = await capture(getPublicAboutPage, {});
  assert.equal(result.code, 200);
  assert.deepEqual(result.payload.data.statistics.map((item) => item.label), ["First", "Second"]);
  assert.equal(result.payload.data.hero.imagePublicId, undefined);
  assert.equal(result.payload.data.contentVersion, undefined);
  assert.equal(result.payload.data.missionVision, null);
});

test("repeatable About items support create, update, and delete controllers", async (t) => {
  const original = AboutPage.findOne; t.after(() => { AboutPage.findOne = original; });
  let removed = false;
  const existing = { _id: "item-1", title: "Old", description: "Old description", icon: "Gem", sortOrder: 0, isActive: true, toObject() { return { ...this }; }, deleteOne() { removed = true; } };
  const values = [];
  values.id = () => existing;
  const page = { contentVersion: ABOUT_CONTENT_VERSION, coreValues: values, async save() {} };
  AboutPage.findOne = async () => page;

  const created = await capture(createAboutItem, { params: { collection: "coreValues" }, body: { title: "Quality", description: "Every detail matters", icon: "Gem", sortOrder: 1, isActive: true } });
  assert.equal(created.code, 201);
  const updated = await capture(updateAboutItem, { params: { collection: "coreValues", itemId: "item-1" }, body: { title: "Integrity" } });
  assert.equal(updated.code, 200);
  assert.equal(existing.title, "Integrity");
  const deleted = await capture(deleteAboutItem, { params: { collection: "coreValues", itemId: "item-1" } });
  assert.equal(deleted.code, 200);
  assert.equal(removed, true);
});
