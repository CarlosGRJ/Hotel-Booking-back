const mongoose = require('mongoose');

export const dbConnection = async () => {
   try {
      await mongoose.connect(process.env.DATABASE, {
         useNewUrlParser: true,
         useFindAndModify: false,
         useUnifiedTopology: true,
         useCreateIndex: true,
      });

      console.log('DB Connected');
   } catch (err) {
      console.log('DB Connection Error: ', err);
      throw new Error('Error a la hora de iniciar la BD ver logs');
   }
};
