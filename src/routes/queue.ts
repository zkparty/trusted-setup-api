import {config as dotEnvConfig} from 'dotenv';
import express, { Request, Response } from 'express';
import { getQueue, joinQueue, checkinQueue, leaveQueue } from '../controllers/queue';
import { authenticateParticipant } from '../controllers/participant';
import { ceremonyExists } from '../controllers/ceremony';
import { Participant } from '../models/participant';


dotEnvConfig();

const router = express.Router();
router.use(ceremonyExists);

router.get('/join', authenticateParticipant, async (req: Request, res: Response) => {
    const participant = req.user as Participant;
    const queue = await getQueue(participant.uid);
    if (queue && queue.status !== 'LEFT'){
        res.json(queue);
        return;
    }
    const result = await joinQueue(participant);
    res.json(result);
});

router.get('/checkin', authenticateParticipant, async (req: Request, res: Response) => {
    const participant = req.user as Participant;
    const result = await checkinQueue(participant);
    res.json(result);
});

router.get('/leave', authenticateParticipant, async (req: Request, res: Response) => {
    const participant = req.user as Participant;
    const queue = await getQueue(participant.uid);
    const result = await leaveQueue(queue);
    res.json(result);
});

export{router};