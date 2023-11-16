import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Please enter your name"],
    },
    email:{
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate: validator.isEmail,
    },
    password:{
        type:String,
        required: [true, "Please enter your password"],
        minLength: [6, "Password is not strong"],
        select: false  // agar user ko access karenge to by default password ni milega
    },
    role:{
        type: String,
        enum: ["admin", "user"], // ye do hi use ho sakte hai
        default: "user",
    },
    subscription:{
        id: String,
        status: String,
    },
    avatar:{
        public_id:{
            type: String,
            required: true
        },
        url:{
            type: String,
            required: true
        },
    },
    playlist:[
        {
            course:{
                type: mongoose.Schema.Types.ObjectId,      // isme id aayegi , aur iska ref "COURSE" hai to use course ke model mei dhundega
                ref: "Course",
            },
            poster: String,
        },
    ],
    createdAt:{
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: String,
});

//save karne se pehle
schema.pre("save", async function (next){

    //if password is not changed and profile is updated then don't hash the password again
    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcrypt.hash(this.password,10);
    next();
});

//generating the token
schema.methods.getJWTToken = function (){
    return jwt.sign({_id:this._id}, process.env.JWT_SECRET,{
        expiresIn: "15d",
    });
};

//comparing the password on logging in
schema.methods.comparePassword = async function (password){
    return await bcrypt.compare(password, this.password);
};


//reset token
schema.methods.getResetToken = function(){

    //using crypto
    const resetToken = crypto.randomBytes(20).toString("hex");

    //before sending token we will hash it
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
};

export const User = mongoose.model("User",schema);

