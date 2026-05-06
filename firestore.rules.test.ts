import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

export async function runTests() {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-project-test",
    firestore: {
      rules: fs.readFileSync("DRAFT_firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080
    },
  });

  const alice = testEnv.authenticatedContext("alice");
  const unauth = testEnv.unauthenticatedContext();

  const validReview = {
    bookId: "book123",
    userId: "alice",
    rating: 5,
    text: "Great book!",
    createdAt: { seconds: 12345, nanoseconds: 0 },
    updatedAt: { seconds: 12345, nanoseconds: 0 }
  };

  // Run the Dirty Dozen here
  // ...
  console.log("Tests defined. Use firebase emulator to run.");
}
