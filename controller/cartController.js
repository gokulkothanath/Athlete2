const Cart=require('../model/cart');
const Product=require('../model/product');
const User=require('../model/user');
const Wish=require('../model/wishList');
const Coupon=require('../model/coupon')
const productOffer=require('../model/productOffer');
const categoryOffer=require('../model/categoryOffer');

const addTocart = async (req, res) => {
    try {  
        const productId = req.body.productId;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const proOffer = await productOffer.aggregate([
            {
              $match: {
                'productOffer.product': product._id,
                'productOffer.offerStatus': true,
                startingDate: { $lte: new Date() },
                endingDate: { $gte: new Date() }
              }
            },
            {
              $group: {
                _id: null,
                totalDiscount: { $sum: "$productOffer.discount" }
              }
            }
          ]);
          
          const proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;
          const catOffer = await categoryOffer.aggregate([
            {
              $match: {
                'categoryOffer.category': product.category,
                is_active: true,
                "categoryOffer.offerStatus": true,
                startingDate: { $lte: new Date() },
                endingDate: { $gte: new Date() },
              }
            },
            {
              $group: {
                _id: null,
                totalDiscount: { $sum: "$categoryOffer.discount" }
              }
            }
          ]);
          const catOfferDis = (catOffer.length > 0) ? catOffer[0].totalDiscount : 0;
         const discount=Math.round(100-((product.discountPrice/product.price)*100))
         const finalDiscount=(100-Math.max(catOfferDis,proOfferDiscount,discount))
        product.discountPrice=Math.round(product.price*finalDiscount/100)
        let userCart = await Cart.findOne({ owner: req.session.passport.user });
        if (!userCart) {
            userCart = new Cart({
                owner: req.session.passport.user,
                items: [],
            });
        }
        
        const existingCartItem = userCart.items.find(item => item.productId._id.toString() === productId);
    const qty=1
        if (existingCartItem) {
            if ((existingCartItem.quantity+1)< product.countInStock && (existingCartItem.quantity+1)< 5) {
                existingCartItem.quantity += 1;
                existingCartItem.price = existingCartItem.quantity * product.discountPrice;
            } else if (existingCartItem.quantity > product.countInStock) {
                return res.status(409).json({ message: 'Stock Limit Exceeded' });
            } else {
                return res.status(400).json({ message: 'Maximum quantity per person reached' });
            }
        } else {
            userCart.items.push({
                productId: productId,
                quantity: 1,
                price: product.discountPrice,
            });
        }
        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);
         await userCart.save();
         const wishlist= await Wish.updateOne({user:req.session.passport.user},{$pull:{product:productId}})
        return res.status(200).json({ message: 'added to cart' });
    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};
    const loadCart = async(req,res)=>{
        try {
            const userData = await User.findById(req.session.passport.user)
            const UserId = userData._id
            const userCart = await Cart.findOne({owner:UserId}).populate({path:'items.productId',model:'Product'})
          //  console.log(userCart,'gggggggggggggggggggggggggg');
            // userCart.items.forEach(async(item)=>{
            //     const proOffer = await productOffer.aggregate([
            //         {
            //           $match: {
            //             'productOffer.product': item.productId._id,
            //             'productOffer.offerStatus': true,
            //             startingDate: { $lte: new Date() },
            //             endingDate: { $gte: new Date() }
            //           }
            //         },
            //         {
            //           $group: {
            //             _id: null,
            //             totalDiscount: { $sum: "$productOffer.discount" }
            //           }
            //         }
            //       ]);
            //     //  console.log(proOffer,'proOffer');
            //       const proOfferDiscount = (proOffer.length > 0) ? proOffer[0].totalDiscount : 0;
            //     console.log(proOfferDiscount,'proOfferDis');
            
            //       const catOffer = await categoryOffer.aggregate([
            //         {
            //           $match: {
            //             'categoryOffer.category': item.productId.category,
            //             is_active: true,
            //             "categoryOffer.offerStatus": true,
            //             startingDate: { $lte: new Date() },
            //             endingDate: { $gte: new Date() },
            //           }
            //         },
            //         {
            //           $group: {
            //             _id: null,
            //             totalDiscount: { $sum: "$categoryOffer.discount" }
            //           }
            //         }
            //       ]);
            //     //  console.log(catOffer,'catOffer');
            
            //       const catOfferDis = (catOffer.length > 0) ? catOffer[0].totalDiscount : 0;

            //       console.log(catOfferDis,'catOfferDis');

            //      const discount=Math.round(100-((item.productId.discountPrice/item.productId.price)*100))
            //     // console.log(discount,'dddddddddddddddddddddd');
            //      const finalDiscount=(100-Math.max(catOfferDis,proOfferDiscount,discount))
            //     // console.log(finalDiscount,'fffffffffffff');
            //     item.price=item.price*finalDiscount/100
            // })
            // await userCart.save();
            const coupon=await Coupon.find({isActive:true});
            res.render('cart',{cart:userCart,coupon:coupon,user_id: req.session.passport});
        } catch (error) {
            console.log("Error while rendering the cart page",error.message)
        }
    }
    
    const increaseQuantity = async(req,res)=>{
        try {
            const {productId}=req.body;
            const userId= req.session.passport.user
            const cart = await Cart.findOne({owner:req.session.passport.user}).populate({path:'items.productId',model:'Product'})
            if(!cart){
                return res.status(404).json({message:"Cart not found"})
            }
            const item = cart.items.find(item=>item.productId._id.toString()===productId)
            if(!item){
                return res.status(404).json({
                    message:"product not found in the cart"
                })
            }
            if(item.quantity>=5){
                return res.status(404).json({message:"Maximum quantity reached"})
            }
            if(item.quantity +1 >item.productId.countInStock){
                return res.status(409).json({message:"Stock limit exceeded"})
            }
            item.price=item.price/item.quantity
            item.quantity +=1   
             item.price = item.quantity* item.price  
             cart.billTotal = cart.items.reduce((total,item)=>total+item.price,0)
             await cart.save()
             return res.status(200).json({message:"quantity increased",cart}) 
        } catch (error) {
            console.log("Error while increasing the quantity",error.message)
        }
    }
    
    const decreaseQuantity = async(req,res)=>{
        try {
            const{productId}=req.body
            const userId=req.session.passport.user
    
            const cart = await Cart.findOne({owner:userId}).populate({path:'items.productId',model:"Product"})
    
            if(!cart){
                return res.status(404).json({message:"Cart not found"})
            }
    
            const item = cart.items.find(item=>item.productId._id.toString()===productId)
    
            if(!item){
                return res.status(404).json({message:"Product not in cart"})
            }
    
            //decrease the quantity by 1 if its greater than 1
    
            if(item.quantity>1){
                item.price=item.price/item.quantity
                item.quantity-=1
                //recalculate the price 
                item.price=item.quantity*item.price;
            }else{
                return res.status(404).json({message:"Minimum quantity reached"})
            }
            // update the billTotal
            cart.billTotal=cart.items.reduce((total,item)=>total+item.price,0)
            await cart.save()
            return res.status(200).json({message:"quantity decreased",cart})
        } catch (error) {
            console.log("Error while decreasing the quantity of the items",error.message)
        }
    }
    
    const deleteItem = async(req,res)=>{
        try {
            const {productId}= req.body
            const userId= req.session.passport.user
    
            const userCart = await Cart.findOne({owner:userId})
    
            if(!userCart){
                return res.status(404).json({message:"Cart not found"})
            }
    
             // Find if the product exists in the cart
             const existingCartItemIndex = userCart.items.findIndex(item=>item.productId._id.toString()===productId)
    
             if(existingCartItemIndex > -1){
                userCart.items.splice(existingCartItemIndex,1)
    
                //recalculate the BillTotal 
    
                userCart.billTotal=userCart.items.reduce((total,item)=>{
                    let itemPrice = Number(item.price)
    
                    let itemQuantity = Number(item.quantity)
    
                    let itemTotal = itemPrice* itemQuantity
    
                    return total + (isNaN(itemTotal)? 0 : itemTotal)
                },0);
    
                await userCart.save()
                return res.status(200).json({success:true, message:"Item removed from cart"})
             }
             else{
                return res.status(404).json({message:"Item not found in the cart"})
             }
    
        } catch (error) {
            res.status(500).json({message:"Internal server Error"})
        }
    }
    
        
    
module.exports={
    addTocart,
    loadCart,
    increaseQuantity,
    decreaseQuantity,
    deleteItem
}
