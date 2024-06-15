import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getSamples = async (req: Request, res: Response) => {
    try {
        const samples = await prisma.sample.findMany();
        res.status(200).json(samples);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getSample = async (req: Request, res: Response) => {
    try {
        const sample = await prisma.sample.findUnique({
            where: { id: req.params.id }
        });
        if (!sample) {
            return res.status(404).json({ message: 'Sample not found' });
        }
        res.status(200).json(sample);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createSample = async (req: Request, res: Response) => {
    const { name, version, status, type } = req.body;
    try {
        const newSample = await prisma.sample.create({
            data: { name, version, status, type }
        });
        res.status(201).json(newSample);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
export const updateSample = async (req: Request, res: Response) => {
    const { name, version, status, type } = req.body;
    try {
        const sample = await prisma.sample.update({
            where: { id: req.params.id },
            data: { name, version, status, type }
        });
        res.status(200).json(sample);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteSample = async (req: Request, res: Response) => {
    try {
        await prisma.sample.delete({
            where: { id: req.params.id }
        });
        res.status(200).json({ message: 'Sample deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
