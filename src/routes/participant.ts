import express, { Request, Response } from 'express';
import { LoginRequest } from '../models/participant';
import { loginParticipant } from '../controllers/participant';

const router = express.Router();

/**
 * @api {post} /participant/login Log in as a ceremony participant
 * @apiName loginParticipant
 * @apiGroup Participant
 * @apiDescription Every ceremony's participant needs to be logged in to
 * avoid sybil attacks (multiple accounts).
 * @apiBody {String} title="A Test Ceremony"
 * @apiBody {String} description="This is a test for API development"
 * @apiSuccess {String} JWT
 * @apiSuccessExample {json} Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *    "JWT": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjB4NUNhNTY1NjlENUNDNTA4MmMzOWEyYTAzMWEwYzYzMTQzMTYzOGI5NyIsImlhdCI6MTUxNjIzOTAyMn0.I8BXaPkl65vjwYpL7Xf3uDBhPusunGMb90pfCE7BxL8"
 *  }
 */
router.post('/login', async (req: Request, res: Response) => {
    const loginRequest = req.body as LoginRequest;
    const result = loginParticipant(loginRequest);
    res.json({'message': 'ok'});
});
// TODO: create another route for Github login

export{router};
