import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { lowercase } from "zod";
import { tr } from "zod/v4/locales";

const userSchema =new mongoose.Schema(
    {
        name:{type: String , required :true,trim :true},
        email:{type: String ,required: true, unique:true,lowercase:true,trim:true},
        password:{type:String,required:true,minlength:8},
        phone:{type:String,trim:true,default:""},
        address:{type:String,trim:true,default:""},
        provider:{type:String, enum:["local","google","facebook"],default:"local"},
        providerId:{type:String,trim:true},
        role:{type:String, enum:["user","admin"],default:"user"},
        wishlist:[{type:mongoose.Schema.Types.ObjectId,ref:"product"}],
        cart: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: { type: Number, default: 1 },
        },
        ],
    },
    { timestamps: true }
);
export default mongoose.model("User", userSchema);