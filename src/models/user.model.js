import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { lowercase } from "zod";
import { tr } from "zod/v4/locales";

const userSchema =new mongoose.Schema(
    {
        name:{type: String , required :true,trim :true},
        email:{type: String ,required: true, unique:true,lowercase:true,trim:true},
        password:{type:String,required:true,minlength:8},
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