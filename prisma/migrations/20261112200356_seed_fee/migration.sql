INSERT INTO "fee" ("id", "year", "amount", "label", "active", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 2024, 0.00, NULL, true, now(), now()),
  (gen_random_uuid(), 2025, 0.00, NULL, true, now(), now()),
  (gen_random_uuid(), 2026, 0.00, NULL, true, now(), now()),
  (gen_random_uuid(), 2027, 0.00, NULL, true, now(), now())
ON CONFLICT ("year") DO NOTHING;
