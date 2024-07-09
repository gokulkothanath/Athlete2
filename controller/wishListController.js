const User=require('../model/user');
const Product=require('../model/product');
const wishList=require('../model/wishList');


const addToWish=async(req,res)=>{
    try {
        const product_id=req.body.productId;
    const user_id=req.session.passport.user;
    let wishlist= await wishList.findOne({user:user_id})
    if(!wishlist){
     wishlist=new wishList({
        user:user_id,
        product:[product_id]
     })
    }
    else{
      const match=wishlist.product.find((id)=>id==product_id)
      if(match){
          res.status(400).send('product already in wishlist')
      }
      else{
        wishlist.product.push(product_id)
      }
    }
    await wishlist.save();
    res.status(200).send('product added to whish list');
    } catch (error) {
      console.log(error);  
    } 
}
const loadWish=async(req,res)=>{
    try {
      const id=req.session.passport.user;
      let wish=await wishList.findOne({user:id}).populate({path:'product',model:'Product'});
      if(!wish){
        wish=null
      } 
      res.render('wishList',{wish,user_id: req.session.passport});
    } catch (error) {
       console.log(error); 
    }
}
const deleteWish=async(req,res)=>{
  try {
    const product_id=req.body.productId;
     await wishList.updateOne({user:req.session.passport.user},{$pull:{product:product_id}})
  res.status(200).json({success:true})
  } catch (error) {
    res.status(400).json('internal error')
  }
}

module.exports={
    addToWish,
    loadWish,
    deleteWish
}