
const Category = require('../model/category');

const createCategory = async (req, res) => {
    try {
        const name = req.body.name;
        const des = req.body.description;
        const existingcat = await Category.findOne({
            name: name.toLowerCase()
        })
        if (existingcat) {
            const categoryDetails = await Category.find()
            res.render('category', { category: categoryDetails, message: "Category already exists" })
        }
        else {

            const cat = new Category({
                name: name,
                description: des
            })
            const catData = await cat.save()
            res.redirect('/admin/category')
        }
    } catch (error) {
        
        console.log("Error while creating Category", error.message)
    }
}

const editCategory = async (req, res) => {
    try {
        const id = req.query.id
        const categoryData = Category.findById(id)
        if (categoryData) {
            res.render('edit-cate', { category: categoryData })
        }
        else {
            res.redirect('/admin/category')
        }
    } catch (error) {
        res.status(500).send('Error editing category');
    }
}

const updateCate = async (req, res) => {

    try {
        const id = req.query.id
        const Data = await Category.findByIdAndUpdate(id, { $set: { name: req.body.name, description: req.body.description } })
        if (Data) {
            res.redirect("/admin/category")
        }
    }

    catch (error) {
        console.log("Error while Updting the category", error.message)
    }
}

const deleteCate = async(req,res)=>{
    try {
        
        const id = req.query.id
        const category = await Category.findById(id);

       
       
        if(category.is_Active===true){
            await Category.findByIdAndUpdate(id,{is_Active:false})
        }
        else{
            await Category.findByIdAndUpdate(id,{is_Active:true})
        }
        res.redirect('/admin/category')
    } catch (error) {
        res.status(500).send("Internal Server Error")
    }
}



module.exports = {
    createCategory,
    editCategory,
    updateCate,
    deleteCate,
    
}