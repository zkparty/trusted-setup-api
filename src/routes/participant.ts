import passport from 'passport';
import session from 'express-session';
import {config as dotEnvConfig} from 'dotenv';
import express, { Request, Response } from 'express';
import { Strategy as GitHubStrategy} from 'passport-github2';
import { loginParticipantWithAddress, loginParticipantWithGithub } from '../controllers/participant';
import { GithubUserProfile, LoginRequest } from '../models/request';
import { ceremonyExists } from '../controllers/ceremony';


dotEnvConfig();

const PORT = process.env.PORT;
const DOMAIN = process.env.DOMAIN;
const GITHUB_CLIENT_ID: string = process.env.GITHUB_CLIENT_ID!;
const COOKIE_SESSION_SECRET = process.env.COOKIE_SESSION_SECRET!;
const GITHUB_CLIENT_SECRET: string = process.env.GITHUB_CLIENT_SECRET!;

passport.serializeUser(function(user: any, done: (err: any, id?: unknown) => void) {
  done(null, user);
});

passport.deserializeUser(function(obj: any, done: (err: any, id?: unknown) => void) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `http://${DOMAIN}:${PORT}/participant/login/github/callback`
  },
  function(accessToken: any, refreshToken: any, profile: any, done: any) {
    // asynchronous verification, for effect...
    process.nextTick( () => {
      return done(null, profile);
    });
  }
));

const router = express.Router();
router.use(session({ secret: COOKIE_SESSION_SECRET, resave: false, saveUninitialized: false }));
router.use(passport.initialize());
router.use(ceremonyExists);

router.post('/login/address', async (req: Request, res: Response) => {
    const loginRequest = req.body as LoginRequest;
    const result = await loginParticipantWithAddress(loginRequest);
    res.json(result);
});

router.get('/login/github', passport.authenticate('github', { scope: [ 'user:email' ] }), (_req: Request, _res: Response) => {});

router.get('/login/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), async (req: Request, res: Response) => {
    const githubUser = req.user! as GithubUserProfile;
    const result = await loginParticipantWithGithub(githubUser);
    res.send(result);
});

export{router};

