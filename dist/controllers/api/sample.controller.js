"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSample = exports.updateSample = exports.createSample = exports.getSample = exports.getSamples = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getSamples = async (req, res) => {
    try {
        const samples = await prisma.sample.findMany();
        res.status(200).json(samples);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error test', error });
    }
};
exports.getSamples = getSamples;
const getSample = async (req, res) => {
    try {
        const sample = await prisma.sample.findUnique({
            where: { id: req.params.id }
        });
        if (!sample) {
            return res.status(404).json({ message: 'Sample not found' });
        }
        res.status(200).json(sample);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.getSample = getSample;
const createSample = async (req, res) => {
    const { name, version, status, type } = req.body;
    try {
        const newSample = await prisma.sample.create({
            data: { name, version, status, type }
        });
        res.status(201).json(newSample);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.createSample = createSample;
const updateSample = async (req, res) => {
    const { name, version, status, type } = req.body;
    try {
        const sample = await prisma.sample.update({
            where: { id: req.params.id },
            data: { name, version, status, type }
        });
        res.status(200).json(sample);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.updateSample = updateSample;
const deleteSample = async (req, res) => {
    try {
        await prisma.sample.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'Sample deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
exports.deleteSample = deleteSample;
//# sourceMappingURL=sample.controller.js.map