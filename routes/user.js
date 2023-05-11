var express = require("express");

var router = express.Router();
const productHelpers = require("../helpers/product-helpers");
const userHelpers = require("../helpers/user-helpers");
const offerHelper=require('../helpers/adminOfferManagement')
const wishlistCartManagement= require("../helpers/wishlistAndCartmanagement")
const {verifyLogin,home,signup,signupPost,login,loginPost,otplogin,verifiOtp2,verifyOTP,product,cart,changeProductQuantity,addToCart,
removeProduct,checkOut,applyCoupon,removeCoupun,placeOrder,verifyPayment,payPal,paypalSuccess,orderPlaced,orders,viewOrderProducts,
orderInvoice,cancelOrder,orderReturn,returnOrderPost,addAddress,addAddressPost,deteteAddress,editAddress,editAddress3,userAccount,
addAddress2,addAddress2Post,deleteAddress2,editAddress2,editAddress4,editUserDetails,editUserDetailsPost,changePassword,
changePasswordPost,addCartWishlist,newPassword}=require("../controlers/userControler")


const paypal = require('paypal-rest-sdk');
const { response } = require("../app");

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

router.post("/change-product-quantity",verifyLogin,changeProductQuantity);

router.get("/add-to-cart/:id",addToCart);

router.post("/remove-product",removeProduct);

router.get("/checkout", verifyLogin,checkOut);

router.post('/apply-coopon',verifyLogin,applyCoupon)

router.get('/removeCoupun',verifyLogin,removeCoupun)

router.post("/place-order",verifyLogin, placeOrder);

router.post('/verify-payment',verifyPayment) 

router.post('/pay',payPal);
 
router.get('/success',paypalSuccess);  
 
router.get("/order-placed",orderPlaced);

router.get("/orders", verifyLogin,orders); 

router.get("/view-order-products/:id",verifyLogin,viewOrderProducts);
 
router.get("/view-orderInvoice/:id",orderInvoice)
   
router.post("/order-cancel",cancelOrder);

router.post("/order-return",orderReturn);

router.post('/return-order',returnOrderPost)
/*------------------------------------------------------------------address-----------------------------------------------------------------*/
router.get("/add-address", verifyLogin,addAddress);

router.post("/add-address",addAddressPost);

router.get("/delete-address/:id",deteteAddress);

router.get("/edit-address/:id",editAddress);

router.post("/edit-address-3",editAddress3);
//---------------------------------------------useraccount---------------------------------------------------------
router.get("/user-account", verifyLogin,userAccount);

router.get("/add-address2", verifyLogin,addAddress2);

router.post("/add-address2",addAddress2Post);

router.get("/delete-address2/:id",deleteAddress2);

router.get("/editAddress/:id", editAddress2);

router.post("/editAddress-3", editAddress4);

router.get("/edit-userdetails", verifyLogin, editUserDetails);

router.post("/edit-userDetails", editUserDetailsPost);

router.get('/change-password',verifyLogin,changePassword)

router.post('/change-password',changePasswordPost)

router.post('/new-password',verifyLogin,newPassword)

router.get('/add-cartWishlist/:id',addCartWishlist)



// --------------------------------------wishlist----------------------------

router.get('/wishlist',verifyLogin,async(req,res)=>{

  let listCount=await wishlistCartManagement.wishListCount(req.session.user._id)
  
  let cartCount = await userHelpers.getCartCount(req.session.user._id);
let products=  await wishlistCartManagement.getWishlistProducts(req.session.user._id)
console.log(products);
  res.render("user/wishlist",{noheader: true, userLogged:true,products,cartCount,listCount})
})

router.get('/add-wishlist/:id',verifyLogin,(req,res)=>{

  let productId=req.params.id
  let userId=req.session.user._id
 
   wishlistCartManagement.addToWishlist(productId,userId).then((data)=>{})
  res.redirect("/wishlist")
}) 


router.get("/add-to-cart-wishlist/:id",(req, res) => {
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
 

router.get("/brand-products/:id",async (req, res) => {
  let brands=await productHelpers.getAllBrand()
  productHelpers.getBrandProducts(req.params.id).then((products) => {
    res.render("user/brand-products", { noheader: true, userLogged:true, products,brands });
  });
});

router.post('/category-filter',(req,res)=>{

  console.log(req.body);

  console.log("req.body");
userHelpers.filteredProducts(req.body).then((products)=>{

  req.session.categoryFilterProducts=products

  res.redirect('/category-filter')
  
}) 
     
}) 
 
router.get('/category-filter',async(req,res)=>{

  let userLogged
  if(req.session.user){
    userLogged=true
  }

  let brands=await productHelpers.getAllBrand()

  let products=req.session.categoryFilterProducts

  res.render('user/category-filter',{noheader: true, userLogged, products,brands})
  
})
 


async function pagination(req, res, next) {   
   
 
  let page = parseInt(req.query.page)

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

 

router.get('/view-products',pagination,async(req,res)=>{
  let   userLogged
  if(req.session.user){
    userLogged=true
  }

let products=res.paginatedResults.products
let next =res.paginatedResults.next
let previous =res.paginatedResults.previous
let pages =res.paginatedResults.pages
let pageCount =res.paginatedResults.pageCount 
let currentPage =res.paginatedResults.currentPage  

console.log(currentPage);
console.log("currentPage");

  res.render('user/view-products',{noheader: true, userLogged, products,next,previous,pages,pageCount,currentPage,viewProduct:true})
  

})

router.post('/getProducts',async(req,res)=>{
  let payload=req.body.payload.trim()



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


module.exports = router;



