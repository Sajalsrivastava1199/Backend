import multer from 'multer';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp') // Specify the destination directory for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name for the uploaded file
  }
})

export const upload = multer({
     storage,
    })


// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// // Resolve __dirname equivalent in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ Correct path to 'public/temp' folder
// const uploadPath = path.join(__dirname, '../public/temp');

// // ✅ Create folder if it doesn't exist
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadPath); // ✅ Corrected path
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname); // Keep original name
//   }
// });

// export const upload = multer({ storage });
