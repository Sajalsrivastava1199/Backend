import {Router} from 'express';
import { loginuser,logoutUser,registerUser,refreshAccessToken } from '../controllers/user.controller.js'; // Import the registerUser controller
import {upload} from '../middlewares/multer.middleware.js'; // Import the upload utility if needed
import { verifyJWT } from '../middlewares/auth.middleware.js';
const router = Router();

router.route("/register").post(
    upload.fields([
        { name: 'avatar', maxCount: 1 }, // Upload avatar image
        { name: 'coverimage', maxCount: 1 } // Upload cover image
    ]),
    registerUser
); // Register a new user


router.route("/login").post(loginuser)

router.route("/logout").post(verifyJWT,logoutUser); // Logout a user

router.route("/refreshtoken").post(refreshAccessToken)

export default router;