var db = require("../configuration/connection");
const bcrypt = require("bcrypt");
const collection = require("../configuration/collection");
const { response } = require("../app");
const { list } = require("../hbsHelpers");
var objectId = require("mongodb").ObjectId;

module.exports={

addToWishlist:(productId,userId)=>{

    proObj = objectId(productId)

    return new Promise(async(reslolve,reject)=>{
        let response={}
        let listObj = {
            user:objectId(userId),
            products:[proObj]
            };

            let userWishlist = await db
            .get()
            .collection(collection.WISHLIST_COLLECTION)
            .findOne({ user: objectId(userId) });
            
            if(userWishlist){
                let prodExist = userWishlist.products.findIndex((product => product==productId))

                if (prodExist != -1){
                    response.productExist=true
                    reslolve(response)
                }else{
                    db.get()
                    .collection(collection.WISHLIST_COLLECTION)
                    .updateOne(
                    { user: objectId(userId) },
                    { $push: { products: proObj } }
                    )
                }

            }else{
              
                db.get()
              .collection(collection.WISHLIST_COLLECTION)
              .insertOne(listObj).then((data)=>{

                reslolve(data)
              })


            }

    })

},

wishListCount: (userid) => {
    return new Promise(async (resolve, reject) => {
      let count = null;
      let wlist = await db
        .get()
        .collection(collection.WISHLIST_COLLECTION)
        .findOne({ user: objectId(userid) });
      if (wlist) {
        count = wlist.products.length;
      }
      resolve(count);
    });
  },

getWishlistProducts:(userId)=>{
  return new Promise(async(resolve,reject)=>{
   db.get().collection(collection.WISHLIST_COLLECTION).aggregate([{$match:{user:objectId(userId)}},
  {
    $unwind:'$products'
  },
    {
    $lookup:{
      from:collection.PRODUCT_COLLLECTION,
       localField:'products',
       foreignField:'_id',
       as:'products'
    }
   
  },
  {
    $project:{
      _id:0,
      products:{$arrayElemAt:['$products',0]}
    }
  },
  {
    $lookup:{
      from:collection.CATEGORY_COLLECTION,
      localField:'products.brandId',
      foreignField:'_id',
      as:'brand'
    }
  },
  {
    $project:{
      _id:0,
      products:1,
      brand:{$arrayElemAt:['$brand',0]}
    }
  }
  ]).toArray().then((data)=>{
   

    resolve(data)
    })
    
  })
},

removeWishListProduct:(userId,productId)=>{
  return new Promise(async(resolve,reject)=>{
    db.get().collection(collection.WISHLIST_COLLECTION)
    .updateOne({user:objectId(userId)},{$pull:{products:objectId(productId)}})
  }).then((data)=>{
    resolve(data)
  })

},






}