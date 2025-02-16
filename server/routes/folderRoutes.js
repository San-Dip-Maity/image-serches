const express = require("express");
const Folder = require("../models/FolderSchema");
const Image = require("../models/ImageSchema");
const authenticateUser = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

const router = express.Router();

router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user.userId;

    let path = name;
    if (parentId) {
      const parentFolder = await Folder.findById(parentId);
      path = `${parentFolder.path}/${name}`;
    }

    const folder = await Folder.create({ name, userId, parentId, path });
    res.status(201).json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const folders = await Folder.find({ userId });
    res.json(folders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const buildNestedFolders = async (userId, parentId = null) => {
  const folders = await Folder.find({ userId, parentId });

  return Promise.all(
    folders.map(async (folder) => {
      const children = await buildNestedFolders(userId, folder._id);
      return { ...folder.toObject(), children };
    })
  );
};

router.get("/nested", authenticateUser, async (req, res) => {
  try {
    // Debug logging
    console.log("Request user object:", req.user);

    if (!req.user) {
      throw new Error("Authentication middleware did not set user object");
    }

    const userId = req.user.userId;
    if (!userId) {
      throw new Error("User ID not found in authenticated user object");
    }

    const nestedFolders = await buildNestedFolders(userId);
    console.log("Sending nested folders:", {
      count: nestedFolders.length,
      userId,
    });

    res.json(nestedFolders);
  } catch (error) {
    console.error("Nested folders error:", {
      message: error.message,
      stack: error.stack,
      user: req.user,
    });

    res.status(500).json({
      message: "Failed to fetch nested folders",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

router.get("/:folderId/images", authenticateUser, async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user.userId;

    const images = await Image.find({ userId, folderId });
    res.json(images);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/:folderId", authenticateUser, async (req, res) => {
  try {
    const { folderId } = req.params;

    // Add MongoDB ObjectId validation
    if (!mongoose.Types.ObjectId.isValid(folderId)) {
      return res.status(400).json({ message: "Invalid folder ID format" });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    res.json(folder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
