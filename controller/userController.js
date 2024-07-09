const session = require('express-session')
const User=require('../model/user')
const bcrypt=require('bcrypt')
const Category = require('../model/category');
const Product = require('../model/product');
const otpSetup=require('../otp/verifyOtp')
const Address=require('../model/address');
const Order=require('../model/order');
const Wallet=require('../model/wallet');
const user = require('../model/user');
const productOffer=require('../model/productOffer');
const categoryOffer=require('../model/categoryOffer');
const Review=require('../model/review');
const passwordHashing=async(password)=>{
    try{
        const passwordHash=await bcrypt.hash(password,10)
        return passwordHash
    }
    catch(err){
      if(err) console.log(err)
    }
}
const insertUser= async(req,res)=>{
     try{
      const email = req.body.email;
      const exists=await User.findOne({email:email});
      if(exists){
        res.render('login',{message:'User already exists'})
      }
      else{
        const hashPassword= await passwordHashing(req.body.password)


        const user={
            name:req.body.name,
            mobile:req.body.mobile,
            email:email,
            password:hashPassword,     
        }
        req.session.user=user;
      
        const {otp,timeStamp}=otpSetup.generateOTP();
 req.session.email={otp:otp,time:timeStamp,email:email};
 const send=await otpSetup.sendOtp(email,otp)
res.render('otp')
     }
    }
     catch(err){
      if(err) console.log(err);
     }
}
const resendOtp = async (req, res) => {
  try {
    const email=req.session.email.email
      const {otp,timeStamp} =otpSetup.generateOTP();
      req.session.email={otp:otp,time:timeStamp,email:email};
      const send=await otpSetup.sendOtp(email,otp)
          res.status(200).json({
              status: true
            })          
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({
      status: false,
      message: 'Error resending OTP'
   });}};

const verifyOtp=async(req,res)=>{
  try{
  const otp=req.body.otp;
  if(req.session.email.otp==otp){
    const currentTime=Date.now()
    const otpTime=req.session.email.time
    const timeGap=(currentTime-otpTime)/1000
    if(timeGap<60){
      const user=new User(req.session.user)
      
      user.verified=true
     await user.save();
     req.session.destroy()
     res.render('login',{message:'mail verified please login again'})
    }
    else{
      res.render('signUp',{message:'Time expired Try again'});
    }
  }
  else{
    res.render('otp',{message:'wrong otp'});
  }
}catch(err){
  res.render('signUp',{message:'Something went wrong try again'});
}
}

const loadsignUp=async(req,res)=>{
try{
  return  res.render('signUp')
}
catch(err){
  if(err) console.log(err);
}
}

const loadShop = async (req, res) => {
  try {
      let query = { is_deleted: false };
      let andConditions = [{ is_deleted: false }];

      if (req.query.q) {
          const searchQuery = req.query.q;
          const searchCondition = {
              $or: [
                  { brand: { $regex: searchQuery, $options: 'i' } },
                  { description: { $regex: searchQuery, $options: 'i' } },
                  { name: { $regex: searchQuery, $options: 'i' } }
              ]
          };
          andConditions.push(searchCondition);
      }

      if (req.query.category) {
          andConditions.push({ category: req.query.category });
      }

      if (req.query.brand) {
          andConditions.push({ brand: req.query.brand });
      }

      if (andConditions.length > 1) {
          query = { $and: andConditions };
      }

      let sortOption = {};
      switch (req.query.sort) {
          case 'priceAsc':
              sortOption = { price: 1 };
              break;
          case 'priceDsc':
              sortOption = { price: -1 };
              break;
          case 'nameAsc':
              sortOption = { name: 1 };
              break;
          case 'nameDsc':
              sortOption = { name: -1 };
              break;
          default:
              sortOption = { name: 1 };
      }

      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;
      const totalProd = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProd / limit);
      let filteredProducts = await Product.find(query)
          .populate('category')
          .skip(skip)
          .limit(limit)
          .sort(sortOption);
      const categories = await Category.find({ is_Active: true });
      const priceRanges = [
          { min: 0, max: 50, label: 'Rs0.00 - Rs50.00' },
          { min: 50, max: 100, label: 'Rs50.00 - Rs100.00' },
          { min: 100, max: 150, label: 'Rs100.00 - Rs150.00' },
          { min: 150, max: 200, label: 'Rs150.00 - Rs200.00' },
          { min: 200, max: 250, label: 'Rs200.00 - Rs250.00' }
      ];
      res.render('shop1', {
          sortOption: req.query.sort,
          user_id: req.session.passport,
          product: filteredProducts,
          category: categories,
          priceRanges: priceRanges,
          query: req.query,
          currentPage: page,
          totalPages: totalPages
      });
  } catch (error) {
      res.status(500).json({ success: false, message: error });
  }
};
const loadLogin=async(req,res)=>{
  try{
    return  res.render('login')
  }
  catch(err){
    if(err) console.log(err);
  }
  }
  const loadIndex = async (req, res) => {
            try {
               let id=req.query.id?req.query.id:'6629fa1e488a749f867bbb60'
                const allCate = await Category.find({is_Active:true});              
                if (allCate) {
                  const ProductDetails = await Product.find({ category:id});
                    return res.render('index', { user_id: req.session.passport,category:allCate,Data:ProductDetails});
                }
            } catch (error) {
                res.status(500).send("Error while loading the index page");
            }
        }
  
const userVerify=async(req,res)=>{
   try{
    const email=req.body.email;
    const password=req.body.password;
    const userData=await User.findOne({email:email});
    if(userData){
      const isValid=await  bcrypt.compare(password,userData.password)
     if(isValid){
      if(userData.blocked==false){
      req.session.passport={user:userData._id}
     if(req.session.last){
      id=req.session.last;
      delete req.session.last
      res.redirect(`/users/shopDetails?id=${id}`);
     }
     return res.redirect('/');
      }
      else{
        res.render('login',{message:'You are temporarily blocked '})
      }
     }
      return res.redirect('/users/login')
   }
  return res.redirect('/users/login')
}
catch(err){
  if(err) console.log(err);
}
}
const userLogout=async(req,res)=>{
  try{
    req.session.destroy();
    res.redirect('/')
  }
  catch(err){
    console.log(err);
  }
}
const loadShopDetails=async(req,res)=>{
    try{
      const id=req.query.id;
      const proData= await Product.findById(id).populate('category')
      const relatedProduct = await Product.find({category:proData.category})
      if(proData){
        const proOffer = await productOffer.aggregate([
          {
            $match: {
              'productOffer.product': proData._id,
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
              'categoryOffer.category': proData.category._id,
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
       const review = await Review.find({product:id}).populate({path:'user',model:'User'})
    if(review.length>0){ let rating=0
     for(let i=0;i<review.length;i++){
            rating +=review[i].rating
     } 
     rating /=review.length;
       proData.rating=rating;
       await proData.save();
      }
         return res.render('shop-details',{user_id: req.session.passport,product:proData,
          category:proData.category.name,
          relatedProduct:relatedProduct,catOfferDis,proOfferDiscount,review
        })
      }
      else{
        res.redirect('/users/shop')
      }
    }
    catch(err){
      res.status(500).send("Error while loading product");
    }
}
const loadUser=async(req,res)=>{
  try { 
    const id=req.session.passport.user;
    const orderData=await Order.find({user:id});
    const address=await Address.findOne({user:id})
    const userData=await User.findById(id);
    const wallet=await Wallet.findOne({user:id}).populate('orders');
    res.render('userProf',{user:userData,orders:orderData,address:address,wallet:wallet});
  } catch (err) {
    console.log(err);
  }
}
const rateProduct=async(req,res)=>{
  try {
    const {Id,rating,review}=req.body;
    let data=await Review.findOne({user:req.session.passport.user,product:Id})
    if(data==null){
        data=new Review({
          user:req.session.passport.user,
          product:Id,
          rating:rating,
          reviewText:review
        })    
    }
    data.rating=rating
    data.reviewText=review
    await data.save();
 return res.status(200).json({message:'response submitted'})
  } catch (error) {
  return res.status(400).json(error) 
  }
}
const editProfile = async (req, res) => {
  try {
      const id = req.session.passport.user;
      const { name, mobile} = req.body;
      const orderData=await Order.find({user:id});
    const address=await Address.findOne({user:id})
    const wallet=await Wallet.findOne({user:id}).populate('orders');
    // Update the user profile
      const updatedUser = await User.findByIdAndUpdate(id,{  $set: {name: name,mobile: mobile}},{ new: true });  
      // Handle success and error cases
      if (updatedUser) {
          return res.render('userProf', {
              message: 'Updated successfully!',
              user:updatedUser,orders:orderData,address:address,wallet:wallet
          });
      } else {
        const userData=await User.findById(id);
          return res.render('userProf', {
              error: 'Failed to update user details.',
              user:userData,orders:orderData,address:address,wallet:wallet
          });
      }
  } catch (error) {
      console.error('editProfile error:', error.message);
      return res.status(500).json({message:"Internal server occured"})
   }};
   const contact=async(req,res)=>{
    try {
      res.render('contact')
    } catch (error) {
      res.send(404)
    }
   }
module.exports={
  insertUser,
  loadLogin,
  loadIndex,
  loadsignUp,
  loadShop,
  userVerify,
  userLogout,
  loadShopDetails,
  verifyOtp,
  resendOtp,
  loadUser,
  editProfile,
  rateProduct,
  contact
}  

