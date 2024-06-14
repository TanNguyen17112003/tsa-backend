import { Request, Response } from 'express';
import { Sample } from '../models/sample';

export const getSamples = async (req: Request, res: Response) => {
    try {
        const samples = await Sample.find().populate('type');
        res.status(200).json(samples);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getSample = async (req: Request, res: Response) => {
    try {
        const sample = await Sample.findById(req.params.id).populate('type');
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
        const newSample = new Sample({ name, version, status, type });
        await newSample.save();
        res.status(201).json(newSample);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateSample = async (req: Request, res: Response) => {
    const { name, version, status, type } = req.body;
    try {
        const sample = await Sample.findById(req.params.id);
        if (!sample) {
            return res.status(404).json({ message: 'Sample not found' });
        }
        sample.name = name || sample.name;
        sample.version = version || sample.version;
        sample.status = status || sample.status;
        sample.type = type || sample.type;
        await sample.save();
        res.status(200).json(sample);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteSample = async (req: Request, res: Response) => {
    try {
        const sample = await Sample.findByIdAndDelete(req.params.id);
        if (!sample) {
            return res.status(404).json({ message: 'Sample not found' });
        }
        res.status(200).json({ message: 'Sample deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
