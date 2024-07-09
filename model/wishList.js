const mongoose=require('mongoose');

const ObjectId=mongoose.Schema.Types.ObjectId ;

const whishListSchema=new mongoose.Schema({
    user:{
        type:ObjectId,
        ref:'User',
        required:true
    },
    product:[{
        type:ObjectId,
        ref:'Products',
        required:true
    }]
})
const whishListModel=mongoose.model('WhishList',whishListSchema);
module.exports=whishListModel