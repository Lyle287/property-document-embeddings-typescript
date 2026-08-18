import test from "node:test";
import assert from "node:assert/strict";
import { chooseDocuments, type RankedDocument } from "./property_search.ts";

test("maintenance search keeps the matching request and excludes other document kinds", () => {
  const results: RankedDocument[] = [
    { id: "inspection-1", property: "Maple Court", kind: "inspection", text: "Fire alarm reminder", score: 0.99 },
    { id: "maintenance-1", property: "Maple Court", kind: "maintenance", text: "Leaking sink needs a plumber", score: 0.71 },
    { id: "maintenance-2", property: "Maple Court", kind: "maintenance", text: "Replace hallway light", score: 0.42 },
  ];

  assert.deepEqual(chooseDocuments(results, "maintenance").map((item) => item.id), ["maintenance-1", "maintenance-2"]);
});
