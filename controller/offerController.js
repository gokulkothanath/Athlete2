const productOffer = require('../model/productOffer');
const categoryOffer = require('../model/categoryOffer')
const Category = require('../model/category');
const Product = require('../model/product');
// Category Offer
const loadCategoryOffer = async(req, res)=>{
    try {    
        const categoryOfferData = await categoryOffer.aggregate([
            {
                $lookup: {
                    from:'categories',
                    localField:'categoryOffer.category',
                    foreignField:'_id',
                    as:'categoryDetails'
                }
            },
                {
                    $unwind :"$categoryDetails"   
                }
        ])       
        res.render('categoryOffer',{categoryOfferData})
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddCategoryOffer = async(req, res)=>{
    try {
        const categoryData = await Category.find({})
        res.render('addCategoryOffer',{categoryData:categoryData})
    } catch (error) {
        console.log(error.message)
    }
}

const addCategoryOffer = async(req, res)=>{
    try {
        const {name, startingDate, endingDate, category, categoryDiscount} = req.body

        let discount = parseFloat(categoryDiscount)

        const newCategoryOffer = new categoryOffer({
            name,
            startingDate,
            endingDate,
            categoryOffer:{
                category,
                discount
            }
        })
        await newCategoryOffer.save()
        res.redirect('/admin/categoryoffer')
    } catch (error) {
        console.log(error.message)
    }
}

const loadEditCategoryOffer = async(req, res)=>{
    try {
        const categoryData = await Category.find({})
        const catId = req.query.catId
        const offerId = req.query.id
        const offerDetails = await categoryOffer.findById(offerId)
        res.render('editCategoryOffer',{categoryData,offerDetails})
    } catch (error) {
        console.log(error.message)
    }
}

const editCategoryOffer = async(req, res)=>{
    try {       
        const catId = req.query.catId
        const {name, startingDate, endingDate, category, categoryDiscount} = req.body
        
        const updateOffer = await categoryOffer.findByIdAndUpdate(catId,{$set: {
            name:name,
            startingDate:new Date(startingDate),
            endingDate:new Date(endingDate),
            'categoryOffer.discount':categoryDiscount,
            'categoryOffer.category':category,
            
        }},{new:true})
            res.redirect('/admin/categoryoffer')      
    } catch (error) {
        console.log(error.message)
    }
}

const deleteCategoryOffer = async(req, res)=>{
    try {
        const offerId = req.query.id
        const catOfferStatus = await categoryOffer.findByIdAndUpdate(offerId,{$set:{is_active:false}})
        res.redirect('/admin/categoryOffer')
    } catch (error) {
        console.log(error.message)
    }
}

const restoreCategoryOffer = async(req, res)=>{
    try {
       const offerId = req.query.id
       const catOfferStatus = await categoryOffer.findByIdAndUpdate(offerId,{$set:{is_active:true}})
        res.redirect('/admin/categoryOffer')
    } catch (error) {
        console.log(error.message)
    }
}

// Product Offer
const loadProductOffer = async(req, res)=>{
    try {
        const productOfferData = await productOffer.aggregate([
            {
                $lookup:{
                    from:'products',
                    localField:'productOffer.product',
                    foreignField:'_id',
                    as:'productDetails'
                }
            },
            {
                $unwind : '$productDetails'
            },
            
        ])    
        res.render('productOffer',{productOfferData})
       
    } catch (error) {
        console.log(error.message)
    }
}


const loadAddProductOffer = async(req, res)=>{
    try {
        const productData = await Product.find({})
        res.render('addProductOffer',{productData:productData})
    } catch (error) {
        console.log(error.message)
    }
}

const addProductOffer = async(req, res)=>{
    try {
       
        const {name,startingDate,endingDate,products,productDiscount} = req.body
        const discount = parseFloat(productDiscount)

        const newProdOffer = new productOffer({
            name,
            startingDate,
            endingDate,
            productOffer:{
                product:products,
                discount
            }
        })
        await newProdOffer.save()
        res.redirect('/admin/productOffer')
    } catch (error) {
        console.log(error.message)
    }
}

const loadEditProductOffer = async(req, res)=>{
    try {
        const productData = await Product.find({})
        const offerId = req.query.id
        const prdOfferData = await productOffer.findById(offerId)
        res.render('editProductOffer',{productData,prdOfferData})
    } catch (error) {
        console.log(error.message)
    }
}

const editProductOffer = async(req, res)=>{
    try {
        const {name,startingDate,endingDate,product,discount} = req.body
        const offerId = req.query.offerId
        const updatePrdOffer = await productOffer.findByIdAndUpdate(offerId,
            {
                $set: {
                    name:name,
                    startingDate:new Date(startingDate),
                    endingDate:new Date(endingDate),
                    'productOffer.discount':discount,
                    'productOffer.product':product
                }},{new: true})
       res.redirect('/admin/productOffer')
    } catch (error) {
        console.log(error.message)
    }
}

const blockProductOffer = async(req, res)=>{
    try {
       const prdId = req.params.id
       const value = await productOffer.findByIdAndUpdate(prdId,{$set:{'productOffer.offerStatus': false}})
       res.redirect('/admin/ProductOffer');
    } catch (error) {
        console.log(error.message)
    }
}

const unblockProductOffer = async(req, res)=>{
    try {
        const prdId = req.params.id
        const value = await productOffer.findByIdAndUpdate(prdId,{$set:{'productOffer.offerStatus': true}})
        res.redirect('/admin/ProductOffer');
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = {
    loadCategoryOffer,
    loadAddCategoryOffer,
    addCategoryOffer,
    loadEditCategoryOffer,
    editCategoryOffer,
    deleteCategoryOffer,
    restoreCategoryOffer,
    loadProductOffer,
    loadAddProductOffer,
    addProductOffer,
    loadEditProductOffer,
    editProductOffer,
    blockProductOffer,
    unblockProductOffer,
}