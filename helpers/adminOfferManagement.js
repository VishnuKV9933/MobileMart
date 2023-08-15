var db = require("../configuration/connection");
const bcrypt = require("bcrypt");
const collection = require("../configuration/collection");
const userHelpers = require("./user-helpers");

var objectId = require("mongodb").ObjectId;

module.exports={


getOfferBrands:()=>{

return new Promise(async(resolve,reject)=>{

let brands =await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();

resolve(brands)

})    

},

getOfferBrandProducts:(details)=>{
    let {brandOffer,brandId}=details
    brandOffer=parseInt(brandOffer)

    console.log(brandId);
return new Promise(async(resolve,reject)=>{
    
    db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(brandId)},{$set:{
        brandOfferPercent:brandOffer,
        brandOffer:true
    }}).then((data)=>{console.log(data);})
    
 let products= db.get().collection(collection.PRODUCT_COLLLECTION).find({brandId:objectId(brandId)} ).toArray()
 resolve(products)

})
},


addBrandOffer:(product,details)=>{

    let {brandOffer,brandId}=details

    brandOffer=parseInt(brandOffer)
    let offerPrice=(product.price*brandOffer)/100
    let price=parseInt(product.price-offerPrice)
    console.log(brandId);

return new Promise((resolve,reject)=>{
         
    if(product.productOffer){

        if(product.productOfferPercent<=brandOffer){

            db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:product._id},{$set:{
                offer:true,
                brandOffer:true,
                brandOfferPercent:brandOffer,
                highOfferPercent:brandOffer,
                price:price
            }}).then((data)=>{resolve()})

        }else{
            let offerPrice2= (product.originalPrice*product.productOfferPercent)/100
            let price2=product.originalPrice-offerPrice2

            db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:product._id},{$set:{
                offer:true,
                brandOffer:true,
                brandOfferPercent:brandOffer,
                highOfferPercent:product.productOfferPercent,
                price:price2
            }}).then((data)=>{resolve()})


        }
    }else{

        db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:product._id},{$set:{
            offer:true,
            brandOffer:true,
            brandOfferPercent:brandOffer,
            price:price,
            highOfferPercent:brandOffer
        }}).then((data)=>{
        })

    }

   
})

},

brandOfferDeleteStatus:async(id)=>{

    return new Promise((resolve,reject)=>{

        db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(id)},{$set:{
            brandOffer:false,
            brandOfferPercent:null
         }}).then((data)=>{})
        
        
         db.get().collection(collection.PRODUCT_COLLLECTION).find({brandId:objectId(id)}).toArray().then((products)=>{  resolve(products)       })
         
    })

},


brandOfferProductChange:(product)=>{

    return new Promise((resolve,reject)=>{

     

    if(product.productOffer){
        let offerPrice=(product.originalPrice*product.productOfferPercent)/100
        let price=product.originalPrice-offerPrice

        db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(product._id)},{$set:{
            price:price,
            brandOffer:false,
            brandOfferPercent:null,
            highOfferPercent:product.productOfferPercent
         }}).then((data)=>{})

     }else{
        db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(product._id)},{$set:{
            price:product.originalPrice,
            brandOffer:false,
            brandOfferPercent:null,
            offer:false,
            highOfferPercent:null
         }}).then((data)=>{
            resolve();      
        })
    }

    })

},




addProductOffer:(details)=>{
    let {productId,productOffer}=details
          productOffer=parseInt(productOffer)
return new Promise(async(resolve,reject)=>{

   let product= await db.get().collection(collection.PRODUCT_COLLLECTION).findOne({_id:objectId(productId)})
    
let offerPrice=(product.originalPrice*productOffer)/100
let price=product.originalPrice-offerPrice

    if(product.brandOffer){
        let offerPrice2=(product.originalPrice*product.brandOfferPercent)/100
            let price2=parseInt(product.originalPrice-offerPrice2)
        if(product.brandOfferPercent <= productOffer){

            db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{
                offer:true,
                productOffer:true,
                productOfferPercent:productOffer,
                price:price,
                highOfferPercent:productOffer
            }}).then((data)=>{resolve()})
        }else{

        db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{
            offer:true,
            productOffer:true,
            productOfferPercent:productOffer,
            highOfferPercent:product.brandOfferPercent,
            price:price2
        }}).then((data)=>{resolve()})

        }
    

    }else{

        db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{
            offer:true,
            productOffer:true,
            productOfferPercent:productOffer,
            highOfferPercent:productOffer,
            price:price
        }}).then((data)=>{resolve()})
    }
})

},



editProductOffer:(details)=>{
    let {productId,productOffer}=details
    productOffer=parseInt(productOffer)
    
    return new Promise(async(resolve,reject)=>{

        let product= await db.get().collection(collection.PRODUCT_COLLLECTION).findOne({_id:objectId(productId)})
   
        let offerPrice=(product.originalPrice*productOffer)/100
       
        let price=product.originalPrice-offerPrice
       

        if(product.brandOffer){
            let offerPrice2=(product.originalPrice*product.brandOfferPercent)/100
            let price2=parseInt(product.originalPrice-offerPrice2)
            if(product.brandOfferPercent <= productOffer){
                
                db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{

                    productOfferPercent:productOffer,
                    price:price,
                    highOfferPercent:productOffer
                }}).then((data)=>{

                    resolve()})
            }else{
                   
            db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{

                productOfferPercent:productOffer,
                highOfferPercent:product.brandOfferPercent,
                price:price2

            }}).then((data)=>{
              
                resolve()})
    
            }
        
    
        }else{
    
            db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{
                offer:true,
                productOffer:true,
                productOfferPercent:productOffer,
                highOfferPercent:productOffer,
                price:price
            }}).then((data)=>{
              
                resolve()})
        }



    })


},

deleteProductOffer:(productId)=>{

    return new Promise(async(resolve,reject)=>{

        let product= await db.get().collection(collection.PRODUCT_COLLLECTION).findOne({_id:objectId(productId)})

        

        if(product.brandOffer){

            let offerPrice=(product.originalPrice*product.brandOfferPercent)/100
        let price=product.originalPrice-offerPrice

            
            db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{
                
                productOffer:false,
                productOfferPercent:null,
                highOfferPercent:product.brandOfferPercent,
                price:price
            }})
       


        }else{

 
            db.get().collection(collection.PRODUCT_COLLLECTION).updateOne({_id:objectId(productId)},{$set:{
                offer:false,
                productOffer:false,
                productOfferPercent:null,
                highOfferPercent:null,
                price:product.originalPrice
            }})


        }

    })



},

addCoopen:(details)=>{
    let response={}

    details.percentage=parseInt(details.percentage)

return new Promise(async(resolve,reject)=>{
    
    
   let coopon = await db.get().collection(collection.COOPON_COLLECTION).findOne({code:{'$regex' : `^${details.code}$`, '$options' : 'i'}})
console.log(coopon);
   if(coopon){
   
      response.status=false
      response.message="coopon already in use"
      resolve(response)

   }else{
 
    db.get().collection(collection.COOPON_COLLECTION).insertOne(details).then((data)=>{
        response.status=true
         response.message="Coopon created successfully"
        resolve(response)
    })

   }

 


})

},

getAllCoopon:()=>{

    return new Promise((resolve,reject)=>{
        
        db.get().collection(collection.COOPON_COLLECTION).find().toArray().then((data)=>{
            resolve(data)
        }).catch((err)=>{
            reject(err)
        })
    })
},

cooponChecking:(coopon,userId)=>{
    console.log('-----------------------------------------2-----------------------------------------------');
let response={}
return new Promise(async(resolve,reject)=>{
  try{ 
    console.log('-----------------------------------------3-----------------------------------------------');
  let cooponObject=await  db.get().collection(collection.COOPON_COLLECTION).findOne({code:coopon})
  console.log('-----------------------------------------4-----------------------------------------------');
  if(cooponObject){
    console.log('-----------------------------------------5-----------------------------------------------');
    let d = new Date()
    let  month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    let year = d.getFullYear()
     
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
     let time = [year, month, day].join('-')
     console.log(time);

     if(cooponObject.expiry >= time){

        console.log('-----------------------------------------6-----------------------------------------------');

 let usedCoopon = await db.get().collection(collection.USED_COOPON_COLLECTION).findOne({$and:[{user:objectId(userId)},{coopon:{$in:[objectId(cooponObject._id)]}}]})
     if(usedCoopon){
        console.log('-----------------------------------------7-----------------------------------------------');
        response.status=false
        response.message="coopon already used"
        resolve(response)
     }else{
        console.log('-----------------------------------------8-----------------------------------------------');
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{coopon:cooponObject}})
        response.status=true
        response.message="Coopon Applied"
        response.coopon=cooponObject
        resolve(response)

     }
       
     console.log('-----------------------------------------9-----------------------------------------------');

     }else{
        console.log('-----------------------------------------10-----------------------------------------------');
        response.status=false
        response.message="coopon is expired"
        resolve(response)
     

     }
  
  }else{
    console.log('-----------------------------------------11-----------------------------------------------');
    console.log("invalid coopon");
        response.status=false
        response.message="invalid coopon"
        resolve(response)
  }

  }
  catch(err){ 
    console.log('-----------------------------------------12-----------------------------------------------');
    reject(err)
  }
})

},

cooponObjectRemovelUser:(id)=>{

  

    return new Promise(async(resolve,reject)=>{

        let user=await userHelpers.getuserDetails(id)

        let userId=user._id
        let cooponId=user.coopon._id
        let cooponObj={user:objectId(userId),coopon:[objectId(cooponId)]}



    let  usedCoopon =await db.get().collection(collection.USED_COOPON_COLLECTION).findOne({user:objectId(userId)})

    if(usedCoopon){
        console.log('-----------------------------------------20-----------------------------------------------');

        db.get().collection(collection.USED_COOPON_COLLECTION).updateOne({user:objectId(userId)},{$push:{coopon:objectId(cooponId)}})
    }else{
        console.log('-----------------------------------------21-----------------------------------------------');

        db.get().collection(collection.USED_COOPON_COLLECTION).insertOne(cooponObj)
    }

        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{
            coopon:null,
        }})

    }).then((data)=>{
        console.log('data');
        console.log(data);
        console.log('data');
        resolve(data)
    })
    .catch((err)=>{
        reject(err)
    })
},

deleteCoupon:(couponId)=>{

return new Promise((resolve,reject)=>{

    db.get().collection(collection.COOPON_COLLECTION).deleteOne({_id:objectId(couponId)}).then((data)=>{
        resolve()
    })
    .catch((err)=>{
       reject(err)
    })
})

},

couponUserRemovel:(userId)=>{

    console.log(userId);

    return new Promise((resolve,reject)=>{

        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{$set:{coopon:null}}).then((data)=>{
            console.log(data);
           resolve(data)
        })
        .catch((err)=>{
            reject(err)
        })

    })

}


  
    
}