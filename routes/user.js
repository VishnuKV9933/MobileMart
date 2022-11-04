var express = require("express");

var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const offerHelper=require('../helpers/adminOfferManagement')
const wishlistCartManagement= require("../helpers/wishlistAndCartmanagement")
const {verifyLogin,home,signup,signupPost,login,loginPost,otplogin,verifiOtp2,verifyOTP,product,cart,changeProductQuantity,addToCart,
removeProduct,checkOut,applyCoupon,removeCoupun,placeOrder,verifyPayment,payPal,paypalSuccess}=require("../controlers/userControler")

let accountSID = "AC6bd96a8cfa637f5e8a890b9b0f8a0b88";
let accountToken = "f487d1fd482b90e07042e592e9409672";
let serviceId = "VA23c95a671510d60f4525101b2a3cdd6f";

let ACCOUNT_SID = "ACa5f9ac4f0b72d68d7e8ef0480c4f63ca";
let AUTH_TOKEN = "7523c17978c33a6c251a8bde2b085458";
let SERVICE_ID = "VA2d9832551c0140f909c9c672bea8710c";
const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


const paypal = require('paypal-rest-sdk');
const { response } = require("../app");

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'Aa_QCx82uFuPzkHCWimiSFSPyrhvR0w6iDCvz5cXbb7ZWtngPvo88EiSFhtY8azJfz6G6iKJDEKuOFlZ',
  'client_secret': 'EDZdfQK2nq1eaYwYgk4YrtgHLDjFgCLPieZPY_YfUM8bIVCCM0iGlTp3AVoARig4U8tTYV-h5SCuSZKg'
});






router.get("/",home);

router.get("/signup",signup);

router.post("/signup",signupPost);

router.get("/login",login);

router.post("/login",loginPost);

router.get("/otplogin",otplogin);

router.get("/otpverify2",verifiOtp2);

router.get("/otpverify",verifyOTP);

router.get("/product/:id",product);

router.get("/cart",verifyLogin,cart);

router.post("/change-product-quantity",changeProductQuantity);

router.get("/add-to-cart/:id",addToCart);

router.post("/remove-product",removeProduct);

router.get("/checkout", verifyLogin,checkOut);

router.post('/apply-coopon',applyCoupon)

router.get('/removeCoupun',verifyLogin,removeCoupun)

router.post("/place-order", placeOrder);

router.post('/verify-payment',verifyPayment)

router.post('/pay',payPal);
 
router.get('/success',paypalSuccess);  
 
router.get("/order-placed", async(req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  res.render("user/order-placed", {
    noheader: true,
    userLogged:true,
    user: req.session.user,
    cartCount,
    listCount
  });
});

router.get("/orders", verifyLogin, async (req, res) => {
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
});

router.get("/view-order-products/:id", verifyLogin, async (req, res) => {
  req.session.user.orderProdId = req.params.id;
  res.redirect("/view-order-products");
});

router.get("/view-order-products",verifyLogin,async (req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  let orderProdId= req.session.user.orderProdId
  let products = await userHelpers.getOrderProducts(orderProdId);
  
  let order=await userHelpers.getUserOrder(orderProdId)
  res.render("user/order-products", { noheader: true, userLogged:true, products,cartCount,listCount, orderProdId,order});
});


router.get("/view-orderInvoice/:id",(req,res)=>{

  
req.session.user.id=req.params.id

  res.redirect('/view-orderInvoice2')

})

 
router.get("/view-orderInvoice2",async(req,res)=>{
  console.log(req.session.id);
  console.log(req.session.id); 
  console.log(req.session.id); 
  let products = await userHelpers.getOrderProducts(req.session.user.id);
  let order=await userHelpers.getUserOrder(req.session.user.id)

  console.log("order");
  console.log(products);
  console.log("order");
    res.render('user/invoice', { noheader: true, userLogged:true,products,order})
   
  })
   


router.post("/order-cancel", (req, res) => {
  userHelpers.orderCancel(req.body.orderId).then((response) => {
    userHelpers.getOrderProductQuantity(req.body.orderId).then((data) => {
      data.forEach((element) => {
        userHelpers.updateStockIncrease(element);
      });
    });
    res.json({ status: true });
  });
});

router.post("/order-return", (req, res) => {
  userHelpers.orderReturn(req.body.orderId).then((response) => {
    userHelpers.getOrderProductQuantity(req.body.orderId).then((data) => {
      data.forEach((element) => {
        userHelpers.updateStockIncrease(element);
      });
    }); 
    res.json({ status: true });
  });
});


router.post('/return-order',(req,res)=>{

  userHelpers.orderReturn(req.body).then((data)=>{})
  console.log('return');
  console.log('return');
  console.log('return');
  res.redirect("/orders")

 })



router.get("/brand-products/:id",async (req, res) => {
  let brands=await productHelpers.getAllBrand()
  productHelpers.getBrandProducts(req.params.id).then((products) => {
    res.render("user/brand-products", { noheader: true, userLogged:true, products,brands });
  });
});

router.get("/brand-products2/", async(req, res) => {

});

/*------------------------------------------------------------------address-----------------------------------------------------------------*/

router.get("/add-address", verifyLogin, async(req, res) => {
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  let user = req.session.user;

  res.render("user/add-address", { noheader: true, userLogged:true, user,cartCount,listCount });
});

router.post("/add-address", (req, res) => {
  userHelpers.addUserAdderss(req.body).then((data) => {});

  res.redirect("/checkout");
});

//-------------------------------------------------------


router.get("/delete-address/:id", (req, res) => {
  userHelpers.deleteAddress(req.params.id).then((data) => {
    res.redirect("/checkout");
  });
});

router.get("/edit-address/:id", (req, res) => {
  userHelpers.findAddress(req.params.id).then((address) => {
    res.render("user/edit-address", { address, user: req.session.user });
  });
});

router.post("/edit-address-3", (req, res) => {
  userHelpers.editAddress(req.body).then((data) => {});
  res.redirect("/checkout");
});
//---------------------------------------------useraccount---------------------------------------------------------
router.get("/user-account", verifyLogin, async (req, res) => {
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
});



router.get("/add-address2", verifyLogin,async (req, res) => {
  console.log("hai");
  let user = req.session.user;
  let  listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
 let   cartCount = await userHelpers.getCartCount(req.session.user._id);
  res.render("user/add-address2", { noheader: true, userLogged:true, user,cartCount,listCount });
});

router.post("/add-address2", (req, res) => {
  userHelpers.addUserAdderss(req.body).then((data) => {});

  res.redirect("/user-account");
});

router.get("/delete-address2/:id", (req, res) => {
  userHelpers.deleteAddress(req.params.id).then((data) => {
    res.redirect("/user-account");
  });
});

router.get("/editAddress/:id", (req, res) => {
  userHelpers.findAddress(req.params.id).then((address) => {
    res.render("user/editAddress", { address, user: req.session.user });
  });
});

router.post("/editAddress-3", (req, res) => {
  userHelpers.editAddress(req.body).then((data) => {});
  res.redirect("/user-account");
});

router.get("/edit-userdetails", verifyLogin, (req, res) => {
  let permissionMessage
  if( req.session.permissionMessage){
    permissionMessage= req.session.permissionMessage
  }
  userHelpers.getuserDetails(req.session.user._id).then((user) => {
    res.render("user/editUserDetails", { user ,permissionMessage});
    req.session.permissionMessage=""
    permissionMessage=" "
  });
});

router.post("/edit-userDetails", (req, res) => {
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
});

router.get('/change-password',verifyLogin,(req,res)=>{
  let permissionMessage
  if( req.session.permissionMessage){
    permissionMessage= req.session.permissionMessage
  }
 
  res.render('user/changePassword',{user:req.session.user,permissionMessage})
  req.session.permissionMessage=""
  permissionMessage=" "

})

router.post('/change-password',(req,res)=>{
console.log(req.body);
  userHelpers.checkOldPassword(req.body).then((data)=>{

    if(data){
      res.render('user/new-password',{user:req.session.user})
    }else{
      req.session.permissionMessage="password is incorrect"
      res.redirect('/change-password')
    }

  })

})

router.post('/new-password',verifyLogin,(req,res)=>{

  userHelpers.changePassword(req.body).then((data)=>{
    
    res.redirect("/user-account");
  })

})

router.get('/add-cartWishlist/:id',(req,res)=>{
  let productId=req.params.id
  let userId=req.session.user._id
  console.log(productId);
  console.log(userId);
  console.log('---------');
   wishlistCartManagement.addToWishlist(productId,userId).then((data)=>{})
  res.redirect("/wishlist")
})



// --------------------------------------wishlist----------------------------

router.get('/wishlist',verifyLogin,async(req,res)=>{

  let listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
let products=  await wishlistCartManagement.getWishlistProducts(req.session.user._id)
console.log(products);
  res.render("user/wishlist",{noheader: true, userLogged:true,products,cartCount,listCount})
})

router.get('/add-wishlist/:id',(req,res)=>{
  let productId=req.params.id
  let userId=req.session.user._id
 
   wishlistCartManagement.addToWishlist(productId,userId).then((data)=>{})
  res.redirect("/")
})


router.get("/add-to-cart-wishlist/:id", (req, res) => {
  console.log("------------1-------------");
  console.log(req.session.user._id);
  console.log(req.params.id);
  userHelpers.addToCart(req.params.id, req.session.user._id).then((data) => {
    console.log(data);
    if (data.success) {
      console.log("success");
      req.session.user.viewid5=req.params.id
      res.json({ status: true });
    } else if (data.outOfStock) {
      console.log("out of stock");
      res.json({ status: false });
    }


  });

});

router.get('/delete-from-WishList',(req,res)=>{

  wishlistCartManagement.removeWishListProduct(req.session.user._id, req.session.user.viewid5).then((data)=>{

  }).catch((err)=>{
    console.log(err);
  })
  res.redirect('/cart')
})




router.get('/remove-from-wishlist/:id',(req,res)=>{

  wishlistCartManagement.removeWishListProduct(req.session.user._id,req.params.id).then((data)=>{

  }).catch((err)=>{
    console.log(err);
  })
  res.redirect('/wishlist')
})
 

router.post('/category-filter',verifyLogin,(req,res)=>{

userHelpers.filteredProducts(req.body).then((products)=>{

  req.session.user.categoryFilterProducts=products

  res.redirect('/category-filter')
  
}) 
     
}) 
 
router.get('/category-filter',verifyLogin,async(req,res)=>{

  let brands=await productHelpers.getAllBrand()

  let products=req.session.user.categoryFilterProducts

  res.render('user/category-filter',{noheader: true, userLogged:true, products,brands})
  
})
 
router.get('/view-products',(req,res)=>{

 req.session.viewid6= req.query.page

 res.redirect('/view-products2')
}) 


async function pagination(req, res, next) {   
   
  // let page = parseInt(req.query.page)
  let page = parseInt(req.session.viewid6)

  console.log("page")
  console.log(page)

 
  const limit = 2
  const startIndex = (page - 1) * limit
  const endIndex = page * limit

  const results = {}
  
  let productsCount = await productHelpers.getProductsCount()
  

if (endIndex < productsCount) {
    results.next = {
      page: page + 1,
      limit: limit
    }
  }
  
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit
    }
  }
  try {
    results.products = await productHelpers.getProductnfo(limit,startIndex)
    // console.log(results.products); 
    results.pageCount =Math.ceil(parseInt(productsCount)/parseInt(limit)).toString()
    results.pages =Array.from({length: results.pageCount}, (_, i) => i + 1)    
    results.currentPage =page.toString()

    console.log(results.pageCount)
    console.log('=============')
    console.log(results)
    console.log('==========')  
    console.log(results.currentPage)
    
    res.paginatedResults = results   
    
    next()

  } catch (e) {
    res.status(500).json({ message: e.message})
}
}

router.get('/view-products2',pagination,async(req,res)=>{
// let products =await productHelpers.getAllproducts()
console.log();
let products=res.paginatedResults.products
let next =res.paginatedResults.next
let previous =res.paginatedResults.previous
let pages =res.paginatedResults.pages
let pageCount =res.paginatedResults.pageCount 
let currentPage =res.paginatedResults.currentPage  

console.log(currentPage);
console.log("currentPage");

  res.render('user/view-products',{noheader: true, userLogged:true, products,next,previous,pages,pageCount,currentPage,viewProduct:true})
  

})

router.post('/getProducts',async(req,res)=>{
  let payload=req.body.payload.trim()

  console.log(payload);

 let search=await userHelpers.getSearchResults(payload)
console.log(search);
res.send({payload:search})
    
})



// logout means session cleared
router.get("/logout", (req, res) => {
  userLogged=null
  cartCount = null;
  req.session.user = null;
  orderProdId = null;
  req.session.categoryFilterProducts=null
  res.redirect("/");
});


router.get('/work',(req,res)=>{


  let limit=parseInt(4)
  let page=parseInt(3)
  
  let startIn=(page-1)*limit
  let endIn=(page)*limit
  let user=[
      {id:1,name:"user_1"},
      {id:2,name:"user_2"},
      {id:3,name:"user_3"},
      {id:4,name:"user_4"},
      {id:5,name:"user_5"},
      {id:6,name:"user_6"},
      {id:7,name:"user_7"},
      {id:8,name:"user_8"},
      {id:9,name:"user_9"},
      {id:10,name:"user_10"},
    ]

      let result={}
     result.result=user.slice(startIn,endIn)
  if(endIn<user.length){ 
    result.next={
      page:page+1,
      limit:limit
    }}

   if(startIn>0){ 
    result.previous={
      page:page-1,
      limit:limit
    }}
     console.log(startIn);

     console.log(endIn);


  console.log(result);

  res.render('user/invoice')
})
module.exports = router;



