const express = require("express");  
const router = express.Router();
const { upload }=require('../public/javascripts/fileUpload')
const {home,userList,addProductsGet,addProductsPost,editProductsGet,editProductsPost,productList,deleteProduct,blockUser,unblockUser,
editUser,block,unblock,orders,getOrderProducts,refund,changeOrderStatusPost,returnOrders,returnDetails,changeReturnStatus,
wallet,categoryManagement,addBrand,addBrandPost,editBrand,editBrandPost,deleteBrand,salesReport,categoryOffer,addCategoryOfferPost,
editCategoryOfferPost,deleteCategoryOffer,productOffer,productOfferPost,editProductOfferPost,deleteProductOffer,couponManagement,
addCouponPost,deleteCoupon,logout,homePost,verify,credential}=require('../controlers/admincontroler')

   

router.post("/",homePost);

router.get("/",home);

router.get("/users-list",verify,userList)

router.get("/add-products", verify,addProductsGet);

router.post("/add-products",verify, upload.array('image'),addProductsPost);

router.get("/edit-product/:id",verify,editProductsGet);

router.post("/edit-product/:id",verify,upload.array('image'),editProductsPost);
 
router.get("/products-list", verify,productList);

router.get("/delete-product/:id",deleteProduct);

router.get("/block-user/:id",blockUser);

router.get("/unblock-user/:id",unblockUser);

router.post("/edit-user/:id",editUser);

router.get("/block/:id",block);

router.get("/unblock/:id",unblock);

router.get("/orders",verify,orders);

router.get("/order-products/:id",verify,getOrderProducts);

router.get("/refund/:id",refund)

router.post('/changeOrderStatus',changeOrderStatusPost)

router.get("/return-orders",verify,returnOrders);
 
router.get("/return-details/:id",verify,returnDetails);

router.post('/changeReturnStatus',changeReturnStatus)
 
router.get("/wallet/:id",verify,wallet)       

router.get("/categoryManagement",verify,categoryManagement);

router.get("/addBrand",addBrand);
 
router.post("/addBrand", upload.any('image'),addBrandPost);

router.get("/editBrand/:id",verify,editBrand);

router.post("/editBrand/:id", upload.any('image'),editBrandPost);

router.get("/deleteBrand/:id",deleteBrand)

router.get("/sales-report",verify,salesReport)

router.get('/categery-offer',verify,categoryOffer)

router.post('/add-categery-offer',addCategoryOfferPost)

router.post('/edit-categery-offer',editCategoryOfferPost)

router.get('/delete-category-offer/:id',deleteCategoryOffer)

router.get('/product-offer',verify,productOffer)

router.post('/add-product-offer',productOfferPost)

router.post('/edit-prodcuct-offer',editProductOfferPost)

router.get('/delete-product-offer/:id',deleteProductOffer)

router.get('/coopon-management',verify,couponManagement)

router.post('/add-coopon',addCouponPost)

router.get('/delete-coupon/:id',deleteCoupon)

router.get("/logout",logout);

module.exports = router;









