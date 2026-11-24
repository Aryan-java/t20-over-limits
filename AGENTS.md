# Project rules

- Keep single-player DRS incident evidence and ruling logic in `src/lib/drsReview.ts`; freeze evidence when the delivery is simulated so replay presentation and score resolution cannot reroll separately.