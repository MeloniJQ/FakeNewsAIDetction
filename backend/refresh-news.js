import { triggerNewsUpdate } from "./job-scheduler.js";
import "dotenv/config";
import { connectDB, disconnectDB } from "./db/connection.js";
import { Detection } from "./db/models.js";

async function refreshNews() {
    console.log("Connecting to DB...");
    await connectDB();

    console.log("Clearing old news...");
    // Delete items that look like trending news (fetchedFrom exists)
    await Detection.deleteMany({ fetchedFrom: { $exists: true } });

    console.log("Triggering news update...");
    const result = await triggerNewsUpdate();

    console.log("Result:", JSON.stringify(result, null, 2));

    await disconnectDB();
}

refreshNews();
