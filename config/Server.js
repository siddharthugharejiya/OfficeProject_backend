import mongoose from "mongoose";

export const Server = async () => {
    try {
        await mongoose.connect('mongodb+srv://multiera95_db_user:12345@cluster0.l24hhyf.mongodb.net/your_db_name?retryWrites=true&w=majority&appName=Cluster0')
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1); // Optional: forcefully stop the server if DB connection fails
    }
};
