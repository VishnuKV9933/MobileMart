var db = require("../configuration/connection");
const collection = require("../configuration/collection");
const productHelpers = require("../helpers/product-helpers");
const { response } = require("../app");
const graphHelpers=require("../helpers/graphHelpers")
const offerHelper=require("../helpers/adminOfferManagement")
var objectId = require("mongodb").ObjectId;
const userHelpers = require("../helpers/user-helpers");
require('dotenv').config();

const credential = {
  email: process.env.email,
  password: process.env.password,
};

const verify = function (req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin/");
  }
};

const homePost=function (req, res, next) {
  if (
    req.body.email == credential.email &&
    req.body.password == credential.password
  ) {
    req.session.admin = true;
    res.redirect("/admin");
  } else {
   req.session.loginErr = "Invalid id or password";
   
    res.redirect("/admin");
  }
}


const home=async function(req, res, next) {
  let loginErr
  if(req.session.loginErr){
    loginErr=req.session.loginErr
  }
  if (req.session.admin) {
    let todaOrderCount=await graphHelpers.todaOrderCount()
    let monthlYTotalSale=await graphHelpers.monthlYTotalSale()
    let getAllPaymentTotalSale=await graphHelpers.getAllPaymentTotalSale()
    let brandSales=await graphHelpers.brandSales()    
    let userCount=await userHelpers.userCount()
    let returnCount=await userHelpers.getReturnCounts()
    let response=await graphHelpers.getTotalSalesGraph()
     let {dailySale,monthSales,yearlySale}=response
    userHelpers.getAllusers().then((products) => {
      graphHelpers.getDailyPaymentSales().then(({razorpay,paypal,COD})=>{
        res.render("admin/dashboard", { admin: true, noheader:true,dailySale,monthSales,getAllPaymentTotalSale,todaOrderCount,userCount,
          monthlYTotalSale,yearlySale,returnCount,brandSales,razorpay,paypal,COD});
        })
    });
    } else {
     
      res.render("admin/login", { loginErr });
      loginErr = false;
      req.session.loginErr=null
    }
  }



const userList=function (req, res) {
  userHelpers.getAllusers().then((products) => {
    console.log(products);
    res.render("admin/users-list", { admin: true, products, noheader: true });
  });
}

const addProductsGet=function (req, res) {

  productHelpers.getAllBrand().then((brand)=>{
    res.render("admin/add-product",{brand});
  })
  
}

const addProductsPost=(req, res) => {
  console.log("post");
  const files = req.files
    const file = files.map((file)=>{
        return file
    })
    const fileName = file.map((file)=>{
        return file.filename
    })
    const product = req.body
    product.img = fileName
  productHelpers.addProduct(product).then((data) => {
    
    res.redirect("/admin/products-list");
  });
}  
  
const editProductsGet= async (req, res) => {
  await productHelpers.getProductDetails(req.params.id).then((product) => {
       productHelpers.getAllBrand().then((brand)=>{
        res.render("admin/edit-product", { product,brand });
       })
  });
}

const editProductsPost=async(req, res) => {

  let oldProducts=await productHelpers.getProductDetails(req.params.id)
  
  
  const files = req.files
  if(req.files.length!=0){
    console.log(files)

  let fileName
    fileName = files.map((file)=>{
      return file.filename
  })
  req.body.img =fileName
  }else{
    req.body.img=oldProducts.img
  }
  const product = req.body
  
  product.id=req.params.id
  await productHelpers
    .updateProduct(req.body)
    .then((product) => {
      res.redirect("/admin/products-list");
    });
    
}

const productList = async (req, res) => {
  await productHelpers.getAllproducts().then((products) => {
    res.render("admin/products-list", { products, admin: true });
  });
}

const deleteProduct=(req, res) => {
  let id = req.params.id;
  productHelpers.deleteProduct(id).then((response) => { 
    res.redirect("/admin/products-list");
  });
}

const blockUser=(req, res) => {
  let id = req.params.id;
  userHelpers.blockUser(id).then(() => {
    res.redirect("/admin/users-list");
  });
}

const unblockUser=(req, res) => {
  let id = req.params.id;
  userHelpers.unblockUser(id).then(() => {
    res.redirect("/admin/users-list");
  });
}

const editUser=(req, res) => {
  console.log(req.body);
  userHelpers.updateuser(req.params.id, req.body).then(() => {
    res.redirect("/admin/viewp");
  });
}

const block=(req, res) => {
  productHelpers.nonvisiblity(req.params.id).then(() => {
    res.redirect("/admin/products-list");
  });
}

const unblock=(req, res) => {
  productHelpers.visiblity(req.params.id).then(() => {
    res.redirect("/admin/products-list");
  });
}

const orders= async(req, res) => {

  let orders= await userHelpers.getAllOders()

    res.render("admin/orders",{admin: true,orders });
  
}

const getOrderProducts=async(req, res) => {
  let orderId=req.params.id
  
  let order=await userHelpers.getOrder(orderId)
  console.log(order);
  
    let products= await userHelpers.getOrderProducts(orderId)
     
      res.render("admin/order-products",{admin: true,products,orderId,order});
    
  }

  const refund=(req,res)=>{
    console.log(req.params.id);
      userHelpers.refund(req.params.id).then(()=>{
        res.redirect('/admin//orders')
      })
    
    }

   const changeOrderStatusPost=(req,res)=>{
    userHelpers.changeOrderStatus(req.body).then((data)=>{

      res.json({response:true})
  
    })
    
   }

   const returnOrders=async(req, res) => {

    let returnOrders=await userHelpers.getAllReturnOrders()
   
    res.render("admin/return-product",{admin: true,returnOrders});
       
     }

   const returnDetails=async(req, res) => {
    let order=await userHelpers.getReturnOrder(req.params.id)
     userHelpers.getReturnProducts(req.params.id).then((returnOrders)=>{
       res.render("admin/return-details",{admin: true,returnOrders,order});
     })
      }  


  const changeReturnStatus=(req,res)=>{
      userHelpers.changeReturnStatus(req.body).then((data)=>{
        console.log(req.body);
      })
      res.json(response)
      
     }    


const wallet=async(req, res) => {

  console.log(req.params.id);
  userHelpers.addTowallet(req.params.id).then((data)=>{
    res.redirect('/admin/orders')

  })
 }

const categoryManagement=async(req, res) => {

  productHelpers.getAllBrand().then((brand)=>{
    console.log(brand);

    res.render("admin/categoryManagement",{admin: true,brand});
  })

}


const addBrand=async(req, res) => {
 let message
  if(req.session.message){
    message=req.session.message
  }
  res.render("admin/addBrand",{admin: true,message});
  message=""
  req.session.message=" "

}



const addBrandPost=async(req, res) => {

  const files = req.files
  const file = files.map((file)=>{
      return file
  })
  const fileName = file.map((file)=>{
      return file.filename
  })
  const product = req.body
  product.img = fileName

productHelpers.addBrand(product).then((response)=>{

  if(response.exists){
req.session.message=response.message
    res.redirect("/admin/addBrand")
  }else{
    res.redirect('/admin/categoryManagement')
  }

})
}

const editBrand=async(req, res) => {
let message
if(req.session.message){
  message=req.session.message
}
  productHelpers.getBrand(req.params.id).then((brand)=>{
    
    res.render("admin/editBrand",{admin: true,brand,message});
     message=""
     req.session.message=" "
  })

}


const editBrandPost=(req, res) => {
 

  const files = req.files
  const file = files.map((file)=>{
      return file
  })
  const fileName = file.map((file)=>{
      return file.filename
  })
  const product = req.body
  product.img = fileName

  productHelpers.editBrand(req.params.id,product).then((response)=>{
    let id=req.params.id
    if(response.exists){
      req.session.message=response.message
       res.redirect("/admin/editBrand/"+id);
    
    }else{
      res.redirect('/admin/categoryManagement')
    }
  })

}

const deleteBrand=(req,res)=>{

  productHelpers.deleteBrand(req.params.id).then((response)=>{
    console.log(response);

     res.redirect('/admin/categoryManagement')
  })
}

const salesReport=async(req,res)=>{


  let dailyReport=await productHelpers.getDailyReport()
  console.log(dailyReport);
  
  let dailyTotalAmount= await productHelpers.getDailyTotalSale()
  console.log(dailyTotalAmount);
  
  let monthlyReport= await productHelpers.getMonthlyReport()
  console.log(monthlyReport);
  
  let monthlyTotalAmount= await productHelpers.getMonthlyTotalSale()
  console.log(monthlyTotalAmount);
  
  let yearlyReport= await productHelpers.getYearlyReport()
  console.log(monthlyTotalAmount);
    
  let yearlyTotalAmount= await productHelpers.getYearlyTotalSale()
  console.log(monthlyTotalAmount);
  
     res.render('admin/sales-report',{admin: true,dailyReport,dailyTotalAmount,monthlyReport,
      monthlyTotalAmount,yearlyReport,yearlyTotalAmount})
  
  }

  const categoryOffer=async(req,res)=>{
 
    let brands= await offerHelper.getOfferBrands()
   
     res.render('admin/category-offer',{admin: true,brands,modal:true})
   }

const addCategoryOfferPost=async(req,res)=>{
let offerProducts=await offerHelper.getOfferBrandProducts(req.body)
offerProducts.forEach(element => {
offerHelper.addBrandOffer(element,req.body)
});
res.redirect('/admin/categery-offer')
}

  const editCategoryOfferPost=async(req,res)=>{
    let offerProducts=await offerHelper.getOfferBrandProducts(req.body)
    offerProducts.forEach(element => {
    offerHelper.addBrandOffer(element,req.body)
    });
    res.redirect('/admin/categery-offer')
    }

const deleteCategoryOffer=async(req,res)=>{
  products=await offerHelper.brandOfferDeleteStatus(req.params.id)
  products.forEach(product => {
   offerHelper.brandOfferProductChange(product)
  });
  res.redirect('/admin/categery-offer')
  }    

const productOffer=async(req,res)=>{
  await productHelpers.getAllproducts().then((products) => {
   res.render("admin/product-offer", { products, admin: true,modal:true });
 });
}  

const productOfferPost=async(req,res)=>{
  offerHelper.addProductOffer(req.body)
  res.redirect('/admin/product-offer')
  }

const editProductOfferPost=async(req,res)=>{
  offerHelper.editProductOffer(req.body)
    res.redirect('/admin/product-offer')
    }  
const deleteProductOffer=async(req,res)=>{
  offerHelper.deleteProductOffer(req.params.id)
  res.redirect('/admin/product-offer')
 }

 const couponManagement=async(req,res)=>{
 let globelResponse
 if(req.session.globelResponse){
  globelResponse=req.session.globelResponse
 }
  let coopons= await offerHelper.getAllCoopon()
  res.render('admin/coopon-management',{ admin: true,coopons,globelResponse})
  globelResponse=null
  req.session.globelResponse=null

 }

 const addCouponPost=(req,res)=>{
  offerHelper.addCoopen(req.body).then((response)=>{

    if(response.status){
     req.session.globelResponse=response
      
      res.redirect('/admin/coopon-management')
    }else{
     req.session.globelResponse=response
      res.redirect('/admin/coopon-management')
    }


  })
 }

 const deleteCoupon=async(req,res)=>{
 
  offerHelper.deleteCoupon(req.params.id).then((data)=>{

   res.redirect('/admin/coopon-management')


  })
  .catch((err)=>{
   console.log(err);
  })
  }

  const logout=(req, res) => {
    req.session.admin = false;
    res.redirect("/admin");
  }


  module.exports={
    home,
    userList,
    addProductsGet,
    addProductsPost,
    editProductsGet,
    editProductsPost,
    productList,
    deleteProduct,
    blockUser,
    unblockUser,
    editUser,
    block,
    unblock,
    orders,
    getOrderProducts,
    refund,
    changeOrderStatusPost,
    returnOrders,
    returnDetails,
    changeReturnStatus,
    wallet,
    categoryManagement,
    addBrand,
    addBrandPost,
    editBrand,
    editBrandPost,
    deleteBrand,
    salesReport,
    categoryOffer,
    addCategoryOfferPost,
    editCategoryOfferPost,
    deleteCategoryOffer,
    productOffer,
    productOfferPost,
    editProductOfferPost,
    deleteProductOffer,
    couponManagement,
    addCouponPost,
    deleteCoupon,
    logout,
    homePost,
    verify,
    credential
}