# **API Server for Trusted Setup Ceremonies**

This web server was developed to be use in Trusted Setup Ceremonies. The API server acts as a coordinator for all participants to login, join the queue, download the transcript and start the computation. It can be used by other developers and teams to building their own client implementation. To learn more about this API check out the [KGZ Ceremony Specs](https://github.com/zkparty/kzg-ceremony-specs).

The overall architecture of the setup is described in the image below. Remember that the data of the setup is store in a Firebase project.

![](https://content.pstmn.io/b4b2352e-5c65-4150-b1fe-2dff3a8ab830/VHJ1c3RlZFNldHVwSGlnaExldmVsQ29tcG9uZW50cy5wbmc=)

## **Overview**
This API server will be deployed for a specific ceremony. For example:

1. **Ceremony A:** API server would be deployed at [https://aceremony.ethereum.org]()
2. **Ceremony B:** API server would be deployed at [https://bceremony.ethereum.org]()

This means that all the API endpoints would consider a single ceremony per server with multiple contributions, participants and ceremony states.

## **Authentication**
To access and interact with most of the API endpoints, users would need a JWT access token. The authentication process to obtain this token can be performed in two ways:
1. **Login using a wallet:** the client-side application would sign a specific message with a private key and send it to this API `/participant/login` endpoint to authenticate. The server would create a user if it does not exist or just send the access JWT token.
2. **Login using Github:** the Login With Github functionality should be implemented on the client-side following the [Firebase guides](https://firebase.google.com/docs/auth/web/github-auth). At the end of the authentication flow between the client application and Github, the client-side would have an access token by executing `firebase.auth().currentUser.getIdToken()`. The token could be used as an access token to the API server.

## **Run server in development mode**
1. Clone repo: `git clone https://github.com/zkparty/trusted-setup-api`
3. Install dependencies: `npm install`
4. Set up your configuration in the `.env` file
5. Set up your `firebase_skey.json` file in the `/src` directory
6. Run the development server: `npm run dev`
7. Use the APIs in `http://localhost:PORT/`

## **Run server in production mode**
1. Clone repo: `git clone https://github.com/zkparty/trusted-setup-api`
3. Install dependencies: `npm install`
4. Set up your configuration in the `.env` file
5. Set up your `firebase_skey.json` file in the `/src` directory
6. Install [PM2](https://pm2.keymetrics.io/): `npm install pm2 -g`
7. Build the project for production: `npx tsc`
8. Run the production server: `pm2 start dist/index.js -i 0` (the *-i 0* flag indicates that app can use all available clusters)
9.  Use the APIs in `http://localhost:PORT/`

The following commands might be useful for managing PM2-running applications:
1. `pm2 status`: shows all applications (running or stopped). If app was clusterified then it would show all processes
2. `pm2 stop [appName | fileName ]`: stops all proccesses related to that specific application
3. `pm2 delete [appName | fileName ]`: delete all proccesses related to that specific application from PM2

## **Run the documentation server**
1. Clone repo: `git clone https://github.com/zkparty/trusted-setup-api`
1. Run `npm run docs-create`
2. Go to [http://localhost:3004/index.html]()

## **Artillery tests**

1. Generate participants data (private keys, public addresses and signed messages): `node .\auxiliar\generateParticipantCSV.mjs`
2. Run the tests using variables from the .env file: `artillery run .\tests\main.yml --dotenv .env`