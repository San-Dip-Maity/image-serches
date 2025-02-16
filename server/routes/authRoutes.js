const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h'; // Default to 24 hours


// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({ email, password: hashedPassword });

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        res.status(201).json({ token, user: { id: user._id, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        // Validate user existence and password
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

        res.json({ token, user: { id: user._id, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
});

// Logout Route (Handled Client-Side)
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // JWTs cannot be invalidated without a token blacklist system
        res.json({ message: 'Logged out successfully. Please remove token on the client side.' });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong. Try again later.' });
    }
});

module.exports = router;
