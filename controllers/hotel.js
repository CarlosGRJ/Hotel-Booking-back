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
