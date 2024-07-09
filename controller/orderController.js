const Cart = require('../model/cart')
const Product = require('../model/product')
const Address = require('../model/address')
const User = require('../model/user')
const Order = require('../model/order');
const randomstring = require("randomstring");
const Payment=require('../controller/paymentController');
const Coupon=require('../model/coupon');
const walletPay=require('../controller/walletController');
const walletModel = require('../model/wallet');

const loadcheckout = async(req,res)=>{
    try {
        let address = await Address.findOne({user:req.session.passport.user}) || null

        const cart = await Cart.findOne({owner:req.session.passport.user}).populate({path:'items.productId',model:'Product'}) || null
         const wallet=await walletModel.findOne({user:req.session.passport.user})
        const user = await User.findById(req.session.passport.user)
    if(!cart||!cart.items.length){
        res.status(400).json('no items in the cart')
    }

        res.render('checkout',{user,address,cart,user_id: req.session.passport,wallet})
    }catch (error) {
       console.log("Error while loading checkout page",error.message)
       return res.status(500).json({message:"Internal server error"})
    }
}
async function generateUniqueOrderID(){
    const randomPart= randomstring.generate({
        length:6,
        charset:'numeric'
    })

    const currentDate = new Date()

    const datePart = currentDate.toISOString().slice(0,10).replace(/-/g,"");

    const orderID = `ID_${randomPart}${datePart}`

    return orderID
}
 async function paymentCheck(body,id,amount){
    if(body.response!=null){
    
        const isValid=Payment.verifySignature(body.response.razorpay_order_id,body.response.razorpay_payment_id,body.response.razorpay_signature)

        if(isValid){
       return {paymentOption:'Razorpay',
         address:body.data.addressType}
        }
        else{
            return  {paymentOption: null,
            address:null}
        }
    }else if(body.error!=null){
       return {paymentOption:'Razorpay-Failed',
         address:body.data.addressType}
        }
    else{
         if(body.paymentOption==='WALLET'){
        const isValid= await walletPay.walletPay(amount,id)
            if(isValid===true){
                return {paymentOption:body.paymentOption,
                    address:body.addressType}
            }
            else{
                return {paymentOption: null,
                    address:null}
            }
        
      }
       else if(body.paymentOption==='COD'){
        return {paymentOption:body.paymentOption,
            address:body.addressType}
       }
    }
}
const PostCheckout = async(req,res)=>{
    try {
        const id=req.session.passport.user
        const cart = await Cart.findOne({owner:id}).populate({path:'items.productId',model:'Product'})

        if(!cart){
            return res.status(400).json({message:"Cart not found"})
        }
        const amount=cart.billTotal;
        const {paymentOption,address}= await paymentCheck(req.body,id,amount);

       if(paymentOption==null){
            return res.status(400).json({message:'payment error'});
        }
        if(!address){
            return res.status(400)
        }

        const user = await User.findById(id)

        

        const orderAddress = await Address.findOne({user:user._id})
        if(!orderAddress){
            return res.status(400).json({message:"Address not found"})
        }

        const addressdetails = orderAddress.addresses.find((item)=>item.addressType===address)

        if(!addressdetails){
            return res.status(400).json({
                
                message:"Invalid address ID"
            })
        }

        const selectedItems = cart.items

        for(const item of selectedItems){
            const product = await Product.findOne({_id:item.productId})

            if(product.countInStock===0){
                return res.status(400).json({
                    message:"product out of stock"
                })
            }

            if(product.countInStock>=item.quantity){
                product.countInStock-=item.quantity

                await product.save()
            }else{

                console.log("Product not found")
            }
        }

        const order_id = await generateUniqueOrderID()

        const orderData = new Order({
            user:user._id,
            cart:cart._id,
            billTotal:cart.billTotal, 
            oId:order_id,
            paymentStatus:"Success",
            paymentMethod:paymentOption,
            deliveryAddress:addressdetails,
            coupon:cart.coupon,
            discountPrice:cart.discountPrice
        });

        for(const item of selectedItems){
            orderData.items.push({
                productId:item.productId._id,
                image:item.productId.images[0],
                name:item.productId.name,
                productPrice:item.productId.price,
                quantity:item.quantity,
                price:item.price
            })
        }
        await orderData.save();
        if(paymentOption=='WALLET'){
            const wallet=await walletModel.findOne({user:id})
            wallet.orders.push(orderData._id);
            await wallet.save();
         }

        if(cart.isApplied){
            const coup=cart.coupon;
            await Coupon.updateOne({code:coup},{$push:{usersUsed:user._id},$inc:{
             maxUsers:-1
            }})
            cart.isApplied=false
            cart.coupon=null
            await cart.save()
         }

         if(paymentOption==='Razorpay-Failed'){
            orderData.paymentStatus='Pending'
         }
         await orderData.save();
 
         cart.items = []
         await cart.save()
        res.status(200).json({order_id})

    }   catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

const loadorderconfirmed = async(req,res)=>{
    try {
        const orderId = req.query.id;
        const order = await Order.findOne({oId:orderId})
        if(!order){
            return res.status(404).json({message:"No order found"})
        }
        res.render("orderconfirm",{user_id: req.session.passport,order:order})
    } catch (error) {
        console.log("Error retreiving order details",error.message)
    }
}

const loadorderdetails = async(req,res)=>{
    try {
        const orderId= req.query.id
        const order = await Order.findOne({_id:orderId})
        res.render('orderDetails',{order,user_id: req.session.passport})
    } catch (error) {
        console.log("Error while loading order details",error.message)
    }
}

const returnOrder = async(req,res)=>{
    try {
        const{reason,oId}= req.body
        if(!reason || !oId){
            return res.status(400).json({success:false,error:"Reason and orderId are required"})
        }
        
        const order = await Order.findOne({oId})

        if(!order){
            return res.status(404).json({success:false,error:"Order not found"})
        }

        const newRequest = {
            type:"Return",
            status:"Pending",
            reason:reason
        };

        order.requests.push(newRequest)
        await order.save()

        res.json({success:true,message:"Order canceled successfully"})
    } catch (error) {
        console.log("Error while cancelling the order",Error.message)
    }
}
const cancelOrder = async(req,res)=>{
    try {
        const{oId}= req.body
        const order = await Order.findOne({oId})
        if(!order){
            return res.status(404).json({success:false,error:"Order not found"})
        }
        const userId=order.user
        for (let orderItem of order.items) {
            let product = await Product.findById(orderItem.productId).exec();
            if (product) {
              product.countInStock += Number(orderItem.quantity);
              await product.save();
            }
          }
          if(order.paymentMethod==='Razorpay'||order.paymentMethod==='WALLET'){
            let wallet=await walletModel.findOne({user:userId});
            if(!wallet){
               wallet=new walletModel({
                user:userId,
                amount:0,
                orders:[]
              });
            }
              wallet.amount+=order.billTotal;
              if(order.paymentMethod=='Razorpay'){
                wallet.orders.push(order._id);
              }
              await wallet.save()
            
           }
           order.status='Canceled'
        await order.save()
        res.json({success:true,message:"Order canceled successfully"})
       } catch (error) {
        console.log("Error while cancelling the order",Error.message)
    }
}

const loadInvoice=async(req,res)=>{
    try {
      const id=req.query.id;
      console.log("in loadinvoice page:",id);

      const invoiceId = `MWS-2024-${Math.floor(100000 + Math.random() * 900000)}`;

      const findOrder=await Order.findById({_id:id})
      const proId = [];

      var user = await User.findOne({_id:findOrder.user});
  
      for (let i = 0; i < findOrder.items.length; i++) {
        proId.push(findOrder.items[i].productId);
      }
      const proData = [];
  
      for (let i = 0; i < proId.length; i++) {
        proData.push(await Product.findById({ _id: proId[i] }));
      }

      const date = new Date().toDateString();
      res.render("invoice",{proData, findOrder,user,invoiceId,date});
      
    } catch (error) {
      console.log(error.message)
    }
}

const repayment=async(req,res)=>{
    try {
        const id=req.body.id
        const isValid=Payment.verifySignature(req.body.response.razorpay_order_id,req.body.response.razorpay_payment_id,req.body.response.razorpay_signature)
        if(isValid){
        await Order.findByIdAndUpdate(id,{$set:{paymentMethod:'Razorpay',paymentStatus:'Success'}});
        return res.status(200).json({message:'Payment updated'})
        }
        else{
            return res.status(400).json({message:'payment error'});
        }
    } catch (error) {
        return res.status(400).json({message:error});
    }
}
module.exports={
    loadcheckout,
    generateUniqueOrderID,
    PostCheckout,
    loadorderconfirmed,
    loadorderdetails,
    returnOrder,
    cancelOrder,
    loadInvoice,
    repayment  
}
