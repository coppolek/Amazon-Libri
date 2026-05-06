# Security Spec

## Data Invariants
1. A review must belong to a valid `bookId` and must have a valid `rating` between 1 and 5.
2. The `userId` of a review must strictly match the authenticated user's `uid`.
3. A review's timestamps must be valid server timestamps.

## The "Dirty Dozen" Payloads
1. Create review with no auth.
2. Create review with mismatched `userId`.
3. Create review with invalid rating (6).
4. Create review with invalid rating (0).
5. Create review with extra fields.
6. Update review as non-owner.
7. Update review bypassing `hasOnly(['rating', 'text', 'updatedAt'])`.
8. Update review trying to change `userId`.
9. Delete review as non-owner.
10. Query reviews without constraints (should fail or succeed depending on our public access logic, but wait, reviews are public? Yes).
11. Create review with client-provied `createdAt` instead of `request.time`.
12. Update review with client-provided `updatedAt` instead of `request.time`.

## Test Runner
Available in `firestore.rules.test.ts`.
