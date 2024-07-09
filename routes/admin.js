var express = require('express');
const path=require('path');
var router = express();
const fs=require('fs');
const session=require('express-session');
const controller=require('../controller/adminController')
const middleware=require('../middlewares/adminAuth')
const multer=require('multer');
const sharp=require('sharp');
const cateController=require('../controller/categoryController');
const prodController=require('../controller/productController')
const couponController=require('../controller/couponController');
const salesController=require('../controller/salesController');
const offerController=require('../controller/offerController');

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./public/product')
    },
    filename: function(req,file,cb){
        cb(null,file.originalname)
    }
})

const upload = multer({storage:storage}).array("images",3)


router.use(session({resave:true,saveUninitialized:false,secret:process.env.session_Secret}))
/* GET home page. */
router.use(express.static(path.join(__dirname, '../public/admin')));
router.use(express.static(path.join(__dirname, '../public/product')));
router.set('views', path.join(__dirname,'../views/admin'));
router.set('view engine', 'ejs');


router.get('/',middleware.isLogout,controller.loadLogin);
router.post('/',controller.adminVerify);
router.get('/home',middleware.isLogged,controller.loadHome);
router.get('/logout',middleware.isLogged,controller.logout);
router.get('/userlist',middleware.isLogged,controller.listUser);
router.get('/block-user',middleware.isLogged,controller.blockUser);
router.get('/unblock-user',middleware.isLogged,controller.unblockUser);

router.get('/category',middleware.isLogged,controller.loadCategory);
router.post('/category',middleware.isLogged,cateController.createCategory);
router.get('/edit-cate',middleware.isLogged,cateController.editCategory);
router.post('/edit-cate',middleware.isLogged,cateController.updateCate);
router.get('/delete-cate',middleware.isLogged,cateController.deleteCate);

router.get('/product',middleware.isLogged,prodController.loadProduct);
router.post('/product',middleware.isLogged,upload,prodController.addProduct);
router.get('/active',middleware.isLogged,prodController.activeStatus);
router.get('/editproduct',middleware.isLogged,prodController.loadEdit);
router.post('/editproduct',middleware.isLogged,upload,prodController.editProduct);

router.get('/order',middleware.isLogged,controller.loadorder);
router.get('/order-Details',middleware.isLogged,controller.loadorderdetails);
router.post('/updateorderstatus',middleware.isLogged,controller.updateOrder);
router.post('/acceptCancel',middleware.isLogged,controller.requestAccept);
router.post('/rejectCancel',middleware.isLogged,controller.requestCancel);


router.get('/coupon',middleware.isLogged,couponController.loadCoupon);
router.get('/createCoupon',middleware.isLogged,couponController.loadCreateCoupon);
router.post('/createCoupon',middleware.isLogged,couponController.createCoupon);
router.post('/toggleCoupon',middleware.isLogged,couponController.toggleCoupon);

router.get('/sales',middleware.isLogged,salesController.loadSales);
router.post("/salesReportSelectFilter",middleware.isLogged,salesController.filterReoprt)
router.post("/fileterDateRange",middleware.isLogged,salesController.filterCustomDateOrder)

router.get('/categoryOffer',middleware.isLogged,offerController.loadCategoryOffer);
router.get('/addCategoryOffer',middleware.isLogged,offerController.loadAddCategoryOffer);
router.post('/addCategoryOffer',middleware.isLogged,offerController.addCategoryOffer);
router.get('/editCategoryOffer',middleware.isLogged,offerController.loadEditCategoryOffer);
router.post('/editCategoryOffer',middleware.isLogged,offerController.editCategoryOffer);
router.get('/delete-cateOff',middleware.isLogged,offerController.deleteCategoryOffer);
router.get('/restore-cateOff',middleware.isLogged,offerController.restoreCategoryOffer);

router.get('/productoffer',middleware.isLogged,offerController.loadProductOffer)
router.get('/addProductOffer',middleware.isLogged,offerController.loadAddProductOffer)
router.post('/addProductOffer',middleware.isLogged,offerController.addProductOffer)
router.get('/editProductOffer',middleware.isLogged,offerController.loadEditProductOffer)
router.post('/editProductOffer',middleware.isLogged,offerController.editProductOffer)
router.post('/block-prdOff/:id',middleware.isLogged,offerController.blockProductOffer)
router.post('/unblock-prdOff/:id',middleware.isLogged,offerController.unblockProductOffer)

router.get("/bestselling",middleware.isLogged,controller.getBestSelling)

router.get("/chart",middleware.isLogged,controller.getChartData);

module.exports=router

