const mongoose=require('mongoose');
const objectId=mongoose.Schema.ObjectId;


const walletSchema=mongoose.Schema({
    user:{
        type:objectId,
        ref:'users',
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    orders:[{
        type:objectId,
        ref:'orders'
    }]
})

const walletModel=mongoose.model('wallet',walletSchema);
module.exports=walletModel;