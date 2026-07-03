import test from "node:test";
import assert from "node:assert/strict";
import Review from "../models/Review";
import AuditLog from "../models/AuditLog";
import Contract from "../models/Contract";
import FilmOpsProject from "../models/FilmOpsProject";

test("Review model supports studio room target", () => {
  const targetTypePath = Review.schema.path("targetType") as any;
  const studioRoomPath = Review.schema.path("studioRoom") as any;
  assert.ok(targetTypePath);
  assert.ok(studioRoomPath);
  assert.deepEqual(targetTypePath.options.enum, [
    "crew",
    "service",
    "equipment",
    "studio_room",
  ]);
});

test("Audit log model has retention field", () => {
  const expiresPath = AuditLog.schema.path("expiresAt") as any;
  assert.ok(expiresPath);
});

test("Contract model includes status workflow", () => {
  const statusPath = Contract.schema.path("status") as any;
  assert.ok(statusPath);
  assert.deepEqual(statusPath.options.enum, [
    "draft",
    "sent",
    "signed",
    "cancelled",
  ]);
});

test("Film ops model has required production arrays", () => {
  assert.ok(FilmOpsProject.schema.path("callSheets"));
  assert.ok(FilmOpsProject.schema.path("dprs"));
  assert.ok(FilmOpsProject.schema.path("attendance"));
  assert.ok(FilmOpsProject.schema.path("locations"));
  assert.ok(FilmOpsProject.schema.path("talents"));
});
