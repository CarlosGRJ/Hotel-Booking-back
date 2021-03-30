import expressJwt from 'express-jwt';

export const requireSignin = expressJwt({
   // secret, expiryDate
   secret: process.env.JWT_SECRET,
   algorithms: ['HS256'],
});
