import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductRoutes from './Route/ProductRoute.js';
import { Server } from './config/Server.js';
import fs from 'fs';
import { log } from 'console';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
console.log(uploadsDir);


const app = express();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({
    origin: ["https://office-project-frontend.vercel.app",
        "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

// Use your Product routes
app.use("/", ProductRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files. Maximum is 10 files.' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ message: 'Unexpected field name for file upload.' });
        }
    }

    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
});

app.listen(9595, () => {
    console.log("Server is running on port 9595");
    Server();
});
