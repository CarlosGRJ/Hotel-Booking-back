import Hotel from '../models/hotel';
import fs from 'fs';

export const create = async (req, res) => {
   try {
      const fields = req.fields;
      const files = req.files;

      const hotel = new Hotel(fields);
      hotel.postedBy = req.user._id;
      // handle image
      if (files.image) {
         hotel.image.data = fs.readFileSync(files.image.path);
         hotel.image.contentType = files.image.type;
      }

      hotel.save((err, result) => {
         if (err) {
            console.log('saving hotel err', err);
            res.status(400).send('Error saving');
         }

         res.json(result);
      });
   } catch (error) {
      console.log(error);
      res.status(400).json({
         err: error.message,
      });
   }
};

export const hotels = async (req, res) => {
   const all = await Hotel.find({})
      .limit(24)
      .select('-image.data')
      .populate('postedBy', '_id name')
      .exec();

   res.json(all);
};

export const image = async (req, res) => {
   const hotel = await Hotel.findById(req.params.hotelId).exec();
   if (hotel && hotel.image && hotel.image.data !== null) {
      res.set('Content-Type', hotel.image.contentType);
      return res.send(hotel.image.data);
   }
};

export const sellerHotels = async (req, res) => {
   const all = await Hotel.find({ postedBy: req.user._id })
      .select('-image.data')
      .populate('postedBy', '_id name')
      .exec();

   res.send(all);
};

export const remove = async (req, res) => {
   const removed = await Hotel.findByIdAndDelete(req.params.hotelId)
      .select('-image.data')
      .exec();
   res.json(removed);
};

export const read = async (req, res) => {
   const hotel = await Hotel.findById(req.params.hotelId)
      .select('-image.data')
      .exec();
   console.log('SINGLE HOTEL', hotel);
   res.json(hotel);
};

export const update = async (req, res) => {
   try {
      const fields = req.fields;
      const files = req.files;

      const data = { ...fields };
      console.log('data ', data);

      if (files.image) {
         let image = {};
         image.data = fs.readFileSync(files.image.path);
         image.contentType = files.image.type;

         data.image = image;
      }

      const updated = await Hotel.findByIdAndUpdate(req.params.hotelId, data, {
         new: true,
      }).select('-image.data');

      res.json(updated)
   } catch (error) {
      console.log(error);
      res.status(400).send('Hotel update failed. Try again.');
   }
};
