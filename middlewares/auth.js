const User=require('../model/user')
const passport=require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(new GoogleStrategy({
    clientID:    process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://www.athlete.homes/google/callback",
    passReqToCallback   : true
  },
  async function(request, accessToken, refreshToken, profile, done) {
   try{
  const email=profile.email;
  const userData=await User.findOne({email:email})
   if(userData){
    userData.verified=true;
    await userData.save()
    return done(null,userData)
   }
   else{
    const user=new User({
      name:profile.displayName,
      email:email,
      mobile : profile.phoneNumber?profile.phoneNumber[0]:null,
      verified:true,
    })
    const userData= await user.save()
     console.log('user saved successfully')
     if(userData){
      return done(null,userData)
     }
     else{ console.log('failed to save user');}
   }
   }
   catch(err){
     console.log(err);
     return done(err)
   }
  }
));

passport.serializeUser((user,done)=> {
   // console.log(user)
   return done(null,user.id)})
passport.deserializeUser(async(id,done)=> {
  //console.log(user)
  try{
   const user=await User.findById(id);
   done(null,user)
  }
  catch(err){
    console.log(err);
    done(err)
  }
  })
