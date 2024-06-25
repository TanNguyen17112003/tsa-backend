"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getUser = getUser;
const updateUser = async (req, res) => {
    const { firstName, lastName, role } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: { firstName, lastName, role }
        });
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.controller.js.map