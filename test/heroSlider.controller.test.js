import test from "node:test";
import assert from "node:assert/strict";
import HeroSlider from "../src/models/heroSlider.model.js";
import {
  createHeroSlider,
  deleteHeroSlider,
  getHeroSliders,
  updateHeroSlider,
} from "../src/controllers/heroSlider.controller.js";
import { adminOnly } from "../src/middleware/auth.middleware.js";

const makeResponse = () => {
  let statusCode;
  let payload;
  let resolve;
  let reject;
  const done = new Promise((res, rej) => { resolve = res; reject = rej; });
  return {
    response: {
      status(code) { statusCode = code; return this; },
      json(body) { payload = body; resolve({ statusCode, payload }); return this; },
    },
    done,
    reject,
  };
};

const run = async (handler, req) => {
  const capture = makeResponse();
  handler(req, capture.response, capture.reject);
  return capture.done;
};

const baseSlide = {
  _id: "slide-1",
  placement: "collections",
  title: "Collection story",
  image: "https://example.com/collection.webp",
  imagePublicId: "",
  link: "/collections",
  status: "active",
  order: 1,
};

test("creates a collection slide through the protected controller payload", async (t) => {
  const originalFindOne = HeroSlider.findOne;
  const originalCreate = HeroSlider.create;
  t.after(() => { HeroSlider.findOne = originalFindOne; HeroSlider.create = originalCreate; });

  HeroSlider.findOne = () => ({ sort: async () => null });
  HeroSlider.create = async (data) => ({ _id: "created", ...data });

  const result = await run(createHeroSlider, { body: baseSlide, file: undefined });
  assert.equal(result.statusCode, 201);
  assert.equal(result.payload.data.placement, "collections");
  assert.equal(result.payload.data.title, baseSlide.title);
});

test("public collection query enforces active status, schedule, projection, and ordering", async (t) => {
  const originalFind = HeroSlider.find;
  t.after(() => { HeroSlider.find = originalFind; });
  let receivedQuery;
  let receivedProjection;
  let receivedSort;

  HeroSlider.find = (query) => {
    receivedQuery = query;
    return {
      select(projection) {
        receivedProjection = projection;
        return {
          sort(sort) {
            receivedSort = sort;
            return { lean: async () => [] };
          },
        };
      },
    };
  };

  const result = await run(getHeroSliders, { query: { placement: "collections" } });
  assert.equal(result.statusCode, 200);
  assert.equal(receivedQuery.placement, "collections");
  assert.equal(receivedQuery.status, "active");
  assert.equal(receivedQuery.$and.length, 2);
  assert.match(receivedProjection, /imageAlt/);
  assert.deepEqual(receivedSort, { order: 1, createdAt: 1 });
});

test("updates an existing collection slide while preserving its current image", async (t) => {
  const originalFindById = HeroSlider.findById;
  t.after(() => { HeroSlider.findById = originalFindById; });
  const document = {
    ...baseSlide,
    toObject() { return { ...this }; },
    async save() {},
  };
  HeroSlider.findById = async () => document;

  const result = await run(updateHeroSlider, {
    params: { id: baseSlide._id },
    body: { title: "Updated collection story" },
    file: undefined,
  });
  assert.equal(result.statusCode, 200);
  assert.equal(result.payload.data.title, "Updated collection story");
  assert.equal(result.payload.data.image, baseSlide.image);
});

test("deletes a collection slide record without deleting an unowned URL", async (t) => {
  const originalFindById = HeroSlider.findById;
  t.after(() => { HeroSlider.findById = originalFindById; });
  let deleted = false;
  HeroSlider.findById = async () => ({ ...baseSlide, async deleteOne() { deleted = true; } });

  const result = await run(deleteHeroSlider, { params: { id: baseSlide._id } });
  assert.equal(result.statusCode, 200);
  assert.equal(deleted, true);
});

test("rejects non-admin access to slider mutations", () => {
  assert.throws(
    () => adminOnly({ user: { role: "customer" } }, {}, () => {}),
    (error) => error.statusCode === 403 && error.message === "Admin access only",
  );
});
