import express from 'express';
import path from 'path';
import body from 'body-parser';
// import axios from 'axios';
import location from './routes/location';
// import admin from 'firebase-admin';
// import { GoogleAuth } from 'google-auth-library';
import 'dotenv/config';
import morgan from 'morgan';
// import serviceAccount from './key.json';
// const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
import user from './routes/user';
const app = express();
// const fcmSendEndpoint =
// 	'https://fcm.googleapis.com/v1/projects/talk-around-town-423916/messages:send';
// Authenticate a credential with the service account
// admin.initializeApp({
// 	credential: admin.credential.cert(serviceAccount),
// });
// const auth = new GoogleAuth({
// 	keyFile: './key.json', // Path to your service account key file
// 	scopes: SCOPES, // Define the required scopes
// });

// let count = 0;
import cookieParser from 'cookie-parser';

require('dotenv').config({ path: path.join(__dirname, '.env') });
app.use(morgan('dev'));
// const sec_sess = session({
//   resave: false,
//   saveUninitialized: false,
//   secret: process.env.SESSION_SECRET_KEY,
//   store: redisStore,
//   cookie: { maxage: 6048000000 }
// });

// app.use(sec_sess);
app.use(cookieParser("session"));
app.use(body.json());
app.use(body.urlencoded({ extended: true }));
// app.use(response);

import authroutes from './routes/auth'
app.use('/api/auth', authroutes);
app.use("/api/home", user);
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the Earth in km
  var dLat = deg2rad(lat2 - lat1);  // deg2rad below
  var dLon = deg2rad(lon2 - lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

const locations = [
    {
      latitude: 29.646868333333334,
      longitude: -82.33709333333333,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    },
    {
      latitude: 29.644218333333335,
      longitude: -82.33938666666667,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    },
  ];
app.get('/',async (req, res) => {
	return res.send('Active')
} )
// app.post('/endpoint', async (req, res) => {
//   // let accesstoken = await getAccessToken().catch(console.error);
//   const client = await auth.getClient();
// 	const accessToken = await client.getAccessToken();
//   // console.log('token is', accessToken.token);
// 	// console.log('Hello World');
//   // get json body from request
//   const { latitude, longitude } = req.body;
//   let flag = false;
//   locations.forEach((location) => {
//     const distance = getDistanceFromLatLonInKm(
//       latitude,
//       longitude,
//       location.latitude,
//       location.longitude
//     );
//     if (distance < 0.1) {
//       flag = true;
//     }
//   });
//   if (!flag) {
//     return res.send('Not in range of any point');
//   }
//   if(count > 1){
//     return res.send('Already sent');
//   }
//   count++;
// 	const messagePayload = {
// 		message: {
// 			token:
// 				'f5TM5YiVSrqqPMAoOsDFy4:APA91bGfm7uNyAGOB59nq9lfsY9QOni7VpIrbJZJWRxl3_DoJD0LHxQToZayMm87gtGLFF2B4wZhbl9v39EIHPgRwwEQSr_vN426c1sB-6ktbjk7xpTHGAP67LERjuzfZTapcQXC45QD',
// 			notification: {
// 				title: 'You have arrived at your destination!',
// 				body: 'This is a test message.',
// 			},
// 		},
// 	};
// 	axios
// 		.post(fcmSendEndpoint, messagePayload, {
// 			headers: {
// 				Authorization: `Bearer ${accessToken.token}`,
// 				'Content-Type': 'application/json',
// 			},
// 		})
// 		.then((response) => {
// 			console.log('Message sent successfully:', response.data);
// 		})
// 		.catch((error) => {
// 			console.error('Error sending message:', error.response.data);
// 		});
//     res.send('Hello World');
// });
app.use('/endpoint', location);
const port = process.env.PORT || 1337;
app.listen(port, (err) => {
	if (err) console.log(err);
	else console.log(err || 'Listening on port ' + port);
});
