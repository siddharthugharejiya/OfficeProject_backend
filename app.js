import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductRoutes from './Route/ProductRoute.js';
import { Server } from './config/Server.js';
import fs from 'fs';
import { log } from 'console';
import multer from 'multer';
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
console.log(uploadsDir);


const app = express();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use(cors());
// Use your Product routes
app.use("/", ProductRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('🚨 Error occurred:', error);

    if (error instanceof multer.MulterError) {
        console.error('📁 Multer Error:', error.code, error.message);

        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 10MB.',
                code: 'LIMIT_FILE_SIZE'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Too many files. Maximum is 10 files.',
                code: 'LIMIT_FILE_COUNT'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                message: 'Unexpected field name for file upload. Use "images" field.',
                code: 'LIMIT_UNEXPECTED_FILE'
            });
        }
        if (error.code === 'LIMIT_PART_COUNT') {
            return res.status(400).json({
                message: 'Too many parts in the request.',
                code: 'LIMIT_PART_COUNT'
            });
        }

        return res.status(400).json({
            message: 'File upload error: ' + error.message,
            code: error.code
        });
    }

    // Handle other errors
    res.status(500).json({
        message: 'Internal server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

const PORT = process.env.PORT || 9595;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    Server();
});
