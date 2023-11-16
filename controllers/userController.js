import {catchAsyncError} from "../middlewares/catachAsyncError.js"
import { User } from "../models/User.js";
import { Course } from "../models/Course.js"
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import cloudinary from "cloudinary";
import getDataUri from "../utils/dataUri.js"
import { Stats } from "../models/Stats.js";

//signup
export const register = catchAsyncError(async(req,res,next)=>{

    const {name,email,password} = req.body;
    const file = req.file;    

    if(!name || !email || !password || !file){
        return next(new ErrorHandler("Please enter all the fields",400));
    }

    let user = await User.findOne({email});
    
    if(user){
        return next(new ErrorHandler("User already exists",409));
    }

    //upload file on cloudinary
    //avatar
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    user = await User.create({
        name,
        email,
        password,   
        avatar:{
            public_id:myCloud.public_id,
            url:myCloud.secure_url
        },
    });

    sendToken(res,user,"SignedUp successfully",201);
});


//login
export const login = catchAsyncError(async(req,res,next)=>{

    const {email,password} = req.body;

    if(!email || !password){
        return next(new ErrorHandler("Please enter all the fields",400));
    }

    const user = await User.findOne({email}).select("+password");
    
    if(!user){
        return next(new ErrorHandler("User doesn't exist",409));
    }

    const isMatch = await user.comparePassword(password);

    if(!isMatch){
        return next(new ErrorHandler("Invalid email or password"),401);
    }

    sendToken(res,user,`Welcome back ${user.name}`,200);
});


//logout
export const logout = catchAsyncError(async(req,res,next)=>{

    res.status(200).cookie("token",null,{
        expires: new Date(Date.now()),
    }).json({
        success: true,
        message: "Logged out successfully",
    });
});


//get my profile
export const getMyProfile = catchAsyncError(async(req,res,next)=>{

    const user = await User.findById(req.user._id);         //if user is logged in then automatically it will recieve the id from mongodb

    res.json({
        success: true,
        user,
    });
});


//change password
export const changePassword = catchAsyncError(async(req,res,next)=>{

    const {oldPassword, newPassword} = req.body;

    if(!oldPassword || !newPassword){
        return next(new ErrorHandler("Please enter all the fields", 400));
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(oldPassword);

    if(!isMatch){
        return next(new ErrorHandler("Incorrect old password", 400));
    }

    user.password = newPassword;

    await user.save();

    res.json({
        success: true,
        message: "Password updated successfully",
    });
});


//update profile
export const updateProfile = catchAsyncError(async(req,res,next)=>{

    const {name, email} = req.body;

    const user = await User.findById(req.user._id);

    if(name){
        user.name = name;
    }

    if(email){
        user.email = email;
    }
    
    await user.save();

    res.json({
        success: true,
        message: "Profile updated successfully",
    });
});


//update profile picture
export const updateProfilePicture = catchAsyncError(async(req,res,next)=>{

    const user = await User.findById(req.user._id);

    //cloudinary
    const file = req.file;    
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.v2.uploader.upload(fileUri.content);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
    })
});


//forget password
export const forgetPassword = catchAsyncError(async(req,res,next)=>{

    const {email} = req.body;

    const user = await User.findOne({email});

    if(!user){
        return next(new ErrorHandler("User not found", 400));
    }

    const resetToken = await user.getResetToken();
    
    await user.save();

    //send token via email
    //on extracting the tokens via params or any other method we will again check it in resetPassword function to validate it

    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const message = `click on the link to reset your password. ${url}. If you have not requested then please ignore.`

    await sendEmail(user.email, "New Password", message);
    
    res.status(200).json({
        success: true,
        message: `To update you password check ${user.email}`,
    });
});



//reset password
export const resetPassword = catchAsyncError(async(req,res,next)=>{

    const {token} = req.params;

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now(),
        },
    });

    if(!user){
        return next(new ErrorHandler("Token is invalid or has been expired", 401));
    }

    user.password = req.body.password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password updated successfully",
    })
});


//add to playlist
export const addToPlaylist = catchAsyncError(async(req,res,next) =>{

    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.body.id);

    if(!course){
        return next(new ErrorHandler("Invalid course id",404));
    }

    const itemExist = user.playlist.find((item) => {
        if(item.course.toString() === course._id.toString()){
            return true;
        }
    });

    if(itemExist){
        return next(new ErrorHandler("Course already exists", 409));
    }

    user.playlist.push({
        course: course._id,
        poster: course.poster.url,
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: "Course added in playlist successfully",
    });
});



// remove from playlist
export const removeFromPlaylist = catchAsyncError(async(req,res,next) =>{

    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.query.id);

    if(!course){
        return next(new ErrorHandler("Invalid course id",404));
    }

    //it will return an array
    const newPlaylist = user.playlist.filter((item) => {
        if(item.course.toString() !== course._id.toString()){
            return item;
        }
    })

    user.playlist = newPlaylist;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Course removed from playlist successfully",
    });
});



/* ADMIN */

//get all users
export const getAllUsers = catchAsyncError(async(req,res,next) =>{

    const users = await User.find({});

    res.status(200).json({
        success: true,
        users
    })
});


//update user role
export const updateUserRole = catchAsyncError(async(req,res,next) =>{

    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    if(user.role === "user"){
        user.role = "admin";
    } 
    else{
        user.role = "user";
    }

    await user.save();

    res.status(200).json({
        success: true,
        message: "Role updated successfully"
    })
});


//delete user
export const deleteUser = catchAsyncError(async(req,res,next) =>{

    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    //cancel subscription

    await user.remove();

    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});


//delete profile
export const deleteProfile = catchAsyncError(async(req,res,next) =>{

    const user = await User.findById(req.user._id);

    //cancel subscription

    await user.remove();

    res.status(200).cookie("token",null,{
        expires: new Date(Date.now())
    }).json({
        success: true,
        message: "Profile deleted successfully"
    });
});


User.watch().on("change", async() => {

    const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);
    const subscription = await User.find({"subscription.status":"active"});

    stats[0].users = await User.countDocuments();
    stats[0].subscription = subscription.length;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
});

