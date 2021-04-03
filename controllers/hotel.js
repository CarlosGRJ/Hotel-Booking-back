import Hotel from '../models/hotel';
import fs from 'fs';

export const create = async (req, res) => {
   try {
      const fields = req.fields;
      const files = req.files;

      const hotel = new Hotel(fields);
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
