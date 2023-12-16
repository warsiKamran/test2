import { catchAsyncError } from "../middlewares/catachAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Stats } from "../models/Stats.js";


export const contact = catchAsyncError(async (req,res,next) => {

    const {name, email, message} = req.body;

    if(!name || !email || !message){
        return next(new ErrorHandler("Please enter all the fields", 400));
    }

    const to = process.env.MY_MAIL;
    const subject = "Contact from Coursebundler";
    const text = `Iam ${name} and my email is${email}. \n
    ${message}`;

    await sendEmail(to,subject,text);

    res.status(200).json({
        success: true,
        message: "Your request has been sent."
    })
});

export const courseRequest = catchAsyncError(async (req,res,next) => {

    const {name, email, course} = req.body;

    if(!name || !email || !course){
        return next(new ErrorHandler("Please enter all the fields", 400));
    }

    const to = process.env.MY_MAIL;
    const subject = "Requesting for a course on CourseBundler";
    const text = `Iam ${name} and my email is${email}. \n
    ${course}`;

    await sendEmail(to,subject,text);

    res.status(200).json({
        success: true,
        message: "Your request has been sent"
    })
});


export const getDashboardStats = catchAsyncError(async (req,res,next) => {

    const stats = await Stats.find({}).sort({createdAt: "desc"}).limit(12);   // last ke 12 milenge

    const statsData = [];

    for(let i=0; i<stats.length; i++){
        statsData.unshift(stats[i]);
    }

    const reqSize = 12 - stats.length;

    for(let i=0; i<reqSize; i++){
        statsData.unshift({
            users: 0,
            subscription: 0,
            views: 0,
        });
    }

    //profit or not ?
    let usersProfit = true;
    let viewsProfit = true;
    let subProfit = true;

    let usersPercentage = 0;
    let viewsPercentage = 0;
    let subPercentage = 0;

    // getting total count
    const usersCount = statsData[11].users;
    const viewsCount = statsData[11].views;
    const subCount = statsData[11].subscription;

    // if users of 11 month is 0 then no need to divide for finding out profit , bcz it will be infinity
    if(statsData[10].views === 0){
        viewsPercentage = viewsCount * 100;
    }

    if(statsData[10].subscription === 0){
        subPercentage = subCount * 100;
    }

    if(statsData[10].users === 0){
        usersPercentage = usersCount * 100;
    }

    // let's say statsData[11] = 20 and statsData[10] = 15  then difference 20 -15 = 5
    else{
        const difference = {
            users: statsData[11].users - statsData[10].users,
            views: statsData[11].views - statsData[10].views,
            subscription: statsData[11].subscription - statsData[10].subscription,
        };

        usersPercentage = (difference.users / statsData[10].users) * 100;
        viewsPercentage = (difference.views / statsData[10].views) * 100;
        subPercentage = (difference.subscription / statsData[10].subscription) * 100;

        //if difference is negative then it will be loss
        if(usersPercentage < 0) usersProfit = false;
        if(viewsPercentage < 0) viewsProfit = false;
        if(subPercentage < 0) subProfit = false;
    }

    res.status(200).json({
        success: true,
        stats: statsData,
        usersCount,
        viewsCount,
        subCount,
        usersPercentage,
        viewsPercentage,
        subPercentage,
        usersProfit,
        viewsProfit,
        subProfit,
    });
});

