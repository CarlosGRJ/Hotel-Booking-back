import User from '../models/user';

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
