import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductRoutes from './Route/ProductRoute.js';
import { Server } from './config/Server.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created:', uploadsDir);
}

const app = express();

// ✅ Serve uploads folder
app.use('/uploads', express.static(uploadsDir));

// ✅ JSON parsing
app.use(express.json());

// ✅ CORS
app.use(cors({
    origin: [
        "https://office-project-frontend.vercel.app",
        "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ Product routes
app.use("/", ProductRoutes);

// Start server
app.listen(9595, () => {
    console.log("Server is running on port 9595");
    Server(); // अगर तुम्हारे पास server config है
});
