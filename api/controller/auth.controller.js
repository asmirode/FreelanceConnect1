import User from '../models/user.model.js'
import bcrypt from 'bcrypt';
import Jwt from 'jsonwebtoken';
import createError from '../utils/createError.js';
export async function register(req, res, next) {
    try {
        const hash = bcrypt.hashSync(req.body.password, 5);
        const newUser = new User({
            ...req.body,
            password: hash,
        });
        await newUser.save();
        res.status(201).send("user created");
    } catch (err) {
        next(err);
    }
}
export const login = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return next(createError(404, 'User not found'));

        const iscorrect = bcrypt.compareSync(req.body.password, user.password);
        if (!iscorrect) return next(createError(400, 'wrong password'));

        const token = Jwt.sign({
            id: user._id,
            isSeller: user.isSeller,
        }, process.env.JWT_KEY);
        const { password, ...info } = user._doc;
        // Set cookie options depending on environment so cross-site cookies work in dev and prod
        const isProd = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            // In production we need secure cookies and explicit SameSite=None for cross-site requests
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            // set a reasonable maxAge (e.g., 7 days)
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };

        res.cookie("accessToken", token, cookieOptions).status(200).send(info);
    } catch (error) {
        next(error);
    }
}
export const logout = async (req, res) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax'
    }).status(200).send("User has been logout");
}

// Debug endpoint to check cookie and token
export const checkAuth = (req, res) => {
    try {
        const cookies = req.cookies || {};
        const token = cookies.accessToken;
        if (!token) {
            return res.status(200).json({ hasToken: false, cookies });
        }
        let payload = null;
        try {
            payload = Jwt.verify(token, process.env.JWT_KEY);
        } catch (err) {
            return res.status(200).json({ hasToken: true, valid: false, error: err.message, cookies });
        }
        return res.status(200).json({ hasToken: true, valid: true, payload, cookies });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}