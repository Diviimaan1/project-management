import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    avatar : {
        type : {
            url : String,
            localPath : String,
        },
        default : {
            url : ``,
            localPath : ""
        }
    },
    username : {
        type : String,
        required : true,
        trim : true,
        unique : true,
        lowercase : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        trim : true,
        unique : true,
        lowercase : true
    },
    fullname : {
        type : String,
        trim : true
    },
    password : {
        type : String,
        required : [true, "Password is required"],
    },
    isEmailVerified : {
        type : Boolean,
        default : false,
    },
    refreshToken : {
        type: String
    },
    forgotPasswordToken : {
        type: String
    },
    forgotPasswordExpiry : {
        type : Date
    },
    emailVerificationToken : {
        type : String
    },
    emailVerificationExpiry : {
        type: Date
    }
},{
    timestamps : true,    
});

userSchema.pre("save",async function ( next ) {
    if(!this.isModified("password")) return this.next();
    this.password = await bcrypt.hash(this.password,10)
    next()
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password);
}

export const User = mongoose.model("User" , userSchema);