const { ObjectId } = require('mongodb');
var db=require('../configuration/connection')

var objectId=require('mongodb').ObjectId
const collection=require('../configuration/collection');
const { response } = require('../app');
const { PRODUCT_COLLLECTION, CART_COLLECTION } = require('../configuration/collection');


// var collection=require('../configuration/connection')


module.exports={

addProduct:(product)=>{

    product.brandId=objectId(product.brandId)
    product.visiblity=true
    product.price=parseInt(product.price)
    product.stock=parseInt( product.stock)
    product.originalPrice=product.price
    product.productOffer=false
 

      return new Promise(async(resolve,reject)=>{

        let brand=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:product.brandId})


        if(brand.brandOffer){
             let offerPrice=(product.price*brand.brandOfferPercent)/100
             let price=parseInt(product.price-offerPrice)
            product.price=price
            product.offer=true
            product.brandOffer=true
            product.brandOfferPercent=brand.brandOfferPercent
            db.get().collection(collection.PRODUCT_COLLLECTION).insertOne(product).then((response)=>{
                resolve(response)
              })

        }else{

            db.get().collection(collection.PRODUCT_COLLLECTION).insertOne(product).then((response)=>{
                resolve(response)
              })
        }



      })
    },


getAllproducts:()=>{
    return new Promise(async(resolve,reject)=>{
 

        db.get().collection(PRODUCT_COLLLECTION).aggregate([

            {$lookup:{
              from:collection.CATEGORY_COLLECTION,
              localField:'brandId',
              foreignField:'_id',
              as:'brand'

            }},
            {
                $project:{
                    name:1,
                    price:1,
                    reviews:1,
                    stock:1,
                    discription:1,
                    visiblity:1,
                    img:1,
                    offer:1,
                    brandOffer:1,
                    originalPrice:1,
                    brandOfferPercent:1,
                    productOfferPercent:1,
                    highOfferPercent:1,
                    productOffer:1,
                    brandName:{$arrayElemAt:['$brand.brand',0]}
                }
            }  
    ]).toArray().then((data)=>{
        resolve(data)
    })
    })
},

newArrival:()=>{
    return new Promise(async(resolve,reject)=>{
 

        db.get().collection(PRODUCT_COLLLECTION).aggregate([

            {$lookup:{
              from:collection.CATEGORY_COLLECTION,
              localField:'brandId',
              foreignField:'_id',
              as:'brand'

            }},
            {
                $project:{
                    name:1,
                    price:1,
                    reviews:1,
                    stock:1,
                    discription:1,
                    visiblity:1,
                    img:1,
                    offer:1,
                    brandOffer:1,
                    originalPrice:1,
                    brandOfferPercent:1,
                    productOfferPercent:1,
                    highOfferPercent:1,
                    productOffer:1,
                    brandName:{$arrayElemAt:['$brand.brand',0]}
                }
            },
            {
                $sort:{_id:-1}
            },
            {
                $limit:10
            }  
    ]).toArray().then((data)=>{   
        resolve(data)
    })
    })
},

bestSeller:()=>{
    return new Promise(async(resolve,reject)=>{

  let products=await  db.get().collection(collection.ORDER_COLLECTION).aggregate([
    {$unwind:"$products"},
  {
    $project:
    {
        product:"$products.item",
        quantity:"$products.quantity"
    }
  },
  {
    $group:{
        _id:"$product",
        quantity:{$sum:"$quantity"}
       
    }
  },{
    $sort:{quantity:-1}
  },
  {
    $lookup:{
        from:collection.PRODUCT_COLLLECTION,
        localField:'_id',
        foreignField:'_id',
        as:'products'

    }
  },
  {
    $project:
    {
        quantity:1,
        product:{$arrayElemAt:['$products',0]} 
    }
  }, 
  {
    $project:{
        quantity:1,
        _id:"$product._id",
        name:"$product.name",
        price:"$product.price",
        reviews:"$product.reviews",
        stock:"$product.stock",
        discription:"$product.discription",
        visiblity:"$product.visiblity",
        img:"$product.img",
        offer:"$product.offer",
        brandOffer:"$product.brandOffer",
        originalPrice:"$product.originalPrice",
        brandOfferPercent:"$product.brandOfferPercent",
        productOfferPercent:"$product.productOfferPercent",
        highOfferPercent:"$product.highOfferPercent",
        productOffer:"$product.productOffer",
        brand:"$product.brandId"
    } 
},
 {$lookup:{
    from:collection.CATEGORY_COLLECTION,
    localField:'brand',
    foreignField:'_id',
    as:'brand'
  }},
  {
    $project:{
        quantity:1,
        name:1,
        price:1,
        reviews:1, 
        stock:1,
        discription:1,
        visiblity:1,
        img:1,
        offer:1,
        brandOffer:1,
        originalPrice:1,
        brandOfferPercent:1, 
        productOfferPercent:1,
        highOfferPercent:1,
        productOffer:1,
        brandName:{$arrayElemAt:['$brand.brand',0]}
    }
  },
  {
    $limit:7
  }

]).toArray()
  console.log("bestseller");
  console.log(products); 
  console.log("bestseller");
  resolve(products) 
}) 
    
},

deleteProduct:(id)=>{
    return new Promise((resolve,reject)=>{
        console.log(ObjectId(id));
        db.get().collection(collection.PRODUCT_COLLLECTION).deleteOne({_id:ObjectId(id)}).then((response)=>{       
            console.log(response);
            resolve(response)
        })
    })
},
getProductDetails:(id)=>{
    
    return new Promise(async(resolve,reject)=>{
       await db.get().collection(collection.PRODUCT_COLLLECTION).aggregate([{$match:{_id:ObjectId(id)}},
       
       {$lookup:{
        from:collection.CATEGORY_COLLECTION,
        localField:'brandId',
        foreignField:'_id',
        as:'brand'

      }},
      {
          $project:{
              name:1,
              price:1,
              reviews:1,
              visiblity:1,
              discription:1,
              stock:1,
              img:1,
              offer:1,
              highOfferPercent:1,
              originalPrice:1,  
              brandName:{$arrayElemAt:['$brand.brand',0]},
              brandId:{$arrayElemAt:['$brand._id',0]}
          }
      }, 
       
    ]).toArray().then((product)=>{

            resolve(product[0])
        })
    })
},

updateProduct:(Productdetails)=>{


    console.log(Productdetails);
    Productdetails.originalPrice=parseInt(Productdetails.originalPrice)
    Productdetails.stock=parseInt(Productdetails.stock)
    Productdetails.brandId=objectId(Productdetails.brandId)

 
   return new Promise((resolve,reject)=>{ 

    db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(Productdetails.id)},{$set:Productdetails
      
    }).then((data)=>{
        resolve()

   }) 
   })

},


nonvisiblity:(id)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:ObjectId(id)},{$set:{
        visiblity:false}}).then(()=>{
            resolve()
        })
    })
},


visiblity:(id)=>{
    return new Promise(async(resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:ObjectId(id)},{$set:{
        visiblity:true}}).then(()=>{
            resolve()
        })
    })
},


/*------------------------------------------------------------------Category-----------------------------------------------------------------*/

addBrand:(brandname)=>{

    return new Promise(async(resolve,reject)=>{
      let check= await  db.get().collection(collection.CATEGORY_COLLECTION).findOne({brand:brandname.brand})
      console.log('check')
      console.log(check)
      console.log('check')
       let  response={}
        if(check){
            response.exists=true
            response.message="This brand already added"
            resolve(response)
        }else{ 
            brandname.brandOffer=false
        db.get().collection(collection.CATEGORY_COLLECTION).insertOne(brandname).then((data)=>{
            
         resolve(data)
        }) 
    }
    })

}, 

getAllBrand:()=>{
    return new Promise(async(resolve,reject)=>{
        let brands=await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
        resolve(brands)
    })
},

getBrand:(id)=>{ 

    return new Promise(async(resolve,reject)=>{
        let brand=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(id)})
        console.log(brand)
        resolve(brand)
    })

},

editBrand:(id,data)=>{
let response={}
    return new Promise(async(resolve,reject)=>{
let check= await  db.get().collection(collection.CATEGORY_COLLECTION)
.findOne({$and:[{brand:data.brand},{_id:{$ne:objectId(id)}}]})

if(check){
    console.log('-----------1-------------');

    console.log(check);
    console.log("check");
    response.exists=true
    response.message="Brand already exists"
    resolve(response)
  }else{ 

    console.log('-----------2-------------');

 
    db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{
        brand:data.brand,
        img:data.img
    }}).then(()=>{
          response.exists=false
            resolve(response)
        })

    }

})
},

deleteBrand:(brandId)=>{
   return new Promise((resolve,reject)=>{
    db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(brandId)}).then((data=>{

        db.get().collection(PRODUCT_COLLLECTION).deleteMany({brandId:objectId(brandId)}).then((data)=>{

            resolve(data)
        })

    }))
   })
},

getBrandProducts:(brandId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(PRODUCT_COLLLECTION).aggregate([{$match:{brandId:objectId(brandId)}},

                {$lookup:{
                  from:collection.CATEGORY_COLLECTION,
                  localField:'brandId',
                  foreignField:'_id',
                  as:'brand'

                }},
                {
                    $project:{
                        name:1,
                        price:1,
                        reviews:1,
                        visiblity:1,
                        img:1,
                        brandName:{$arrayElemAt:['$brand.brand',0]}
                    }
                }  
        ]).toArray().then((data)=>{
            console.log(data);
            console.log('data');
            resolve(data)
        })
    })
},




//-----------------------------------------------------------Sales Report-----------------------------------------------------------------

getDailyReport:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{'status':{$nin:['canceled']}}
            },
            {
                $group:{
                    _id:'$date',
                    DailySaleAmount: { $sum: "$totalAmount" },
                    count:{$sum:1},
                },
                
            },
            {
                $limit:7
            },
            {
                $sort:{date:-1}
            },
           
          
        ]).toArray().then((weekReport)=>{
            resolve(weekReport)
            
        })
    })
},


getMonthlyReport:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{'status':{$nin:['canceled']}}
            },
            {
                $group:{
                    _id:'$month',
                    MonthlySaleAmount: { $sum: "$totalAmount" },
                    count:{$sum:1},
                }
            },
            {
                $limit:12
            },
            {
                $sort:{month:-1}
            },
          
        ]).toArray().then((weekReport)=>{
            resolve(weekReport)
        })
    })
},

getYearlyReport:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{'status':{$nin:['canceled']}}
            },
            {
                $group:{
                    _id:'$year',
                    YearlySaleAmount: { $sum: "$totalAmount" },
                    count:{$sum:1},
                }
            },
            {
                $limit:5
            },
            {
                $sort:{year:-1}
            },
            
          
        ]).toArray().then((weekReport)=>{
            resolve(weekReport)
   
        })

    })
},



getDailyTotalSale:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:{'status':{$nin:['canceled']}}
            },
            
            {
                $group:{
                    _id:'$date',
                    dailyTotalSaleAmount: { $sum: "$totalAmount" },
                    
                }
            },
            {
                $limit:7
            },
            {
                $group:{
                    _id:"",
                    dailyTotalAmount:{$sum:"$dailyTotalSaleAmount"}
                }
            }
            
            
          
        ]).toArray().then((weekReport)=>{
            resolve(weekReport)
           
        })

    })
},


getMonthlyTotalSale:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $group:{
                    _id:'$month',
                    MonthlyTotalSaleAmount: { $sum: "$totalAmount" },               
                }
            },
            {
                $group:{
                    _id:"",
                    MonthlyTotalAmount:{$sum:"$MonthlyTotalSaleAmount"}
                }
            },
            {
                $limit:12
            },
            {
                $sort:{month:-1

                }
            }
            
          
        ]).toArray().then((weekReport)=>{
            resolve(weekReport)
      
        })

    })
},


getYearlyTotalSale:()=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $group:{
                    _id:'$year',
                    yearlyTotalSaleAmount: { $sum: "$totalAmount" },
                    
                }
            },
            {
                $group:{
                    _id:"",
                    yearlyTotalAmount:{$sum:"$yearlyTotalSaleAmount"}
                }
            },
            {
                $limit:5
            },
            {
                $sort:{year:-1

                }
            }
          
        ]).toArray().then((weekReport)=>{
            resolve(weekReport)
        
        })

    })
},

getProductsCount:()=>{

    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLLECTION).countDocuments().then((count)=>{
       console.log(count);
        resolve(count)
      })

    })

},

getProductnfo:(limit,startIn)=>{

return new Promise((resolve,reject)=>{

    db.get().collection(collection.PRODUCT_COLLLECTION).find().skip(startIn).limit(limit).toArray().then((products)=>{
        console.log(products);
        resolve(products)
    })
})

}

}