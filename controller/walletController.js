const Wallet=require('../model/wallet');



const walletPay=async(amount,id)=>{
    
const wallet= await Wallet.findOne({user:id});
if(wallet){
    if(wallet.amount>=amount){
        wallet.amount-=amount
        await wallet.save();
        return true
    }
    else{
        return false
    }
}
else{
    return false
}   
}

module.exports={walletPay}
