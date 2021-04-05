import express from 'express';
import formidable from 'express-formidable';

const router = express.Router();

// middleware
import { hotelOwner, requireSignin } from '../middlewares';

// controllers
import {
   create,
   hotels,
   image,
   remove,
   sellerHotels,
   read,
   update,
} from '../controllers/hotel';

router.post('/create-hotel', requireSignin, formidable(), create);
router.get('/hotels', hotels);
router.get('/hotel/image/:hotelId', image);
router.get('/hotel/:hotelId', read);
router.get('/seller-hotels', requireSignin, sellerHotels);
router.delete('/delete-hotel/:hotelId', requireSignin, hotelOwner, remove);
router.put(
   '/update-hotel/:hotelId',
   requireSignin,
   hotelOwner,
   formidable(),
   update
);

module.exports = router;
