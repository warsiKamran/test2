import express from "express"
import { addLecture, createCourse, getAllCourses, getCourseLectures, deleteCourse, deleteLecture } from "../controllers/courseController.js";
import singleUpload from "../middlewares/multer.js";
import {authorizeAdmin, isAuthenticated, authorizeSubscribers} from "../middlewares/isAuthenticated.js"

const router = express.Router();

// get all courses without lectures
router.route("/courses").get(getAllCourses);

// create new courses - admin only
router.route("/createcourse").post(isAuthenticated, authorizeAdmin, singleUpload, createCourse);

//get lectures and add lectures
router.route("/course/:id")
    .get(isAuthenticated, authorizeSubscribers, getCourseLectures)
    .post(isAuthenticated, authorizeAdmin, singleUpload, addLecture)
    .delete(isAuthenticated, authorizeAdmin, deleteCourse);

//delete lecture
router.route("/lecture").delete(isAuthenticated, authorizeAdmin, deleteLecture);

export default router;

