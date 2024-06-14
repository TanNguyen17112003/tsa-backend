import { NextFunction, Request, Response } from 'express';
import { User } from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    const { email, firstName, lastName, password, role, status } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            role,
            status
        });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.log(error);
        next();
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '24h' });
        res.status(200).json({ token });
    } catch (error) {
        console.log(error);
        next();
    }
};

export const changeInformation = async (req: Request, res: Response, next: NextFunction) => {
    let updateFields: { [key: string]: any } = {};
    if (req.body.firstName) {
        updateFields['firstName'] = req.body.firstName;
    }
    if (req.body.lastName) {
        updateFields['lastName'] = req.body.lastName;
    }
    try {
        const user = await User.findByIdAndUpdate(req.params.id, updateFields);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.log(error);
        next();
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, newPassword } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.log(error);
        next();
    }
};
