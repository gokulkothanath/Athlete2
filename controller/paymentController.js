const Cart=require('../model/cart');
const Order=require('../model/order');
const crypto=require('crypto');
const Razorpay=require('razorpay');
const {key_id,key_secret}=process.env

async function getAmount(body,id){
    if(body.id){
        const reOrder= await Order.findById(body.id)
        return amount=reOrder.billTotal*100
    }else{
        const cart=await Cart.findOne({owner:id})
        return amount=cart.billTotal*100
    }
}

var instance = new Razorpay({
    key_id: key_id,
    key_secret: key_secret,
  });
 
  const createOrder = async(req,res)=>{
    try {  

        const id=req.session.passport.user;
       
        const amount= await getAmount(req.body,id)
    
        const options = {
            amount: amount,
            currency: 'INR',
            receipt:'',
            notes:''
        }

        instance.orders.create(options, 
            async(err, order)=>{
                if(!err){
                    res.status(200).send({
                        success:true,
                        msg:'Order Created',
                        order_id:order.id,
                        amount:amount
                    });
                }
                else{
                    res.status(400).send({success:false,msg:'Something went wrong!'});
                }
            }
        );

    } catch (error) {
        console.log(error.message);
    }
}

function verifySignature(orderId, paymentId, razorpaySignature) {
    const message = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256',key_secret)
      .update(message)
      .digest('hex');
  
    return generatedSignature === razorpaySignature;
  }
  
module.exports={
    createOrder,
    verifySignature
}