"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.sendOtp = exports.resetPassword = exports.changeInformation = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const otp_generator_1 = __importDefault(require("otp-generator"));
const dotenv_1 = require("dotenv");
const prisma = new client_1.PrismaClient();
(0, dotenv_1.config)();
const register = async (req, res) => {
    const { email, firstName, lastName, password, role } = req.body;
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role
            }
        });
        if (role.toString() === 'CUSTOMER') {
            await prisma.customer.create({
                data: {
                    customerId: newUser.id
                }
            });
        }
        else if (role.toString() === 'SHIPPER') {
            await prisma.shipper.create({
                data: {
                    shipperId: newUser.id
                }
            });
        }
        else {
            await prisma.staff.create({
                data: {
                    staffId: newUser.id
                }
            });
        }
        res.status(201).json({ message: 'User created successfully', user: newUser });
    }
    catch (error) {
        throw error;
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token });
    }
    catch (error) {
        throw error;
    }
};
exports.login = login;
const changeInformation = async (req, res) => {
    const { firstName, lastName } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: String(req.params.id) },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName })
            }
        });
        res.status(200).json({ message: 'User updated successfully', user });
    }
    catch (error) {
        throw error;
    }
};
exports.changeInformation = changeInformation;
const resetPassword = async (req, res) => {
    const { email, password, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (error) {
        throw error;
    }
};
exports.resetPassword = resetPassword;
const sendOtp = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(400).json({ message: 'Cannot find user' });
        }
        await prisma.verificationEmail.deleteMany({
            where: {
                userId
            }
        });
        // Create a new OTP
        const otp = otp_generator_1.default.generate(6, { upperCaseAlphabets: false, specialChars: false });
        // Create a new data in verificationEmail table for current user
        await prisma.verificationEmail.create({
            data: {
                userId,
                otp
            }
        });
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false,
            auth: {
                user: process.env.SMTP_GMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });
        const mailOptions = {
            from: '"Transport Support Application (TSA) <tsa@no-reply>"',
            to: user.email,
            subject: 'TSA verification link',
            html: `<p>Enter this OTP to verify your tsa account: <div style="font-weight:bold">${otp}</div></p>`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(400).json({ message: 'Failed to send OTP' });
            }
            if (info) {
                console.log(info);
            }
            res.status(200).json({ message: 'OTP sent successfully', otp });
        });
    }
    catch (error) {
        throw error;
    }
};
exports.sendOtp = sendOtp;
const verifyOTP = async (req, res) => {
    const userId = req.params.id;
    const { otp } = req.body;
    try {
        const verifcationEmail = await prisma.verificationEmail.findFirst({
            select: {
                expiresAt: true
            },
            where: {
                userId,
                otp
            }
        });
        if (!verifcationEmail) {
            return res.status(400).json({ message: 'invalid OTP' });
        }
        if (verifcationEmail.expiresAt.getTime() < Date.now()) {
            await prisma.verificationEmail.delete({
                where: {
                    userId
                }
            });
            return res.status(400).json({ message: 'OTP expired' });
        }
        await prisma.verificationEmail.delete({
            where: {
                userId
            }
        });
        await prisma.user.update({
            where: { id: userId },
            data: {
                verified: true
            }
        });
        res.status(200).json({ message: 'OTP verified successfully' });
    }
    catch (error) {
        throw error;
    }
};
exports.verifyOTP = verifyOTP;
//# sourceMappingURL=auth.controller.js.map