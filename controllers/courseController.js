import { catchAsyncError } from "../middlewares/catachAsyncError.js"
import {Course} from "../models/Course.js"
import { Stats } from "../models/Stats.js";
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js"
import cloudinary from "cloudinary";


export const getAllCourses = catchAsyncError(async(req,res,next) =>{

    const keyword = req.query.keyword || "";
    const category = req.query.category || "";

    const courses = await Course.find({

        title: {
            $regex: keyword,
            $options: "i"              // case insensitive
        },

        category: {
            $regex: category,
            $options: "i"
        }
        
    }).select("-lectures");            // so that only subscribed people can see the lectures

    res.status(200).json({
        success: true,
        courses,
    });
});


//create a course
export const createCourse = catchAsyncError(async(req,res,next) =>{

    const {title, description, category, createdBy} = req.body;

    if(!title || !description || !category || !createdBy){
        return next(new ErrorHandler("Please enter all the fields",400));
    }

    const file = req.file;    //for the poster,  by this we will get the blob and to convert in URI we will use getDataURI

    const fileUri = getDataUri(file);

    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);
    
    await Course.create({
        title,
        description,
        category,
        createdBy,
        poster:{
            public_id: myCloud.public_id,        //we will get from cloudinary
            url: myCloud.secure_url,
        },
    });

    res.status(201).json({
        success: true,
        message: "Course created successfully",
    })
});


//get lectures
export const getCourseLectures = catchAsyncError(async(req,res,next) =>{

    const course = await Course.findById(req.params.id);
    
    if(!course){
        return next(new ErrorHandler("Course not found", 404));
    }

    course.views += 1;

    await course.save();

    res.status(200).json({
        success: true,
        lectures: course.lectures
    });
});


//add a lecture (max video size 100mb)
export const addLecture = catchAsyncError(async(req,res,next) =>{

    const {id} = req.params;

    const {title, description} = req.body;

    if(!title || !description){
        return next(new ErrorHandler("Enter all the fields",400));
    }

    const course = await Course.findById(id);
    
    if(!course){
        return next(new ErrorHandler("Course not found", 404));
    }

    // upload file here
    const file = req.file;    //for the poster,  by this we will get the blob and to convert in URI we will use getDataURI

    const fileUri = getDataUri(file);

    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content,{
        resource_type: "video",
    });

    course.lectures.push({
        title,
        description,
        video:{
            public_id: myCloud.public_id,
            url: myCloud.secure_url
        }
    });

    course.numOfVideos = course.lectures.length;     // agar 5 lectures hue hai to course.numOfVideos mei pehle se hi 5 aa jayega
    
    await course.save();

    res.status(200).json({
        success: true,
        message: "Lecture added in the course"
    });
});


//delete course
export const deleteCourse = catchAsyncError(async(req,res,next) =>{

    const {id} = req.params;

    const course = await Course.findById(id);

    if(!course){
        return next(new ErrorHandler("Course not found",404));
    }

    //deleting poster
    await cloudinary.v2.uploader.destroy(course.poster.public_id);

    //deleting the lecture
    for(let i=0; i<course.lectures.length; i++){

        const currCourse = course.lectures[i];
        
        await cloudinary.v2.uploader.destroy(currCourse.video.public_id,{
            resource_type:"video"
        });
    }
    
    await course.remove();

    res.status(200).json({
        success: true,
        message: "Course deleted successfully",
    });
});



//delete lecture
export const deleteLecture = catchAsyncError(async(req,res,next) =>{

    const {courseId, lectureId} = req.query;

    const course = await Course.findById(courseId);

    if(!course){
        return next(new ErrorHandler("Course not found",404));
    }

    //we will get the lecture
    const lecture = course.lectures.find((item) => {
        if(item._id.toString() == lectureId.toString()){
            return item;
        }
    })

    //removed from cloudinary
    await cloudinary.v2.uploader.destroy(lecture.video.public_id,{
        resource_type:"video"
    });

    //removed from array
    course.lectures = course.lectures.filter((item) => {
        if(item._id.toString() !== lectureId.toString()){
            return item;
        }
    })

    course.numOfVideos = course.lectures.length;

    await course.save();

    res.status(200).json({
        success: true,
        message: "Lecture deleted successfully",
    });
});


Course.watch().on("change", async() => {

    const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);
    const courses = await Course.find({});

    let totalViews = 0;

    for (let i = 0; i < courses.length; i++){
        totalViews += courses[i].views;
    }

    stats[0].views = totalViews;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
});

