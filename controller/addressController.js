const Address=require('../model/address');
const User=require('../model/user');
const Order=require('../model/order')
const loadAddAddress = async(req,res)=>{
    try {
        res.render('addAddress')
    } catch (error) {
        console.log("Error",error.message)
    }
}
const loadEditAddress = async(req,res)=>{
    try{
      const user= await User.findById(req.session.passport.user);
      let useraddresses = await Address.findOne({
        user:user._id
      });
      const addressType=req.query.addressType;
      
      const address = useraddresses.addresses.find(address => address.addressType === addressType);
   
  
  if (address) {
     
      res.render('editAddress', { addresses: address,user_id: req.session.passport});
  } else {
      
      console.log('Address or HouseNo not found');
      
  }
  
    
    }
    catch(error){
      console.log('editAddress',error.message);
    }
  
  }


const addAddress = async(req,res)=>{
    try {

        const{
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country
        } =req.body

    const user = await User.findById(req.session.passport.user)
    
    if(!user){
        conso;e.log('User not found')
    }

    let userAddresses = await Address.findOne({user:user._id})

    if(!userAddresses){
    // If the useraddresses document doesn't exist, create a new one

    userAddresses = new Address({
        user: user._id,
        addresses: []
    })
    }
     // Check if the address already exists for the user
    const existingAddress = userAddresses.addresses.find((address)=>
    address.addressType===addressType && 
    address.HouseNo === houseNo && 
    address.Street === street && 
    address.pincode === pincode &&
    address.Landmark === landmark && 
    address.city === city && 
    address.district == district && 
    address.state === state && 
    address.country === country
)
const existtype = userAddresses.addresses.find((address)=>address.addressType === addressType)

if (existingAddress) {
    res.render('addAddress',{error:'Address already exists for this user'});
    // res.render('add-address',{error:'Address already exists for this user',wish,cart});
  }

  else if(existtype) {
   
    res.render('addAddress',{error:`${existtype.addressType} is alredy registered`});
    
  }
  
  else if (userAddresses.addresses.length >= 3) {
    
    res.render('addAddress',{error:'User cannot have more than 3 addresses'});

  }

  else{
    // Create a new address object
    const newAddress = {
      addressType: addressType,
      HouseNo: houseNo,
      Street: street,
      Landmark: landmark,
      pincode: pincode,
      city: city,
      district: district,
      State: state,
      Country: country,
    };

       userAddresses.addresses.push(newAddress);


      await userAddresses.save();

      res.redirect('/users/user');
      }

    } catch (error) {
        console.log("Error while adding the address".error.message)
    }
}

const editAddress = async(req,res)=>{
    try {
        const {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country
        } = req.body;

        const addresses = await Address.findOne({
            user: req.session.passport.user
        });

        if (!addresses) {
            // Handle the case where addresses are not found
            return res.status(404).send('Address not found');
        }


        const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);

        if (!addressToEdit) {
            // Handle the case where the specified address type is not found
            return res.status(404).send('Address type not found');
        }

          // Update the address fields
    addressToEdit.HouseNo = houseNo;
    addressToEdit.Street = street;
    addressToEdit.Landmark = landmark;
    addressToEdit.pincode = pincode;
    addressToEdit.city = city;
    addressToEdit.district = district;
    addressToEdit.State = state;
    addressToEdit.Country = country;
    
      // Save the changes
    await addresses.save();
    const user=await User.findById(req.session.passport.user)
    const orders = await Order.findOne({user:user._id}) || [];

    return res.render('userProf', { address:addresses, message: 'Updated successfully!' ,user,orders});
    } catch (error) {
        console.log("Error white editing the address",error.message)
    }
}

const deleteAddress = async(req,res)=>{
    try {
        const user = await User.findById(req.session.passport.user)
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found'
              });
        }

        const addresses = await Address.findOne({user:user._id})

        const addressTypeToDelete = req.query.addressType 
        const addressIndeXToDelete = addresses.addresses.findIndex((address)=>address.addressType === addressTypeToDelete)

        addresses.addresses.splice(addressIndeXToDelete,1)

        await addresses.save()
        
        return res.redirect('/users/user');

    } catch (error) {
        console.log("Error while deleteing the address",error.message)
    }
}
module.exports={
     addAddress,
     editAddress,
     deleteAddress,
     loadAddAddress,
     loadEditAddress
}