import mongoose from "mongoose";
import 'dotenv/config'
export const Server = async () => {
    try {
        await mongoose.connect(process.env.Mongo_url)
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1); // Optional: forcefully stop the server if DB connection fails
    }
};
