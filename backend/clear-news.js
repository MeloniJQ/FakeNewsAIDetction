import "dotenv/config";
import mongoose from "mongoose";

async function clearNews() {
    console.log("Connecting to DB...");
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        // Define schema loosely to match existing collection
        const Detection = mongoose.model("Detection", new mongoose.Schema({}, { strict: false }));

        console.log("Clearing generated news...");
        const result = await Detection.deleteMany({ fetchedFrom: { $exists: true } });
        console.log(`Deleted ${result.deletedCount} documents.`);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

clearNews();
