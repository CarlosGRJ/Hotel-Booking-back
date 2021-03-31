import User from '../models/user';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
   console.log(req.body);
   const { name, email, password } = req.body;
   // Validation
   if (!name) return res.status(400).send('Name is required');
   if (!password || password.length < 6)
      return res
         .status(400)
         .send('Password is required and should be min 6 characters long');

   const userExist = await User.findOne({ email }).exec();
   if (userExist) return res.status(400).send('Email is taken');

   // register
   const user = new User(req.body);

   try {
      await user.save();
      console.log('USER CREATED', user);
      return res.json({ ok: true });
   } catch (error) {
      console.log('CREATE USER FAILED', error);
      return res.status(400).send('Error. Try again');
   }
};

export const login = async (req, res) => {
   const { email, password } = req.body;

   try {
      // Check if user with that email exist
      const user = await User.findOne({ email }).exec();
      if (!user) res.status(400).send('User with that email not found');
      // compare password
      user.comparePassword(password, (err, match) => {
         console.log('COMPARE PASSWORD IN LOGIN ERR', err);
         if (!match || err) return res.status(400).send('Wrong password');
         // GENERATE A TOKEN THEN SEND AS RESPONSE TO CLIENT
         const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
         });
         res.json({
            token,
            user: {
               _id: user._id,
               name: user.name,
               email: user.email,
               createdAt: user.createdAt,
               updatedAt: user.updatedAt,
               stripe_account_id: user.stripe_account_id,
               stripe_seller: user.stripe_seller,
               stripeSession: user.stripeSession,
            },
         });
      });
   } catch (error) {
      console.log('LOGIN ERROR', error);
      res.status(400).send('Signin failed');
   }
};
