import express from "express"
import { 
    addToPlaylist,
    changePassword, 
    deleteProfile, 
    deleteUser, 
    forgetPassword, 
    getAllUsers, 
    getMyProfile, 
    login, 
    logout, 
    register, 
    removeFromPlaylist, 
    resetPassword, 
    updateProfile, 
    updateProfilePicture,
    updateUserRole,
} from "../controllers/userController.js";

import {authorizeAdmin, isAuthenticated} from "../middlewares/isAuthenticated.js"
import singleUpload from "../middlewares/multer.js";


const router = express.Router();

//registering the user
router.route("/register").post(singleUpload, register);

//login
router.route("/login").post(login);

//logout
router.route("/logout").get(logout);

//get my profile
router.route("/me").get(isAuthenticated, getMyProfile);

//delete my profile
router.route("/me").delete(isAuthenticated, deleteProfile);

//change password
router.route("/changepassword").put(isAuthenticated, changePassword);

//update profile
router.route("/updateprofile").put(singleUpload, isAuthenticated, updateProfile);

//update profile picture
router.route("/updateprofilepicture").put(isAuthenticated, updateProfilePicture);

//forget password
router.route("/forgetpassword").post(forgetPassword);

//reset password
router.route("/resetpassword/:token").put(resetPassword);

//add to playlist
router.route("/addtoplaylist").post(isAuthenticated, addToPlaylist);

//remove from playlist
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

/* ADMIN  */

//get all users
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);

//update user role
router
    .route("/admin/users/:id")
    .put(isAuthenticated, authorizeAdmin, updateUserRole)
    .delete(isAuthenticated, authorizeAdmin, deleteUser)

export default router;

