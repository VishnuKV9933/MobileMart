var express = require("express");

var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const offerHelper=require('../helpers/adminOfferManagement')
const wishlistCartManagement= require("../helpers/wishlistAndCartmanagement")
require('dotenv').config();

let ACCOUNT_SID = process.env.ACCOUNT_SID;
let AUTH_TOKEN =process.env.AUTH_TOKEN;
let SERVICE_ID =process.env.SERVICE_ID;
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


const paypal = require('paypal-rest-sdk');
const { response } = require("../app");

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id':process.env.client_id,
  'client_secret': process.env.client_secret
});


const verifyLogin = (req, res, next) => {
    if (req.session.user) {
      next();
    } else {
      res.redirect("/login");
    }
  };

const home=async function (req, res, next) {


    if (req.session.user) {
  
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
    
   let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  
   let brand = await productHelpers.getAllBrand();
   productHelpers.getAllproducts().then((products) => {
     let person={
       name:'vishnu',
       place:'malappuram'
     }
     
     res.render("user/home", {
       cartCount, 
       products,
       noheader: true,
       userLogged:true,
       brand,
       listCount,
       person
     });
   });
    }else{  
  
  
    let brand = await productHelpers.getAllBrand();
    productHelpers.getAllproducts().then((products) => {
      let person={
        name:'vishnu',
        place:'malappuram'
      }
      res.render("user/home", {
        products,
        noheader: true,
        brand,
        person
      });
    });
    }
  
  }


const signup =(req, res) => {

    let permissionMessage
    if( req.session.permissionMessage){
      permissionMessage= req.session.permissionMessage
    }
  
    if (req.session.check) {
   
      res.render("user/signup", { noheader: false, permissionMessage });
      req.session.permissionMessage = "";
     permissionMessage=""
    } else {
      res.render("user/signup", { noheader: false });
    }
  }  
const signupPost=(req, res) => {
    userHelpers.doSignup(req.body).then((response) => {
      if (response.user) {
        req.session.check = response.user;
        req.session.permissionMessage = response.err;
        res.redirect("/signup");
      } else {
        req.session.user = response;
       
        res.redirect("/");
      }
    });
  }

  const login= (req, res) => {
    let permissionMessage
    if( req.session.permissionMessage){
      permissionMessage= req.session.permissionMessage
    }
    if (req.session.user) {
      res.redirect("/");
    } else
      res.render("user/login", {
        noheader: false,
        loggederr: req.session.userloginErr,
        permissionMessage,
      });
    req.session.userloginErr = false;
    permissionMessage = "";
    req.session.permissionMessage=""
  }

 const loginPost=(req, res) => {
  userHelpers.dologin(req.body).then((response) => {
    if (response.user) {
      if (response.permission) {
        if (response.status) {
       
          req.session.user = response.user;
          // req.session.user.loggedIn = true;
          res.redirect("/");
        } else {
          req.session.permissionMessage = "invalid password";
          res.redirect("/login");
        }
      } else {
        req.session.permissionMessage = "login permission blocked";
        res.redirect("/login");
      }
    } else {
      req.session.permissionMessage = "invalid email";
      res.redirect("/login");
    }
  });
} 

const otplogin=(req, res) => {
  let permissionMessage
  if( req.session.permissionMessage){
    permissionMessage= req.session.permissionMessage
  }
  res.render("user/otplogin", { noheader: false, permissionMessage });
  req.session.permissionMessage = " ";
  permissionMessage=" "
}

const verifiOtp2=(req, res) => {
  let permissionMessage
  if( req.session.permissionMessage){
    permissionMessage= req.session.permissionMessage
  }
   
  let change;
  if (req.session.number === undefined) {
    change = req.query.mobile;
  } else {
    console.log( req.session.number);
    console.log(" req.session.number");
    change = req.session.number;
  }
  userHelpers.verifyOtp(change).then((data) => {
    if (data.exists) {
      if (data.status) {
        req.session.number = parseInt(data.user.mobile);
       req.session.otpUser = data.user;
     console.log(req.session.number);
        client.verify
          .services(SERVICE_ID)
          .verifications.create({
            to: `+91${req.session.number}`,
            channel: "sms",
          })
          .then((result) => {
            res.render("user/otpverify", {
              noheader: false,
              permissionMessage,
            });
            permissionMessage=" "
            req.session.permissionMessage = "";
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        req.session.permissionMessage = "Blocked user";
        res.redirect("/otplogin");
      }
    } else {
      req.session.permissionMessage = "Number is not registered";
      res.redirect("/otplogin");
    }
  });
}

const verifyOTP=(req, res) => {
  client.verify
    .services(SERVICE_ID)
    .verificationChecks.create({
      to: `+91${req.session.number}`,
      code: req.query.otp, 
    })
    .then((data) => {
      if (data.valid) {
        req.session.user = req.session.otpUser;
        res.redirect("/");
      } else {
        req.session.permissionMessage = " invalid otp";
        console.log(req.session.permissionMessage);
        console.log("invalid otp");
        res.redirect("/otpverify2");
        
      }
    })
    .catch((err) => {
      res.redirect("/otpverify2");
    });
}

const product=async (req, res) => {
  let listCount
  let cartCount
  let userLogged
  if(req.session.user){
    userLogged=true
   listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelpers
  .getProductDetails(req.params.id)
  .then((product) => {
    res.render("user/product", { noheader: true, product, userLogged ,cartCount,listCount});
  })
  .catch((err) => {
    console.log(err);
  });
}

const cart= async (req, res) => {
  let listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
   
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
   userHelpers.getCartProducts(req.session.user._id).then((products) => {
     userHelpers.getGrandTotal(req.session.user._id).then((response) => {
       if (response[0]) {
         grandTotal = response[0].grandTotal;
         res.render("user/cart", {
           noheader: true,
           userLogged:true,
           user: req.session.user._id,
           products,
           listCount,
           cartCount,
           grandTotal,
         });
       } else {
         res.render("user/cart", {
           noheader: true,
           userLogged:true,
           user: req.session.user._id,
           products,
           cartCount,
           listCount
         });
       } 
     });
   });
 }

const changeProductQuantity=(req, res) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    console.log("response");
    console.log(response);

    console.log("response");

    response.total = await userHelpers.getGrandTotal(req.body.userId);

    res.json(response);
  });
}

const addToCart=(req, res) => {
  console.log("------------1-------------");
  console.log(req.session.user._id);
  console.log(req.params.id);
  userHelpers.addToCart(req.params.id, req.session.user._id).then((data) => {
    console.log(data);
    if (data.success) {
      console.log("success");
      res.json({ status: true });
    } else if (data.outOfStock) {
      console.log("out of stock");
      res.json({ status: false });
    }


  });

}

const removeProduct=(req, res) => {
  userHelpers.removeCartProduct(req.body).then((response) => {
    res.json(response);
  });
}

const checkOut=async (req, res) => {
  let permissionMessage
  if( req.session.permissionMessage){
    permissionMessage= req.session.permissionMessage
  }
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
   let cartCount = await userHelpers.getCartCount(req.session.user._id);
  let user=await userHelpers.getuserDetails(req.session.user._id)
  console.log(user);
  if(cartCount>0){
    let id = req.session.user._id;

    userHelpers.getCartProducts(id).then((products) => {
      userHelpers.getGrandTotal(id).then((response) => {
        userHelpers.getUserAddress(id).then((address) => {
          if (response[0]) {
            grandTotal = response[0].grandTotal;
  
            if(user.coopon){ 
       let couponTotal=grandTotal-(grandTotal*user.coopon.percentage)/100
       couponTotal=Math.round(couponTotal)
   let code =   user.coopon.code
   let percent=user.coopon.percentage

       res.render("user/checkout", { noheader: true,userLogged:true,products,cartCount,user,listCount,grandTotal,address,code,percent,permissionMessage,couponTotal });
       req.session.permissionMessage=" "
       permissionMessage=" "
            }else{ 
              res.render("user/checkout", { noheader: true,userLogged:true,products,cartCount,user,listCount,grandTotal,address,permissionMessage });
              req.session.permissionMessage=" "
              permissionMessage=""
            }
         
          } else {
            res.render("user/checkout", {
            
              noheader: true,
              userLogged:true,
              products,
              user,
              cartCount,
              listCount, 
              address,
              permissionMessage
            });
           
 
   req.session.permissionMessage=""
  
  permissionMessage=""
          }
        });
      });
    });
  }else{
  
   res.redirect('/')

  }  
  
}

const applyCoupon=(req,res)=>{
  offerHelper.cooponChecking(req.body.coopon,req.session.user._id).then((response)=>{
    if(response.status){
      console.log(response);
      res.json(response)

    }else{
      console.log('-----------------------------------------13-----------------------------------------------');
res.json(response)

    }

  })
  .catch((error)=>{
   console.log(error);
  })

}

const removeCoupun=(req,res)=>{

  offerHelper.couponUserRemovel(req.session.user._id).then((data)=>{
     console.log('hi');
     res.redirect('/checkout')
  })
  .catch((err)=>{
  console.log(err); 
  })

}

const placeOrder=async (req, res) => {

  let user=await userHelpers.getuserDetails(req.session.user._id)
   
   if(user.coopon){
     console.log('-----------------------------------------14-----------------------------------------------');
     let couponObj={}
     console.log("req.session.user.coopon");
     let cooponPercent= user.coopon.percentage 
 
     let products = await userHelpers.getCartProductList(req.body.userId);
   let totalPrice = await userHelpers.getGrandTotal(req.body.userId);
 
   couponObj.originalPrice=parseInt(totalPrice[0].grandTotal) 
   couponObj.coupunCode=user.coopon.code
   couponObj.couponPercentage=user.coopon.percentage 
   let paypaltotalPrice = await userHelpers.paypalGrandTotal(req.body.userId);
    
   let discountTotalPrice= Math.round((parseInt(totalPrice[0].grandTotal)*cooponPercent)/100)
   let  paypalDiscountTotalPrice= Math.round((parseInt(paypaltotalPrice[0].total)*cooponPercent)/100)
 
   totalPrice = parseInt(totalPrice[0].grandTotal)-discountTotalPrice
   paypaltotalPrice= parseInt(paypaltotalPrice[0].total)-paypalDiscountTotalPrice
 
 
 
   userHelpers.placeOrderCoupon(req.body, products, totalPrice,couponObj).then((orderId) => {
     
     let order=req.body
       
 
     if(order['payment-method']=='WALLET'){
 
       userHelpers.walletAmountCheck(req.body.userId,totalPrice).then((response)=>{
   
         if(response.walletAmount){
 
           offerHelper.cooponObjectRemovelUser(req.session.user._id).then((data)=>{
           })
           .catch((err)=>{console.log(err);})
 
           userHelpers.walletAmountReduce(req.body.userId,totalPrice).then((data)=>{})
           userHelpers.deleteCart(req.body.userId).then((data)=>{})
   
           userHelpers.changeOrderStatusOnline(orderId).then((data)=>{})
   
           userHelpers.getOrderProductQuantity(orderId).then((data) => {
             data.forEach((element) => {
               userHelpers.updateStockDecrease(element);
             });
       
           });
           
   
           res.json({wallet:true,amount:true})
         }else{
           res.json({wallet:true,amount:false})
   
         }
   
       })
   
   
   
      }else if(order['payment-method']=='COD'){
 userHelpers.deleteCart(order.userId).then((data)=>{}) 
 offerHelper.cooponObjectRemovelUser(req.session.user._id).then((data)=>{
 })
 .catch((err)=>{console.log(err);})
 
 userHelpers.getOrderProductQuantity(orderId).then((data) => {
  data.forEach((element) => {
    userHelpers.updateStockDecrease(element);
  });
 });
 
      res.json({ codSuccess: true });
 
   
     }else if(order['payment-method']=='RAZORPAY'){
       userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        console.log("response");
        console.log(response);
        console.log("response");
        response.userId=order.userId
        response.razorpay=true
          res.json(response)
       }).catch((err)=>{
        console.log(err);
       })  
     }else{
      res.json({order:orderId,user:order.userId,total:paypaltotalPrice})
     }
 
 }); 
 
 
   }else{ 
     console.log('-----------------------------------------15-----------------------------------------------');
 
 
   let products = await userHelpers.getCartProductList(req.body.userId);
   let totalPrice = await userHelpers.getGrandTotal(req.body.userId);
   let paypaltotalPrice = await userHelpers.paypalGrandTotal(req.body.userId);
 
   totalPrice = parseInt(totalPrice[0].grandTotal)
   paypaltotalPrice= parseInt(paypaltotalPrice[0].total)
 
   userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
     
          let order=req.body
            
    if(order['payment-method']=='WALLET'){
 
     userHelpers.walletAmountCheck(req.body.userId,totalPrice).then((response)=>{
 
       if(response.walletAmount){
 
         userHelpers.walletAmountReduce(req.body.userId,totalPrice).then((data)=>{})
 
         userHelpers.deleteCart(req.body.userId).then((data)=>{})
 
         userHelpers.changeOrderStatusOnline(orderId).then((data)=>{})
 
         userHelpers.getOrderProductQuantity(orderId).then((data) => {
           data.forEach((element) => {
             userHelpers.updateStockDecrease(element);
           });
     
         });
         
 
         res.json({wallet:true,amount:true})
       }else{
         res.json({wallet:true,amount:false})
 
       }
 
     })
 
 
 
    } else if(order['payment-method']=='COD'){
        
     userHelpers.deleteCart(order.userId).then((data)=>{})
      
     userHelpers.getOrderProductQuantity(orderId).then((data) => {
       data.forEach((element) => {
         userHelpers.updateStockDecrease(element);
       });
 
     });
 
           res.json({ codSuccess: true });
 
        
          }else if(order['payment-method']=='RAZORPAY'){
            userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
 
             response.userId=order.userId
             response.razorpay=true
               res.json(response)
            }).catch((err)=>{
             console.log(err);
            })  
          }else{
           res.json({order:orderId,user:order.userId,total:paypaltotalPrice})
          }
     
   }); 
 
 }
 
 }

const verifyPayment=async(req,res)=>{

  let details=req.body
  console.log('details');
 console.log(details);
 
 userHelpers.verifyRazorPayPayment(details.payment).then(()=>{
 
   userHelpers.changeOrderStatusOnline(details.order.receipt).then((data)=>{})
  
   userHelpers.getOrderProductQuantity(details.order.receipt).then((data) => {
     data.forEach((element) => {
       userHelpers.updateStockDecrease(element);
     });
   });
 
    userHelpers.getuserDetails(req.session.user._id).then((user)=>{
     if(user.coopon){
 
       offerHelper.cooponObjectRemovelUser(user._id).then((data)=>{
       })
       .catch((err)=>{console.log(err);})
   
     }
 
    })
 
  
 
   userHelpers.deleteCart(details.order.userId).then((data)=>{})
    console.log('payment-success');
   res.json({status:true})
 
 }).catch((err)=>{
   console.log('payment-failed');
   console.log(err);
   res.json({status:'payment-failed'})
 })
 
 
 } 

 const payPal=(req, res) => {
  console.log(req.body);
 let {total,user,order}=req.body
 req.session.paypalTotal=total


 
  const create_payment_json = {
    "intent": "sale",
    "payer": { 
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success?order="+ order +'&?user='+ user,
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total":req.session.paypalTotal
        },
        "description": "Hat for the best team ever"
    }] 
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
      throw error;
  } else {
      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.json(payment.links[i].href);
        }
      }
  }  
});  

}

const paypalSuccess=async (req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  let userId=req.query.user
 
  let orderId=req.query.order
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = { 
    "payer_id": payerId, 
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total":req.session.paypalTotal
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error.response);
        throw error;
    } else {
        console.log(JSON.stringify(payment));

        userHelpers.changeOrderStatusOnline(orderId).then((data)=>{})
        userHelpers.getOrderProductQuantity(orderId).then((data) => { 
          data.forEach((element) => {
            userHelpers.updateStockDecrease(element);
          });
        });

        userHelpers.getuserDetails(req.session.user._id).then((user)=>{
          if(user.coopon){
      
            offerHelper.cooponObjectRemovelUser(user._id).then((data)=>{
            })
            .catch((err)=>{console.log(err);})
        
          }
      
         })
      
      
        userHelpers.deleteCart(req.session.user._id).then((data)=>{})  
         res.render('user/order-placed', {noheader: true,cartCount,listCount,
         userLogged:true}) 
          
        
    }
});
}

const orderPlaced= async(req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  res.render("user/order-placed", {
    noheader: true,
    userLogged:true,
    user: req.session.user,
    cartCount,
    listCount
  });
}


const orders= async (req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  let orders = await userHelpers.getUserOders(req.session.user._id);
  res.render("user/orders", {
    noheader: true,
    userLogged:true,
    user: req.session.user,
    orders,
    listCount,
    cartCount
  });
}

const viewOrderProducts=async (req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  let orderProdId= req.params.id
  let products = await userHelpers.getOrderProducts(orderProdId);
  
  let order=await userHelpers.getUserOrder(orderProdId)
  res.render("user/order-products", { noheader: true, userLogged:true, products,cartCount,listCount, orderProdId,order});
}


const orderInvoice=async(req,res)=>{

  let products = await userHelpers.getOrderProducts(req.params.id);
  let order=await userHelpers.getUserOrder(req.params.id)

  console.log("order");
  console.log(products);
  console.log("order");
    res.render('user/invoice', { noheader: true, userLogged:true,products,order})
   
  }

const cancelOrder=(req, res) => {
  userHelpers.orderCancel(req.body.orderId).then((response) => {
    userHelpers.getOrderProductQuantity(req.body.orderId).then((data) => {
      data.forEach((element) => {
        userHelpers.updateStockIncrease(element);
      });
    });
    res.json({ status: true });
  });
}

const orderReturn= (req, res) => {
  userHelpers.orderReturn(req.body.orderId).then((response) => {
    userHelpers.getOrderProductQuantity(req.body.orderId).then((data) => {
      data.forEach((element) => {
        userHelpers.updateStockIncrease(element);
      });
    }); 
    res.json({ status: true });
  });
}

const returnOrderPost=(req,res)=>{
  userHelpers.orderReturn(req.body).then((data)=>{})
  res.redirect("/orders")
 }

 const addAddress=async(req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  let user = req.session.user;

  res.render("user/add-address", { noheader: true, userLogged:true, user,cartCount,listCount });
}


const addAddressPost=(req, res) => {
  userHelpers.addUserAdderss(req.body).then((data) => {});

  res.redirect("/checkout");
}

const deteteAddress=(req, res) => {
  userHelpers.deleteAddress(req.params.id).then((data) => {
    res.redirect("/checkout");
  });
}

const editAddress=(req, res) => {
  userHelpers.findAddress(req.params.id).then((address) => {
    res.render("user/edit-address", { address, user: req.session.user });
  });
}


const editAddress3= (req, res) => {
  userHelpers.editAddress(req.body).then((data) => {});
  res.redirect("/checkout");
}

const userAccount=async (req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
let  cartCount = await userHelpers.getCartCount(req.session.user._id);
let user= await userHelpers.getuserDetails(req.session.user._id)
  userHelpers.getUserAddress(req.session.user._id).then((address) => {
    console.log(address);
    res.render("user/account", {
      cartCount,
      listCount,
      user,
      noheader: true,
      userLogged:true,
      address,
    });
  });
}


const addAddress2=async (req, res) => {
  console.log("hai");
  let user = req.session.user;
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  res.render("user/add-address2", { noheader: true, userLogged:true, user,cartCount,listCount });
}

const addAddress2Post=(req, res) => {
  userHelpers.addUserAdderss(req.body).then((data) => {});

  res.redirect("/user-account");
}

const deleteAddress2=(req, res) => {
  userHelpers.deleteAddress(req.params.id).then((data) => {
    res.redirect("/user-account");
  });
}

const editAddress2=(req, res) => {
  userHelpers.findAddress(req.params.id).then((address) => {
    res.render("user/editAddress", { address, user: req.session.user });
  });
}


const editAddress4=(req, res) => {
  userHelpers.editAddress(req.body).then((data) => {});
  res.redirect("/user-account");
}

const editUserDetails=(req, res) => {
  let permissionMessage
  if( req.session.permissionMessage){
    permissionMessage= req.session.permissionMessage
  }
  userHelpers.getuserDetails(req.session.user._id).then((user) => {
    res.render("user/editUserDetails", { user ,permissionMessage});
    req.session.permissionMessage=""
    permissionMessage=" "
  });
}


const editUserDetailsPost=(req, res) => {
  console.log(req.body);
  userHelpers.editUserDetails(req.body).then((response)=>{
  if(response.mobileExist){

         res.redirect("/edit-userdetails")
         req.session.permissionMessage=response.message
  }else if(response.emailExist){
    res.redirect("/edit-userdetails")
    req.session.permissionMessage=response.message
  }else{

    res.redirect("/user-account")

  }
  }); 
}

const changePassword=(req,res)=>{
  let permissionMessage
  if( req.session.permissionMessage){
    permissionMessage= req.session.permissionMessage
  }
 
  res.render('user/changePassword',{user:req.session.user,permissionMessage})
  req.session.permissionMessage=""
  permissionMessage=" "

}

const changePasswordPost=(req,res)=>{
  console.log(req.body);
    userHelpers.checkOldPassword(req.body).then((data)=>{
  
      if(data){
        res.render('user/new-password',{user:req.session.user})
      }else{
        req.session.permissionMessage="password is incorrect"
        res.redirect('/change-password')
      }
  
    })
  
  }

  const addCartWishlist=(req,res)=>{
    let productId=req.params.id
    let userId=req.session.user._id
    console.log(productId);
    console.log(userId);
    console.log('---------');
     wishlistCartManagement.addToWishlist(productId,userId).then((data)=>{})
    res.redirect("/wishlist")
  }

module.exports={

    verifyLogin,
    home,
    signup,
    signupPost,
    login,
    loginPost,
    otplogin,
    verifiOtp2,
    verifyOTP,
    product,
    cart,
    changeProductQuantity,
    addToCart,
    removeProduct,
    checkOut,
    applyCoupon,
    removeCoupun,
    placeOrder,
    verifyPayment,
    payPal,
    paypalSuccess,
    orderPlaced,
    orders,
    viewOrderProducts,
    orderInvoice,
    cancelOrder,
    orderReturn,
    returnOrderPost,
    addAddress,
    addAddressPost,
    deteteAddress,
    editAddress,
    editAddress3,
    userAccount,
    addAddress2,
    addAddress2Post,
    deleteAddress2,
    editAddress2,
    editAddress4,
    editUserDetails,
    editUserDetailsPost,
    changePassword,
    changePasswordPost,
    addCartWishlist

}