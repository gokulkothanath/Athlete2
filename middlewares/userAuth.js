const User=require('../model/user')
const isLogged = async(req,res,next)=>{
    try{
        if(req.session.passport){

            const id=req.session.passport.user
             const Data=await User.findById(id)
             if(Data.blocked==false){

               next()
             }
             else{
                req.session.destroy()
                res.redirect('/users/login')
             }
        }
        else{
           // console.log(req.body.productId);
            req.session.last=req.body.productId;

            res.redirect('/users/login')
        }     
    }
    catch(err){
        console.log(err)
    }
}
const isLogout = async(req,res,next)=>{
    try{
        if(req.session.passport){
            res.redirect('/users/shop');
        }
        else{
            next();
        }     
    }
    catch(err){
        console.log(err)
    }
}

module.exports={
    isLogged,
    isLogout
}
