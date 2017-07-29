import express from 'express';
import config from './config';
import { User, UserLogin, UserClaim, UserProfile, Label } from './data/models';

var router = express.Router()

router.post('/google/refresh-token', (req, res) => {
  const oauth = new google.auth.OAuth2(
      config.auth.google.id,
      config.auth.google.secret,
      config.auth.returnURL,
    )
  oauth.setCredentials({
    access_token: req.body.accessToken,
    refresh_token: req.body.refreshToken,
  })
  oauth.refreshAccessToken((err, tokens) => {
    req.user.accessToken = tokens.access_token;
    tokens.expiryTime = tokens.expiry_date;
    req.user.expiryTime = tokens.expiry_date;
    res.send(tokens);
  })
})

router.post('/add-label', (req, res) => {
  console.log(req.body);
  Label.create({
    labelId: req.body.labelId,
    position: req.body.position,
    userId: req.user.id,
  })
    .then(label => {
      res.sendStatus(200)
    })
})

export default router;
