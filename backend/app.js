import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductRoutes from './Route/ProductRoute.js';
import { Server } from './config/Server.js';
import fs from 'fs';
import { log } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
console.log(uploadsDir);

// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
//     console.log('Uploads directory created:', uploadsDir);
// }

const app = express();

// ✅ Serve static files from uploads directory (so only one /uploads prefix)
app.use('/uploads', express.static(uploadsDir));

app.use(express.json());
app.use(cors());

// Use your Product routes
app.use("/", ProductRoutes);

app.listen(9595, () => {
    console.log("Server is running on port 9595");
    Server();
});
