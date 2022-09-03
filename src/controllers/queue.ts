import {config as dotEnvConfig} from 'dotenv';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { Participant } from '../models/participant';
import { ErrorResponse } from '../models/request';
import { Ceremony } from '../models/ceremony';
import { getCeremony } from './ceremony';
import { Queue } from '../models/queue';

dotEnvConfig();
const DOMAIN: string = process.env.DOMAIN!;
const SECONDS_ALLOWANCE_FOR_CHECKIN = Number(process.env.SECONDS_ALLOWANCE_FOR_CHECKIN!);
const SECONDS_INTERVAL_BETWEEN_CHECKINS = Number(process.env.SECONDS_INTERVAL_BETWEEN_CHECKINS!);

export async function getQueue(uid: string): Promise<Queue> {
    const db = getFirestore();
    const raw = await db.collection('ceremonies').doc(DOMAIN).collection('queue').doc(uid).get();
    const data = raw.data() as Queue;
    return data;
}

export async function joinQueue(participant: Participant): Promise<Queue|ErrorResponse> {
    const db = getFirestore();
    const ceremonyDB = db.collection('ceremonies').doc(DOMAIN);
    try {
        const queue = await db.runTransaction(async () => {
            const uid = participant.uid;
            const ceremony = await getCeremony();
            const index = ceremony.highestQueueIndex + 1;
            const queue: Queue = {
                index: index,
                uid: uid,
                status: 'WAITING',
                expectedTimeToStart: await getExpectedTimeToStart(ceremony, index),
                checkingDeadline: await getCheckingDeadline(index),
            };
            // join queue in ceremony
            await ceremonyDB.collection('queue').doc(uid).set(queue);
            return queue;
        });
        // set new highest queue index
        await ceremonyDB.update({
            highestQueueIndex: FieldValue.increment(1),
            waiting: FieldValue.increment(1),
            numParticipants: FieldValue.increment(1),
        });
        return queue;
    } catch (error) {
        return <ErrorResponse>{code: -1, message: 'There was an error joining the queue. Please try again'}
    }
}

export async function checkinQueue(participant: Participant): Promise<Queue|ErrorResponse> {
    const uid = participant.uid;
    const queue = await getQueue(uid);
    const ceremony = await getCeremony();
    const db = getFirestore();
    const ceremonyDB = db.collection('ceremonies').doc(DOMAIN);
    if (!queue){
        return <ErrorResponse>{code: -1, message: 'Participant has not joined the queue'};
    }
    if (queue.status !== 'WAITING'){
        return queue; // indicates the status in queue (COMPLETED, ABSENT, LEFT)
    }
    const now = Timestamp.fromMillis(Date.now() - (SECONDS_ALLOWANCE_FOR_CHECKIN *1000));
    if ( queue.checkingDeadline.valueOf() < now.valueOf() ){
        // if participant missed the deadline then we change status to ABSENT
        return absentQueue(queue);
    }
    const index = queue.index;
    if (ceremony.currentIndex !== index){
        await ceremonyDB.collection('queue').doc(uid).update({
            expectedTimeToStart: await getExpectedTimeToStart(ceremony, index),
            checkingDeadline: await getCheckingDeadline(index),
        });
        const savedQueue = await getQueue(uid);
        return savedQueue;
    }
    // participant is ready to start contribution
    await ceremonyDB.collection('queue').doc(uid).update({status: 'READY'});
    await ceremonyDB.update({waiting: FieldValue.increment(-1) });
    queue.status = 'READY';
    return queue;
}

export async function leaveQueue(queue: Queue): Promise<Queue|ErrorResponse> {
    if (queue.status === 'WAITING' || queue.status === 'READY' || queue.status === 'RUNNING'){
        const db = getFirestore();
        const ceremonyDB = db.collection('ceremonies').doc(DOMAIN);
        await ceremonyDB.collection('queue').doc(queue.uid).update({status: 'LEFT'});
        await ceremonyDB.update({waiting: FieldValue.increment(-1)});
        queue.status = 'LEFT';
        return queue;
    } else {
        return <ErrorResponse>{code: -1, message: 'Queue status indicates that leaving is not possible'};
    }
}

async function absentQueue(queue: Queue): Promise<Queue> {
    const db = getFirestore();
    const ceremonyDB = db.collection('ceremonies').doc(DOMAIN);
    await ceremonyDB.collection('queue').doc(queue.uid).update({status: 'ABSENT'});
    await ceremonyDB.update({waiting: FieldValue.increment(-1)});
    queue.status = 'ABSENT';
    return queue;
}

async function getExpectedTimeToStart(ceremony: Ceremony, index: number): Promise<Timestamp> {
    const averageTime = ceremony.averageSecondsPerContribution;
    const currentIndex = ceremony.currentIndex;

    const db = getFirestore();
    const remainingQueue = await db.collection('queue')
    .where('status','==','WAITING')
    .where('index','>', currentIndex)
    .where('index','<',index)
    .get();
    const remainingTime = remainingQueue.size * averageTime * 1000;
    const expectedTimeToStart = Timestamp.fromMillis(Date.now() + remainingTime);
    return expectedTimeToStart;
}

async function getCheckingDeadline(index: number): Promise<Timestamp> {
    const ceremony = await getCeremony();
    const expectedTimeToStart = await getExpectedTimeToStart(ceremony, index);
    const expectedTimeToStartMillis = expectedTimeToStart.seconds * 1000;
    const halfOfExpectedTime = ( Date.now() - expectedTimeToStartMillis ) / 2;
    const interval = SECONDS_INTERVAL_BETWEEN_CHECKINS * 1000; // * milliseconds
    if (halfOfExpectedTime < interval){
        return Timestamp.fromMillis(Date.now() + halfOfExpectedTime);
    } else {
        return Timestamp.fromMillis(Date.now() + interval);
    }
}

export async function lookForQueueAbsents(): Promise<void> {
    const db = getFirestore();
    const ceremonyDB = db.collection('ceremonies').doc(DOMAIN);
    const queuesDB = ceremonyDB.collection('queue');
    const raw = queuesDB.where('status','==','WAITING').where('checkingDeadline', '<', Timestamp.now());
    const expiredQueues = await raw.get();
    console.log(' [setInterval] looking for queue absents: ' + expiredQueues.size);
    expiredQueues.forEach((rawQueue) => {
        const queue = rawQueue.data() as Queue;
        queuesDB.doc(queue.uid).update({status: 'ABSENT'});
        ceremonyDB.update({waiting: FieldValue.increment(-1)});
    });
    return;
}