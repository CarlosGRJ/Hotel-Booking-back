import User from '../models/user';
import Order from '../models/order';
import Hotel from '../models/hotel';
import Stripe from 'stripe';
import queryString from 'query-string';

const stripe = Stripe(process.env.STRIPE_SECRET);

export const createConnectAccount = async (req, res) => {
   const user = await User.findById(req.user._id).exec();
   console.log('USER ===> ', user);

   if (!user.stripe_account_id) {
      const account = await stripe.accounts.create({
         type: 'express',
      });
      console.log('ACCOUNT ===> ', account);
      user.stripe_account_id = account.id;
      user.save();
   }
   // npm i query-string
   // create login link based on account id (for frontend to complete onboarding)
   let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: 'account_onboarding',
   });
   // prefill any info such as email
   accountLink = Object.assign(accountLink, {
      'stripe_user[email]': user.email || undefined,
   });
   // console.log('ACCOUNT LINK', accountLink);
   const link = `${accountLink.url}?${queryString.stringify(accountLink)}`;
   console.log('link ', link);
   res.send(link);
};

const updateDelayDays = async (accountId) => {
   const account = await stripe.accounts.update(accountId, {
      settings: {
         payouts: {
            schedule: {
               delay_days: 7,
            },
         },
      },
   });
   return account;
};

export const getAccountStatus = async (req, res) => {
   // console.log('GET ACCOUNT STATUS');
   const user = await User.findById(req.user._id).exec();
   const account = await stripe.accounts.retrieve(user.stripe_account_id);
   // console.log('USER ACCOUNT RETRIEVE ', account);
   // update delay days
   const updatedAccount = await updateDelayDays(account.id);
   const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
         stripe_seller: updatedAccount,
      },
      { new: true },
   )
      .select('-password')
      .exec();
   // El select() es para seleccionar que quieres mandar al front ||  el signo menos - es para decir que no quieres mandar  ( En este caso -password es para no mandarlo si fuera password solo mandariamos el password)

   // console.log(updatedUser);
   res.json(updatedUser);
};

export const getAccountBalance = async (req, res) => {
   const user = await User.findById(req.user._id).exec();

   try {
      const balance = await stripe.balance.retrieve({
         stripeAccount: user.stripe_account_id,
      });
      // console.log('BALANCE ====> ', balance);
      res.json(balance);
   } catch (error) {
      console.log(error);
   }
};

export const payoutSetting = async (req, res) => {
   try {
      const user = await User.findById(req.user._id).exec();

      const loginLink = await stripe.accounts.createLoginLink(
         user.stripe_account_id,
         {
            redirect_url: process.env.STRIPE_SELLING_REDIRECT_URL,
         },
      );
      console.log('LOGIN LINK FOR PAYOUT SETTING', loginLink);
      res.json(loginLink);
   } catch (error) {
      console.log('STRIPE PAYOUT SETTING ERR ', error);
   }
};

export const stripeSessionId = async (req, res) => {
   // 1. get Hotel id from req.body
   const { hotelId } = req.body;
   // 2. find the hotel based on hotel id from db
   const item = await Hotel.findById(hotelId).populate('postedBy').exec();
   console.log('item ', item);
   // 3. 20% charge as application
   const fee = (item.price * 20) / 100;
   // 4. create a session
   const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      // 5. purchasing item details, it will be shown to user on checkout
      line_items: [
         {
            name: item.title,
            amount: item.price * 100, // in cents
            currency: 'usd',
            quantity: 1,
         },
      ],
      // 6. Create payment intent with application fee and destination charge 80%
      payment_intent_data: {
         application_fee_amount: fee * 100, // in cents
         // this seller can see his balance in our frontend dashboard
         transfer_data: {
            destination: item.postedBy.stripe_account_id,
         },
      },
      // success and cancel urls
      success_url: `${process.env.STRIPE_SUCCESS_URL}/${item._id}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
   });

   // 7 add this session object to user in the db
   await User.findByIdAndUpdate(req.user._id, {
      stripeSession: session,
   }).exec();
   // 8 send session id as response to frontend
   res.send({
      sessionId: session.id,
   });
};

export const stripeSuccess = async (req, res) => {
   try {
      // 1. get hotel id
      const { hotelId } = req.body;
      // 2. find currently logged in user
      const user = await User.findById(req.user._id).exec();
      // Check if user has stripeSession
      if(!user.stripeSession) return;
      // 3. retrieve stripe session, based on session id we previously save in user db
      const session = await stripe.checkout.sessions.retrieve(
         user.stripeSession.id,
      );
      // 4. if session payment status is paid, create order
      if (session.payment_status === 'paid') {
         // 5. check if order with that session id already exist by querying orders collection
         const orderExist = await Order.findOne({
            'session.id': session.id,
         }).exec();
         if (orderExist) {
            // 6. if order exist, send success true
            res.json({ success: true });
         } else {
            // 7. else create new order and send success true
            const newOrder = await new Order({
               hotel: hotelId,
               session,
               orderedBy: user._id,
            }).save();
            // 8. remove user´s stripeSession
            await User.findByIdAndUpdate(user._id, {
               $set: { stripeSession: {} },
            });

            res.json({ success: true });
         }
      }
   } catch (error) {
      console.log('STRIPE SUCCESS ERR ', error);
   }
};
