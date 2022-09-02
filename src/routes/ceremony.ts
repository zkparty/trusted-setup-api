import express, { Request, Response } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { createCeremony, getCeremony } from '../controllers/ceremony';
import { Ceremony } from '../models/ceremony';

const router = express.Router();

router.post('/create', async (req: Request, res: Response) => {
    const createdCeremony = await getCeremony();
    if (createdCeremony){
        res.json({code: -1, message: 'Ceremony is already created'});
    } else {
        const ceremony = req.body as Ceremony;
        ceremony.startTime = Timestamp.fromMillis(ceremony.startTime as any);
        ceremony.endTime = Timestamp.fromMillis(ceremony.endTime as any);
        const result = await createCeremony(ceremony);
        res.json(result);
    }
});

router.get('/status', async (_req: Request, res: Response) => {
    const ceremony = await getCeremony();
    res.json(ceremony || {});
});

export {router};