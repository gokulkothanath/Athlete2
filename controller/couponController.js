const Coupon = require("../model/coupon")
const Cart = require("../model/cart")

const loadCoupon = async(req,res)=>{
    try {
        const coupon= await Coupon.find({})
        res.render("coupon",{coupon})
    } catch (error) {
        res.status(500).send({message:"Interal server Error"})
    }
}

const loadCreateCoupon = async(req,res)=>{
    try {
        res.render("addCoupon")
    } catch (error) {
        console.log("Error while rendering the Create coupon Page",error.message)
    }
}

const createCoupon = async(req,res)=>{
    try {
        const{
            name,
            code,
            description,
            discountPercentage,
            minPurchaseAmount,
            maxPurchaseAmount,
            expirationDate,
            maxUsers,
        }=req.body
        const couponCreate = new Coupon({
            name:name,
            code:code,
            description:description,
            minimumAmount:minPurchaseAmount,
            maximumAmount:maxPurchaseAmount,
            discountPercentage:discountPercentage,
            expirationDate:expirationDate,
            maxUsers:maxUsers

        })

        await couponCreate.save()
        res.status(200).send({success:true,message:"Coupon created successfully"})

    } catch (error) {
        console.log("Error while creating the coupon",error.message)
    }
}
const toggleCoupon = async(req,res)=>{
    try {
        const {couponId,isActive}=req.body
        const updateCoupon =await Coupon.findByIdAndUpdate(couponId,{isActive:isActive})
        updateCoupon.save()
        res.status(200).json({success:true,message:"Coupon status toggled successfully."})
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to toggle coupon status." });
    }
}

const applyCoupon = async(req,res)=>{
    try {
        const userCart = await Cart.findOne({owner:req.session.passport.user})
        let couponCode=req.body.coupon
        if(!userCart || !userCart.items.length){
             res.status(400).json({success:false,message:"Your cart is empty and cannot add Coupon"})
        }
        if(userCart.isApplied===true){
             res.status(400).json({success:false,message:"A coupon is already applied to you Cart"})
        }
        const coupon = await Coupon.findOne({code:couponCode,isActive:true})
        const userId =(req.session.passport.user).toString()
        const match = coupon.usersUsed.some((id)=>id.toString()===userId)
        if(!coupon || match){
             res.status(400).json({success:false,message:"Coupon not found or Already Used"})
        }
        if(userCart.billTotal<coupon.minimumAmount){
            res.status(400).json({success:false,message:"You are not eligible for this CouponCode"})
        }
        const discountAmount = userCart.billTotal*(coupon.discountPercentage/100)
        userCart.discountPrice=userCart.billTotal-discountAmount
        userCart.billTotal=userCart.billTotal-discountAmount
        userCart.coupon=couponCode,
        userCart.isApplied=true,

        await userCart.save()
        res.status(200).json({success:true,newTotal:userCart.discountPrice,appliedCoupon:couponCode,message:"Coupon applied Successfully"})
    } catch (error) {
        console.log("Error while applying the coupon",error.message)
    }
}


const removeCoupon = async(req,res)=>{
    try {
        let couponCode=req.body.coupon
        couponCode=couponCode.trim()
        const userCart = await Cart.findOne({owner:req.session.passport.user})
        if (!userCart || !userCart.isApplied) {
            return res.status(400).send({ message: "No coupon is applied to your cart." });
        }
        const coupon = await Coupon.findOne({code:couponCode})
        if(coupon){
            userCart.isApplied=false,
            userCart.billTotal=userCart.discountPrice/(1-(coupon.discountPercentage/100))
            userCart.coupon=null
            userCart.discountPrice=0
            await userCart.save()
          return  res.status(200).json({success:true,message:"Removed Coupon Successfully"})

        }
        else{
            return res.status(400).send({ message: "error removing coupon" });
        }
    } catch (error) {
        return res.status(400).send({ message:error });
    }
}
module.exports={
    loadCoupon,
    loadCreateCoupon,
    createCoupon,
    toggleCoupon,
    applyCoupon,
    removeCoupon
}