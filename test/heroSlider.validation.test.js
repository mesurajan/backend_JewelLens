import test from "node:test";
import assert from "node:assert/strict";
import { heroSliderSchema } from "../src/validations/heroSlider.validation.js";

const validSlide = {
  placement: "collections",
  title: "The Bridal Edit",
  image: "https://res.cloudinary.com/demo/image/upload/bridal-edit.webp",
  link: "/collections",
  primaryButtonText: "Explore Collection",
  primaryButtonLink: "/collections?category=rings",
  status: "active",
  order: "2",
  overlayStrength: "64",
  startDate: "2026-07-16T12:00",
  endDate: "2026-08-16T12:00",
};

test("accepts collection hero multipart values and coerces display fields", () => {
  const result = heroSliderSchema.safeParse(validSlide);
  assert.equal(result.success, true);
  assert.equal(result.data.placement, "collections");
  assert.equal(result.data.order, 2);
  assert.equal(result.data.overlayStrength, 64);
  assert.ok(result.data.startDate instanceof Date);
});

test("defaults legacy slider records to the homepage placement", () => {
  const result = heroSliderSchema.safeParse({
    title: "Homepage hero",
    image: "https://example.com/hero.jpg",
    link: "/collections",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.placement, "homepage");
});

test("rejects unsafe links and invalid publishing schedules", () => {
  const unsafeLink = heroSliderSchema.safeParse({ ...validSlide, primaryButtonLink: "javascript:alert(1)" });
  assert.equal(unsafeLink.success, false);

  const invalidSchedule = heroSliderSchema.safeParse({
    ...validSlide,
    startDate: "2026-08-16T12:00",
    endDate: "2026-07-16T12:00",
  });
  assert.equal(invalidSchedule.success, false);
});

test("rejects unsupported icons and out-of-range overlay values", () => {
  assert.equal(heroSliderSchema.safeParse({ ...validSlide, highlightOneIcon: "Unknown" }).success, false);
  assert.equal(heroSliderSchema.safeParse({ ...validSlide, overlayStrength: "101" }).success, false);
});
