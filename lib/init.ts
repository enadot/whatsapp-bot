import { startScheduler } from "@/scheduler/job";

let initialized = false;

export async function initApp() {
  if (!initialized) {
    console.log("Initializing scheduler...");
    await startScheduler();
    initialized = true;
  }
}
