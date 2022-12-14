import morgan from 'morgan';
import express from 'express';
import {config as dotEnvConfig} from 'dotenv';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { router as contributionRoutes } from './routes/contribution';
import { router as participantRoutes } from './routes/participant';
import { router as ceremonyRoutes } from './routes/ceremony';
import { lookForQueueAbsents } from './controllers/queue';
import { router as queueRoutes } from './routes/queue';
import serviceAccount from './firebase_skey.json';
import { lookForContributionAbsents } from './controllers/contribution';

dotEnvConfig();

initializeApp({ credential: cert(serviceAccount as ServiceAccount) });

const app = express();
const PORT = process.env.PORT!;
const DOMAIN = process.env.DOMAIN!;
const SECONDS_INTERVAL_LOOK_FOR_ABSENTS = Number(process.env.SECONDS_INTERVAL_LOOK_FOR_ABSENTS!);

setInterval(lookForQueueAbsents, SECONDS_INTERVAL_LOOK_FOR_ABSENTS * 1000);
setInterval(lookForContributionAbsents, SECONDS_INTERVAL_LOOK_FOR_ABSENTS * 1000);

app.use(express.json());
app.use(morgan('combined'));
app.use('/queue', queueRoutes);
app.use('/ceremony', ceremonyRoutes);
app.use('/participant', participantRoutes);
app.use('/contribution', contributionRoutes);

app.listen(PORT, async () => {
  console.log(`⚡️[server]: Running at https://${DOMAIN}:${PORT}`);
});