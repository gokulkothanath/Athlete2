const User=require('../model/user')
const category=require('../model/category')
const bcrypt=require('bcrypt');
const Order=require('../model/order');
const Product = require('../model/product');
const Wallet=require('../model/wallet');
const bestSelling=require('../controller/statisticsController');
const loadLogin= async(req,res)=>{
    try{
        res.render('adminLogin');
    }
    catch(err){
     console.log(err);
    }
}

const adminVerify=async (req,res)=>{
    try{
        const userData=await User.findOne({$and:[{email:req.body.email},{isAdmin:true}]})
        if(userData){
            const passwordMatch= await bcrypt.compare(req.body.password,userData.password)
          if(passwordMatch){
            req.session.passport = {user:userData._id}                                  
                res.redirect('/admin/home')
          }
          else{
           res.render('adminLogin',{message:'Wrong User'})
          }
        }
        else{
           res.render('adminLogin',{message:'Wrong User'})}
      }
    catch(err){
        console.log(err);
      }
    }     
const logout = async(req,res)=>{
    try {
        req.session.destroy()
        res.render('adminLogin',{message:'logged Out'})
    } catch (error) {
        console.log("Error while Logging out",error.message)
    }
}  
const listUser=async(req,res)=>{
    try{
        const page = parseInt(req.query.page) || 1;
      const limit = 3;
      const skip = (page - 1) * limit;

      const totalProd = await User.countDocuments({isAdmin:false});
      const totalPages = Math.ceil(totalProd / limit);

      let filteredUsers = await User.find({isAdmin:false})
          .skip(skip)
          .limit(limit);
    res.render('userlist',{users:filteredUsers, currentPage: page,
        totalPages: totalPages})
    }
    catch(err){
        console.log(`error while fetching users:${err}`)
    }
} 
const blockUser=async(req,res)=>{
    try{
        const userData=await User.findById(req.query.id)
        if(userData){
            userData.blocked=true;

            await userData.save()
            res.redirect('/admin/userlist')
        }
        else{console.log('error while blocking');}
    }
    catch(err){
        console.log(`error while fetching user:${err}`);
    }
}
const unblockUser=async(req,res)=>{
    try{
        const userData=await User.findById(req.query.id)
        if(userData){
            userData.blocked=false
            userData.save()
            res.redirect('/admin/userlist')
        }
        else{
            console.log('error while unblocking')
        }
    }
    catch(err){
        console.log(`error while fetching user${err}`)
    }
}

const loadCategory=async(req,res)=>{
    try{
    const categoryData=await category.find({})
    res.render('category',{category:categoryData})
    }
    catch(err){
        console.log(`error while loading categories:${err}`);
    }
}
const loadorder = async(req,res)=>{
    try{
        const page = parseInt(req.query.page) || 1;
        const query=req.query.q?{'requests.status': 'Pending' }:{}
        const limit = 6;
        const skip = (page - 1) * limit;
        const count= await Order.countDocuments({'requests.status': 'Pending' });
        const totalProd = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalProd / limit);
  
        let order = await Order.find(query).populate({path:'user',model:'User'})
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit) ;
      res.render('orderList',{order,currentPage: page,
        totalPages: totalPages,count:count,q:query});
    }catch(error){
      console.log(error.message);
    }
}

const loadorderdetails = async(req,res)=>{
    try{
      const id =req.query.id;
      const orders = await Order.findById(id).populate({path:'user',model:'User'});
      res.render('ad-orderDetail',{orders});
    }catch(error){
      console.log(error.message);
    }
  }
  
  const updateOrder=async(req,res)=>{
    try{
        const {newStatus,orderId}=req.body;
       
        const order=await Order.findOne({oId:orderId});
        if(newStatus==='Canceled'){
            for (const orderItem of order.items) {
                let product = await Product.findById(orderItem.productId);
    
  
                if (product) {
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
  
        }
        const updatedOrder = await Order.findOneAndUpdate(
            { oId: orderId },
            {$set:{ status: newStatus } },
            { new: true }
        );
          
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
  
        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
    }
    catch(error){
        console.log('updateorder:',error.message);
    }
  
  } 

  const requestAccept = async (req, res) => {
    try {
      const { orderId, userId } = req.body;
  
      const canceledOrder = await Order.findOne({ oId: orderId });
      if (!canceledOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      // Iterate over each item in the canceled order to update product stock.
      for (const orderItem of canceledOrder.items) {
        let product = await Product.findById(orderItem.productId).exec();
        if (product) {
          product.countInStock += Number(orderItem.quantity);
          await product.save();
        }
      }
      // Process each request in the canceledOrder.
      for (let request of canceledOrder.requests) {
        if (request.status === 'Pending') { // Ensure we're only updating pending requests.
          const newStatus = request.type === 'Cancel' ? 'Canceled' : 'Returned';
          await Order.findOneAndUpdate(
            { oId: orderId, 'requests._id': request._id }, // Match the specific request by its ID.
            {
              $set: {
                status: newStatus,
                'requests.$.status': 'Accepted' // Update the matched request status.
              }
            },
            { new: true }
          );
        }
      }
      if(canceledOrder.paymentMethod==='Razorpay'||canceledOrder.paymentMethod==='WALLET'){
      let wallet=await Wallet.findOne({user:userId});
      if(!wallet){
         wallet=new Wallet({
          user:user._id,
          amount:0,
          orders:[]
        });
         }
        wallet.amount+=canceledOrder.billTotal;
        if(canceledOrder.paymentMethod=='Razorpay'){
          wallet.orders.push(canceledOrder._id);
        }
        await wallet.save()  
      }
      return res.status(200).json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
 
  const requestCancel = async(req,res)=>{
    try {
        const { orderId} = req.body;
            const order = await Order.findOne({oId:orderId});
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
        const updatedOrder = await Order.findOneAndUpdate(
            { oId: orderId },
            { $set: { status: 'Pending', 'requests.$[elem].status': 'Rejected' } },
            { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
        ); 
    if (!updatedOrder) {
        
        return res.status(201).json({ success: true, message: 'Order not found' });
        
    }
    return res.status(200).json({ success: true, message: 'Order status rejected', updatedOrder })
     }catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }
  
  const loadHome = async(req,res)=>{
    try {
        const userData = await User.findById(req.session.passport.user)
        const users=  await User.find({})
        const products = await Product.find({})
        const usersCount = await User.find().countDocuments()
        const productsCount = await Product.find().countDocuments()
        const confirmedOrders = await  Order.aggregate([
            { $match:{status:{$in:['Pending','Delivered']}}},
            {
            $group:{
                _id:null,
                count:{$sum:1},
                totalRevenue:{$sum:"$billTotal"}

            }
        }
        ]).exec()

        const ordersCount= await Order.find({
            status:"Pending",
        }).countDocuments()
        //bestSelling
        let bestSellingProducts = await bestSelling.getBestSellingProducts()
        let bestSellingBrands = await bestSelling.getBestSellingBrands()
        let bestSellingCategories = await bestSelling.getBestSellingCategories()
        res.render('adminhome',
            {
            users,
            products,
            usersCount,
            ordersCount,
            productsCount,
            bestSellingBrands,
            bestSellingProducts,
            bestSellingCategories,
            totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
            admin: userData,
            }
        )
    } catch (error) {
        console.log("Error whiler rendering admin Home",error.message)
    }
}

const getBestSelling = async(req,res)=>{
    try {
        const userData = await User.findById(req.session.passport.user)
        const users=  await User.find({})
        const products = await Product.find({})
        const usersCount = await User.find().countDocuments()
        const productsCount = await Product.find().countDocuments()

        const confirmedOrders = await  Order.aggregate([
            { $match:{status:"Delivered"}},
            {
            $group:{
                _id:null,
                count:{$sum:1},
                totalRevenue:{$sum:"$billTotal"}

            }
        }
        ]).exec()

        const ordersCount= await Order.find({
            status:"Pending",
        }).countDocuments()

        //bestSelling

        let bestSellingProducts = await bestSelling.getBestSellingProducts()
        let bestSellingBrands = await bestSelling.getBestSellingBrands()
        let bestSellingCategories = await bestSelling.getBestSellingCategories()
        res.render('home2',
            {
            users,
            products,
            usersCount,
            ordersCount,
            productsCount,
            bestSellingBrands,
            bestSellingProducts,
            bestSellingCategories,
            totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
            admin: userData,
            }
        )
    } catch (error) {
        console.log("Error whiler rendering admin Home",error.message)
    }
}

const getChartData = async (req, res) => {
    try {
        const timeBaseForSalesChart = req.query.salesChart;
        const timeBaseForOrderNoChart = req.query.orderChart;
        const timeBaseForOrderTypeChart = req.query.orderType;
        const timeBaseForCategoryBasedChart = req.query.categoryChart;
        function getDatesAndQueryData(timeBaseForChart, chartType) {
            let startDate, endDate;
            let groupingQuery, sortQuery;

            if (timeBaseForChart === "yearly") {
                startDate = new Date(new Date().getFullYear(), 0, 1);
                endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

                groupingQuery = {
                    _id: {
                        month: { $month: { $toDate: "$createdAt" } },
                        year: { $year: { $toDate: "$createdAt" } }
                    },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };
                sortQuery = { "_id.year": 1, "_id.month": 1 };
            }

            if (timeBaseForChart === "weekly") {
                startDate = new Date();
                endDate = new Date();

                const timeZoneOffset = startDate.getTimezoneOffset();

                startDate.setDate(startDate.getDate() - 6);
                startDate.setUTCHours(0, 0, 0, 0);
                startDate.setUTCMinutes(startDate.getUTCMinutes() + timeZoneOffset);

                endDate.setUTCHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() + 1);
                endDate.setUTCMinutes(endDate.getUTCMinutes() + timeZoneOffset);

                groupingQuery = {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };

                sortQuery = { _id: 1 };
            }

            if (timeBaseForChart === "daily") {
                startDate = new Date();
                endDate = new Date();

                const timezoneOffset = startDate.getTimezoneOffset();

                startDate.setUTCHours(0, 0, 0, 0);
                endDate.setUTCHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() + 1);

                startDate.setUTCMinutes(startDate.getUTCMinutes() + timezoneOffset);
                endDate.setUTCMinutes(endDate.getUTCMinutes() + timezoneOffset);

                groupingQuery = {
                    _id: { $hour: "$createdAt" },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };

                sortQuery = { "_id.hour": 1 };
            }

            if (chartType === "sales") {
                return { groupingQuery, sortQuery, startDate, endDate };
            } else if (chartType === "orderType") {
                return { startDate, endDate };
            } else if (chartType === "categoryBasedChart") {
                return { startDate, endDate };
            } else if (chartType === "orderNoChart") {
                return { groupingQuery, sortQuery, startDate, endDate };
            }
        }

        const salesChartInfo = getDatesAndQueryData(timeBaseForSalesChart, "sales");
        const orderChartInfo = getDatesAndQueryData(timeBaseForOrderTypeChart, "orderType");
        const categoryBasedChartInfo = getDatesAndQueryData(timeBaseForCategoryBasedChart, "categoryBasedChart");
        const orderNoChartInfo = getDatesAndQueryData(timeBaseForOrderNoChart, "orderNoChart");
        const salesChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: salesChartInfo.startDate, $lte: salesChartInfo.endDate },
                    status: { $nin: ["Canceled", "Failed", "Refunded"] },
                    paymentStatus: { $nin: ["Pending", "Processing", "Canceled", "Returned"] }
                }
            },
            { $group: salesChartInfo.groupingQuery },
            { $sort: salesChartInfo.sortQuery }
        ]).exec();

        const orderNoChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: orderNoChartInfo.startDate, $lte: orderNoChartInfo.endDate },
                    status: { $nin: ["Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Failed", "Refunded", "Cancelled"] }
                }
            },
            { $group: orderNoChartInfo.groupingQuery },
            { $sort: orderNoChartInfo.sortQuery }
        ]).exec();

        const orderChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: orderChartInfo.startDate, $lte: orderChartInfo.endDate },
                    status: { $nin: [ "Processing", "Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Refunded", "Cancelled", "Failed"] }
                }
            },
            { $group: { _id: "$paymentMethod", totalOrder: { $sum: 1 } } }
        ]).exec();

        const categoryWiseChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: categoryBasedChartInfo.startDate, $lte: categoryBasedChartInfo.endDate },
                    status: { $nin: [ "Processing", "Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Failed"] }
                }
            },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.category",
                    foreignField: "_id",
                    as: "catInfo"
                }
            },
            { $addFields: { categoryInfo: { $arrayElemAt: ["$catInfo", 0] } } },
            { $addFields: { catName: "$categoryInfo.name" } },
            { $group: { _id: "$catName", count: { $sum: 1 } } }
        ]).exec();

        let saleChartInfo = {
            timeBasis: timeBaseForSalesChart,
            data: salesChartData
        };

        let orderTypeChartInfo = {
            timeBasis: timeBaseForOrderTypeChart,
            data: orderChartData
        };

        let categoryChartInfo = {
            timeBasis: timeBaseForCategoryBasedChart,
            data: categoryWiseChartData
        };

        let orderQuantityChartInfo = {
            timeBasis: timeBaseForOrderNoChart,
            data: orderNoChartData
        };
        return res.status(200).json({
            saleChartInfo,
            orderTypeChartInfo,
            categoryChartInfo,
            orderQuantityChartInfo
        });
    } catch (error) {
        console.log("error while getting chart Data", error.message);
        return res.status(500).json({ error: "Something went wrong" });
    }
};

module.exports={
    loadLogin,
    adminVerify,
    loadHome,
    logout,
    listUser,
    blockUser,
    unblockUser,
    loadCategory,
    loadorder,
    loadorderdetails,
    updateOrder,
    requestAccept,
    requestCancel,
    getBestSelling,
    getChartData
}

