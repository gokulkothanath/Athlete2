const mongoose=require('mongoose');
const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    description:{
        type:String,
        required:true,
        trim:true
    },
    is_Active:{
        type:Boolean,
        default:true
    }
})
const category=mongoose.model('category',categorySchema)
module.exports=category 