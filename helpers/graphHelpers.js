var db = require("../configuration/connection");
const bcrypt = require("bcrypt");
const collection = require("../configuration/collection");
const userHelpers = require("./user-helpers");

module.exports = {
  //------------------------------------------------------------------chart-----------------------------------------------------------------------
   getTotalSalesGraph: () => {
    return new Promise(async (resolve, reject) => {
      let dailySale = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          // {
          //     $unwind: '$products'

          // },
          {
            $match: {
              status: { $nin: ["canceled"] },
            },
          },
          {
            $group: {
              _id: "$date",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 7,
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ])
        .toArray();

      let monthlySales = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          // {
          //     $unwind: '$products'

          // },
          {
            $match: {
              status: { $nin: ["canceled"] },
            },
          },
          {
            $group: {
              _id: "$month",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 12,
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ])
        .toArray();

        let monthSales = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          // {
          //     $unwind: '$products'

          // },
          {
            $match: {
              status: { $nin: ["canceled"] },
            },
          },
          {
            $group: {
              _id: "$month",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 12,
          },
          {
            $sort: {
              _id: 1,
            },
          },
        ])
        .toArray();

      let yearlySale = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          // {
          //     $unwind: '$products'

          // },
          {
            $match: {
              status: { $nin: ["canceled"] },
            },
          },
          {
            $group: {
              _id: "$year",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          {
            $sort: {
              _id: -1,
            },
          },
          {
            $limit: 5,
          },
        ])
        .toArray();
      resolve({ dailySale, monthSales, yearlySale });
    });
  },

  getAllPaymentCount: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $facet: {
              COD: [{ $match: { paymentMethod: "COD" } }, { $count: "COD" }],
              paypal: [
                { $match: { paymentMethod: "paypal" } },
                { $count: "paypal" },
              ],
              razorpay: [
                { $match: { paymentMethod: "razorpay" } },
                { $count: "razorpay" },
              ],
            },
          },
          {
            $project: {
              CODCount: { $arrayElemAt: ["$COD.COD", 0] },
              paypalCount: { $arrayElemAt: ["$paypal.paypal", 0] },
              razorpayCount: { $arrayElemAt: ["$razorpay.razorpay", 0] },
            },
          },
        ])
        .toArray()
        .then((data) => {
          resolve(data[0]);
        });
    });
  },

  paymentMethodSales: () => {
    return new Promise(async (resolve, reject) => {
      let paymentMethodDaily = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: { $nin: ["canceled", "pending"] },
            },
          },

          {
              $group:{_id:'$date',

              }
          },
          {
              $sort:{
                  _id:-1
              }
          },

            
        ])
        .toArray();

      console.log("paymentMethodDaily");

      console.log(paymentMethodDaily);

      resolve(paymentMethodDaily);
    });
  },



  getDailyPaymentSales:()=>{
    return new Promise(async(resolve, reject) => {
        let COD= await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
         $match : { "paymentMethod":'COD' }},
        { $group:{_id:{day:{$dayOfMonth:'$_id'}},totalAmount:{$sum:'$totalAmount'},count:{$sum:1}} },
        { $sort : {"_id.day" : 1} }             
            ]).toArray()
        let paypal =await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
            $match : { "paymentMethod":'PAYPAL' }},
           { $group:{_id:{day:{$dayOfMonth:'$_id'}},totalAmount:{$sum:'$totalAmount'},count:{$sum:1}} },
           { $sort : {"_id.day" : 1} }             
               ]).toArray()
        let razorpay =await db.get().collection(collection.ORDER_COLLECTION).aggregate([{
        $match : { "paymentMethod":'RAZORPAY' }},
        { $group:{_id:{day:{$dayOfMonth:'$_id'}},totalAmount:{$sum:'$totalAmount'},count:{$sum:1}} },
        { $sort : {"_id.day" : 1} }             
            ]).toArray()
   
        resolve({razorpay,paypal,COD})
    
    })
    
},



  brandSales: () => {
    return new Promise(async (resolve, reject) => {
      let categorySales = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: { $nin: ["canceled", "pending"] },
            },
          },
          {
            $unwind: "$products",
          },
    
          { 
            $lookup: {
              from: collection.PRODUCT_COLLLECTION,
              localField: "products.item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              products: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },

          {
            $lookup: {
              from: collection.CATEGORY_COLLECTION,
              localField: "product.brandId",
              foreignField: "_id",
              as: "brand",
            },
          },

          {
            $project: {
              price: "$product.price",
              quantity: "$products.quantity",
              brand: { $arrayElemAt: ["$brand", 0] },
            },
          },
          {
            $project: {
              totalAmount: { $multiply: ["$price", "$quantity"] },
              brand: "$brand.brand",
            },
          },
          {
            $group: { _id: "$brand", total: { $sum: "$totalAmount" } },
          },
        ])
        .toArray();

      resolve(categorySales);
    });
  },

  todaOrderCount:()=>{


    return new Promise((resolve,reject)=>{

      db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
        $group:{

         _id:"$date",count:{$sum:1}

        }
      },{
        $sort:{_id:-1}
      },{
        $limit:1
      }
    ]).toArray().then((data)=>{

     
        resolve(data[0]?.count)
      })

    })

  },

  monthlYTotalSale:()=>{

    return new Promise((resolve,reject)=>{

      db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
        $group:{

         _id:"$month",totalAmount:{$sum:'$totalAmount'}

        }
      },
      {
        $sort:{_id:-1}
      }
      ,{
        $limit:1
      }
    ]).toArray().then((data)=>{

   
        resolve(data[0]?.totalAmount)
      })

    })

  },


  getAllPaymentTotalSale: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              status: { $nin: ["canceled", "pending"] },
            },
          },
          {
            $group: {
              _id: "$paymentMethod",
              totalAmount: { $sum: "$totalAmount" },
            },
          },
          // {
          //   $facet: {
          //     COD: [{ $match: { paymentMethod: "COD" } },
          
          //   ],
          //     paypal: [
          //       { $match: { paymentMethod: "PAYPAL" } },

          //     ],
          //     razorpay: [
          //       { $match: { paymentMethod: "RAZORPAY" } },
  
          //     ],
          //   },
          // },
          // {
          //   $project: {
          //     CODCount: { $arrayElemAt: ["$COD.COD", 0] },
          //     paypalCount: { $arrayElemAt: ["$paypal.paypal", 0] },
          //     razorpayCount: { $arrayElemAt: ["$razorpay.razorpay", 0] },
          //   },
          // },
        ])
        .toArray()
        .then((data) => {
    
          resolve(data);
        });
    });
  },



};
