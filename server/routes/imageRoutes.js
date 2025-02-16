const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Image = require('../models/ImageSchema');
const authenticateUser = require('../middleware/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.post('/', authenticateUser, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const { name, folderId } = req.body;
        const userId = req.user.userId;

        let validFolderId = null;
        if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
            validFolderId = new mongoose.Types.ObjectId(folderId);
        }

        const filePath = path.join('uploads', req.file.filename);

        const image = await Image.create({
            name,
            userId,
            folderId: validFolderId,
            filePath
        });

        res.status(201).json(image);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const images = await Image.find({ userId });
        res.json(images);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
});

router.get('/search', authenticateUser, async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user.userId;

        const images = await Image.find({
            userId,
            name: { $regex: query, $options: 'i' }
        });

        res.json(images);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


module.exports = router;
