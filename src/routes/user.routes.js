import {Router} from 'express';
import { registerUser } from '../controllers/user.controller.js'; // Import the registerUser controller
import {upload} from '../middlewares/multer.middleware.js'; // Import the upload utility if needed
const router = Router();

router.route("/register").post(
    upload.fields([
        { name: 'avatar', maxCount: 1 }, // Upload avatar image
        { name: 'coverimage', maxCount: 1 } // Upload cover image
    ]),
    registerUser
); // Register a new user

export default router;