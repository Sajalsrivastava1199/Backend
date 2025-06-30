import {Router} from 'express';
import { registerUser } from '../controllers/user.controller.js'; // Import the registerUser controller

const router = Router();

router.route("/register").post(registerUser); // Register a new user

export default router;