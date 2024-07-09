//require('dotenv').config();
var express = require('express');
var router = express();
const path=require('path');
const session=require('express-session');
const controller=require('../controller/userController');
const middleware=require('../middlewares/userAuth');
const passport=require('passport');
const cartController=require('../controller/cartController')
const orderController=require('../controller/orderController');
const addressController=require('../controller/addressController');
const wishListController=require('../controller/wishListController');
const paymentController=require('../controller/paymentController');
const couponController = require('../controller/couponController');
/* GET users listing. */
require('../middlewares/auth');
router.set('views',path.join(__dirname, '../views/user'));
router.set('view engine', 'ejs');
router.use(express.static(path.join(__dirname, '../public/user')));
router.use(session({resave:true,saveUninitialized:false,secret:process.env.session_Secret}))
router.use(passport.initialize())
//router.use(passport.session(session))
router.get('/auth/google',
passport.authenticate('google',{scope:['email','profile']})
);
router.get('/google/callback',
passport.authenticate('google',{
    successRedirect:'/users/shop',
    failureRedirect:'/users/login'
}))
router.get('/sample',(req,res)=>{
    res.render('orderDetails')
})
router.get('/',controller.loadIndex);
router.get('/users/login',middleware.isLogout,controller.loadLogin);
router.get('/users/signUp',controller.loadsignUp);
router.get('/users/shop',controller.loadShop);
router.post('/users/signUp',controller.insertUser);
router.post('/users/login',controller.userVerify,controller.loadIndex);
router.get('/users/logout',controller.userLogout);
router.get('/users/shopDetails',controller.loadShopDetails);
router.post('/users/otp',controller.verifyOtp);
router.post('/users/resendOtp',controller.resendOtp);
router.post('/users/rating',middleware.isLogged,controller.rateProduct);

router.get('/users/user',middleware.isLogged,controller.loadUser);
router.post('/users/user',middleware.isLogged,controller.editProfile);
router.get('/users/addAddress',middleware.isLogged,addressController.loadAddAddress);
router.post('/users/addAddress',middleware.isLogged,addressController.addAddress);
router.get('/users/editAddress',middleware.isLogged,addressController.loadEditAddress);
router.post('/users/editAddress',middleware.isLogged,addressController.editAddress);

router.post('/users/addToCart',middleware.isLogged,cartController.addTocart);
router.get('/users/cart',middleware.isLogged,cartController.loadCart);
router.post('/users/increaseQty',middleware.isLogged,cartController.increaseQuantity);
router.post('/users/decreaseQty',middleware.isLogged,cartController.decreaseQuantity);
router.post('/users/deleteItem',middleware.isLogged,cartController.deleteItem);


router.get('/users/order',middleware.isLogged,orderController.loadcheckout);
router.post('/users/order',middleware.isLogged,orderController.PostCheckout);
router.get('/users/confirmOrder',middleware.isLogged,orderController.loadorderconfirmed);
router.get('/users/orderDetails',middleware.isLogged,orderController.loadorderdetails);
router.post('/orderDetails',middleware.isLogged,orderController.returnOrder);
router.patch('/orderDetails',middleware.isLogged,orderController.cancelOrder);
router.patch('/users/order',middleware.isLogged,orderController.repayment)

router.post('/users/addWish',middleware.isLogged,wishListController.addToWish);
router.get('/users/loadWish',middleware.isLogged,wishListController.loadWish);
router.post('/users/deleteWish',middleware.isLogged,wishListController.deleteWish);
router.post('/users/createOrder',middleware.isLogged,paymentController.createOrder);
router.post('/users/applyCoupon',middleware.isLogged,couponController.applyCoupon);
router.post('/users/removeCoupon',middleware.isLogged,couponController.removeCoupon);

router.get('/users/invoice',middleware.isLogged,orderController.loadInvoice);
router.get('/users/contact',controller.contact);


module.exports = router;

