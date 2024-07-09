const mongoose=require('mongoose');
const bcrypt=require('bcrypt')

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
    
    },
    verified:{
        type:Boolean,
        default:false
    },
    blocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart:{
        type:Array
    },
    wishlist:{
        type:Array
    },
    wallet:{
        type:Number,
        default:0
    },
    history:{
        type:Array
    },
    address:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Address"
        }
    ]
})
userSchema.methods.verifyPassword=function(password){
              return bcrypt.compare(password,this.password)
}

module.exports=mongoose.model("User",userSchema);