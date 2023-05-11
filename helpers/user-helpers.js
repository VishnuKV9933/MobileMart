var db = require("../configuration/connection");
const bcrypt = require("bcrypt");
const collection = require("../configuration/collection");
const { response } = require("../app");
var objectId = require("mongodb").ObjectId;
require("dotenv").config();

const Razorpay = require("razorpay");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

module.exports = {
  doSignup: (userData) => {
    userData.status = true;
    userData.walletAmount = parseInt(0);
    let response = {};
    return new Promise(async (resolve, reject) => {
      let useremail = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      let usermobile = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: userData.mobile });

      if (useremail) {
        response.user = true;
        response.err = "email already exists";
        resolve(response);
      } else if (usermobile) {
        response.user = true;
        response.err = "mobile number already exists";
        resolve(response);
      } else {
        userData.password = userData.password.toString();
        userData.password = await bcrypt.hash(userData.password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            response = userData;
            resolve(response);
          });
      }
    });
  },

  userCount: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .countDocuments()
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },

  dologin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        if (user.status) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              console.log("login success");
              response.permission = true;
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              console.log("login failed");
              response.user = true;
              response.permission = true;
              response.password = false;
              resolve(response);
            }
          });
        } else {
          response.user = true;
          response.permission = false;
          resolve(response);
        }
      } else {
        console.log("login failed");
        response.user = false;
        resolve(response);
      }
    });
  },

  verifyOtp: (number) => {
    number = String(number);
    let response = {};
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ mobile: number });

      if (user) {
        response.exists = true;
        if (user.status) {
          response.user = user;
          response.status = true;
          resolve(response);
        } else {
          response.status = false;
          resolve(response);
        }
      } else {
        response.exists = false;
        resolve(response);
      }
    });
  },

  getAllusers: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  getuserDetails: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(id) })
        .then((user) => {
          resolve(user);
        });
    });
  },

  updateuser: (id, ProDetails) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(id) },
          {
            $set: {
              name: ProDetails.name,
              email: ProDetails.email,
            },
          }
        )
        .then((response) => {
          resolve();
        });
    });
  },

  deleteuser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .deleteOne({ _id: objectId(id) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  blockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(id) }, { $set: { status: false } })
        .then((data) => {
          resolve();
        });
    });
  },

  unblockUser: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne({ _id: objectId(id) }, { $set: { status: true } })
        .then((data) => {
          resolve();
        });
    });
  },

  addToCart: (productId, userId) => {
    let response = {};

    proObj = {
      item: objectId(productId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });

      if (userCart) {
        let prodExist = userCart.products.findIndex(
          (product) => product.item == productId
        );

        if (prodExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .aggregate([
              {
                $match: {
                  _id: objectId(userCart._id),
                },
              },
              { $unwind: "$products" },
              {
                $match: { "products.item": objectId(productId) },
              },
              {
                $project: {
                  _id: 0,
                  quantity: "$products.quantity",
                  proid: "$products.item",
                },
              },
              {
                $lookup: {
                  from: collection.PRODUCT_COLLLECTION,
                  localField: "proid",
                  foreignField: "_id",
                  as: "productDetails",
                },
              },
              {
                $project: {
                  quantity: 1,
                  product: { $arrayElemAt: ["$productDetails", 0] },
                },
              },
              {
                $project: {
                  quantity: 1,
                  stock: "$product.stock",
                },
              },
            ])
            .toArray()

            .then((data) => {
              console.log("quantity");
              console.log(data);
              console.log("quantity");

              if (data[0].stock > data[0].quantity) {
                console.log("you can buy");
                console.log("------------3-------------");
                db.get()
                  .collection(collection.CART_COLLECTION)
                  .updateOne(
                    {
                      user: objectId(userId),
                      "products.item": objectId(productId),
                    },
                    {
                      $inc: { "products.$.quantity": 1 },
                    }
                  )
                  .then(() => {
                    response.success = true;
                    response.outOfStock = false;
                    resolve(response);
                  });
              } else {
                console.log("out of stock");
                response.success = false;
                response.outOfStock = true;
                resolve(response);
              }
            });
        } else {
          console.log("------------4-------------");
          //------------------------------------------------------------------------------------------------------------------------

          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              { $push: { products: proObj } }
            )
            .then((data) => {
              response.success = true;
              response.outOfStock = false;
              resolve(response);
            });
          //------------------------------------------------------------------------------------------------------------------------
        }
      } else {
        console.log("------------5-------------");

        let cartObj = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObj)
          .then((data) => {
            // resolve({removeProduct:true});
            response.success = true;
            response.outOfStock = false;
            resolve(response);
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          { $match: { user: objectId(userId) } },

          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: 1,
              total: { $multiply: ["$quantity", "$product.price"] },
            },
          },

          //   {
          //     $lookup: {
          //       from: collection.PRODUCT_COLLLECTION,
          //       let: { productList: "$products" },

          //       pipeline: [
          //         {
          //           $match: {
          //             $expr: {
          //               $in: ["$_id", "$$productList"],
          //             },
          //           },
          //         },
          //       ],
          //       as: "cartItems",
          //     },
          //   },
        ])
        .toArray();

      resolve(cartItems);
    });
  },

  getCartCount: (userid) => {
    return new Promise(async (resolve, reject) => {
      let count = null;
      cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userid) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },

  changeProductQuantity: (details) => {
    console.log(details);
    details.count = parseInt(details.count);
    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: {
                _id: objectId(details.cart),
              },
            },
            { $unwind: "$products" },
            {
              $match: { "products.item": objectId(details.product) },
            },
            {
              $project: {
                _id: 0,
                quantity: "$products.quantity",
                proid: "$products.item",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLLECTION,
                localField: "proid",
                foreignField: "_id",
                as: "productDetails",
              },
            },
            {
              $project: {
                quantity: 1,
                product: { $arrayElemAt: ["$productDetails", 0] },
              },
            },
            {
              $project: {
                quantity: 1,
                stock: "$product.stock",
              },
            },
          ])
          .toArray()

          .then((data) => {
            let signOfCcount = Math.sign(details.count);

            if (data[0].stock > data[0].quantity) {
              console.log("you can buy");

              db.get()
                .collection(collection.CART_COLLECTION)
                .updateOne(
                  {
                    _id: objectId(details.cart),
                    "products.item": objectId(details.product),
                  },
                  {
                    $inc: { "products.$.quantity": details.count },
                  }
                )
                .then((response) => {
                  resolve({ status: true });
                });
            } else if (
              signOfCcount == -1 &&
              data[0].stock == data[0].quantity
            ) {
              db.get()
                .collection(collection.CART_COLLECTION)
                .updateOne(
                  {
                    _id: objectId(details.cart),
                    "products.item": objectId(details.product),
                  },
                  {
                    $inc: { "products.$.quantity": details.count },
                  }
                )
                .then((response) => {
                  resolve({ status: true });
                });
            } else {
              console.log("out of stock");

              resolve({ status: false });
            }
            console.log(data);
          });
      }
    });
  },

  removeCartProduct: (details) => {
    let removeProduct = null;

    return new Promise(async (resolve, reject) => {
      await db
        .get()
        .collection(collection.CART_COLLECTION)
        .updateOne(
          { _id: objectId(details.cart) },
          {
            $pull: { products: { item: objectId(details.product) } },
          }
        )
        .then((removeProduct) => {
          resolve((removeProduct = true));
        });
    });
  },

  getGrandTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let totalPrice = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          { $match: { user: objectId(userId) } },

          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              price: { $toInt: "$product.price" },
            },
          },
          {
            $group: {
              _id: null,
              grandTotal: { $sum: { $multiply: ["$quantity", "$price"] } },
            },
          },
        ])
        .toArray();

      resolve(totalPrice);
    });
  },

  paypalGrandTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let totalPrice = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          { $match: { user: objectId(userId) } },

          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              price: { $toInt: "$product.price" },
            },
          },
          {
            $group: {
              _id: null,
              grandTotal: { $sum: { $multiply: ["$quantity", "$price"] } },
            },
          },
          {
            $project: {
              total: { $multiply: ["$grandTotal", 0.021] },
            },
          },
        ])
        .toArray();
      console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj");
      console.log(totalPrice);
      resolve(totalPrice);
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });

      resolve(cart.products);
    });
  },

  placeOrder: (order, products, total) => {
    let address = null;

    let d = new Date();
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    let time = [year, month, day].join("-");
    let monthofbusiness = [year, month].join("-");
    let yearofbusiness = year;

    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: objectId(order.addressId) });

      let status = order["payment-method"] === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          name: address.firstname,
          mobile: address.phone,
          address: address.address,
          city: address.city,
          state: address.state,
          Pin: address.pincode,
          email: address.email,
        },
        userId: objectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        // date: new Date().toISOString().slice(0, 10),
        date: time,
        month: monthofbusiness,
        year: yearofbusiness,
        status: status,
        orderStatus: true,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          resolve(response.insertedId);
        });
    });
  },

  placeOrderCoupon: (order, products, total, couponObj) => {
    let address = null;

    let d = new Date();
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    let time = [year, month, day].join("-");
    let monthofbusiness = [year, month].join("-");
    let yearofbusiness = year;

    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: objectId(order.addressId) });

      let status = order["payment-method"] === "COD" ? "placed" : "pending";
      let orderObj = {
        deliveryDetails: {
          name: address.firstname,
          mobile: address.phone,
          address: address.address,
          city: address.city,
          state: address.state,
          Pin: address.pincode,
          email: address.email,
        },
        userId: objectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        // date: new Date().toISOString().slice(0, 10),
        date: time,
        month: monthofbusiness,
        year: yearofbusiness,
        status: status,
        orderStatus: true,
        originalPrice: couponObj.originalPrice,
        coupunCode: couponObj.coupunCode,
        couponPercentage: couponObj.couponPercentage,
      };
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          resolve(response.insertedId);
        });
    });
  },

  walletAmountCheck: (userId, totalPrice) => {
    let response = {};

    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });

      if (user.walletAmount < totalPrice) {
        response.walletAmount = false;
        resolve(response);
      } else {
        response.walletAmount = true;
        resolve(response);
      }
    });
  },

  deleteCart: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .deleteOne({ user: objectId(userId) });
      resolve();
    });
  },

  generateRazorpay: (orderId, totalPrice) => {
    console.log("generateRazorpay");
    console.log(totalPrice);
    console.log(orderId);
    return new Promise((resolve, reject) => {
      var options = {
        amount: parseInt(totalPrice) * 100,
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log(order);
          resolve(order);
        }
      });
    });
  },

  changeOrderStatusOnline: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "placed",
            },
          }
        )
        .then((data) => {
          resolve();
        });
    });
  },

  verifyRazorPayPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "k2sLt4f1ixYCyiV0iYXMI7td");
      hmac.update(
        details.razorpay_order_id + "|" + details.razorpay_payment_id
      );
      hmac = hmac.digest("hex");
      if (hmac == details.razorpay_signature) {
        resolve();
      } else {
        reject();
      }
    });
  },

  getOrderProductQuantity: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { _id: objectId(orderId) } },
          {
            $unwind: "$products",
          },
          {
            $project: {
              productId: "$products.item",
              quantity: "$products.quantity",
            },
          },
        ])
        .toArray()
        .then((response) => {
          console.log(response);
          resolve(response);
        });
    });
  },

  updateStockDecrease: ({ productId, quantity }) => {
    db.get()
      .collection(collection.PRODUCT_COLLLECTION)
      .updateOne(
        { _id: objectId(productId) },
        {
          $inc: { stock: -quantity },
        }
      );
  },

  updateStockIncrease: ({ productId, quantity }) => {
    db.get()
      .collection(collection.PRODUCT_COLLLECTION)
      .updateOne(
        { _id: objectId(productId) },
        {
          $inc: { stock: +quantity },
        }
      );
  },

  getUserOders: (userId) => {
    return new Promise(async (resolve, reject) => {
      let orders2 = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: {
              $and: [
                { userId: objectId(userId) },
                { status: { $nin: ["pending"] } },
              ],
            },
          },
        ])
        .sort({ _id: -1 })
        .toArray();

      resolve(orders2);
    });
  },

  getAllOders: () => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .find()
        .sort({ _id: -1 })
        .toArray();
      resolve(orders);
    });
  },

  getOrder: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) });
      resolve(orders);
    });
  },

  getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          { $match: { _id: objectId(orderId) } },

          {
            $unwind: "$products",
          },
          {
            $project: {
              status: 1,
              orderStatus: 1,
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              status: 1,
              orderStatus: 1,
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              status: 1,
              orderStatus: 1,
              item: 1,
              quantity: 1,
              product: 1,
              total: { $multiply: ["$quantity", "$product.price"] },
            },
          },
        ])
        .toArray();

      console.log(orderItems);

      resolve(orderItems);
    });
  },

  orderCancel: (orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "canceled",
              orderStatus: false,
            },
          }
        )
        .then(() => {
          resolve(response);
        });
    });
  },

  orderReturn: (details) => {
    return new Promise(async (resolve, reject) => {
      let orderObj = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(details.orderId) });
      orderObj.reason = details.reason;
      orderObj.orderId = objectId(details.orderId);

      db.get().collection(collection.RETURN_COLLECTION).insertOne(orderObj);

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(details.orderId) },
          {
            $set: {
              status: "Returned",
              returnStatus: true,
            },
          }
        )
        .then(() => {
          resolve(response);
        });
    });
  },

  getAllReturnOrders: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.RETURN_COLLECTION)
        .find()
        .toArray()
        .then((orders) => {
          resolve(orders);
        });
    });
  },

  getUserOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) })
        .then((data) => {
          console.log(data);
          console.log("data");
          resolve(data);
        });
    });
  },

  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CART_COLLECTION)
        .deleteMany({ "products.item": { $in: [objectId(id)] } })
        .then((response) => {});

      db.get()
        .collection(collection.PRODUCT_COLLLECTION)
        .deleteOne({ _id: objectId(id) })
        .then((response) => {
          resolve(response);
        });
    });
  },

  getReturnProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.RETURN_COLLECTION)
        .aggregate([
          { $match: { _id: objectId(orderId) } },

          {
            $unwind: "$products",
          },
          {
            $project: {
              status: 1,
              orderStatus: 1,
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              status: 1,
              orderStatus: 1,
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $project: {
              status: 1,
              orderStatus: 1,
              item: 1,
              quantity: 1,
              product: 1,
              total: { $multiply: ["$quantity", "$product.price"] },
            },
          },
        ])
        .toArray();

      resolve(orderItems);
    });
  },

  getReturnOrder: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.RETURN_COLLECTION)
        .findOne({ orderId: objectId(orderId) })
        .then((data) => {
          resolve(data);
        });
    });
  },

  changeReturnStatus: (details) => {
    let orderId = details.orderId;
    let orderStatus = details.status;
    console.log(orderStatus);
    console.log("orderStatus");
    console.log(details);

    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.RETURN_COLLECTION)
        .deleteOne({ orderId: objectId(orderId) });

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: orderStatus,
              returnConfirmStatus: true,
            },
          }
        )
        .then((data) => {});
    });
  },

  getReturnCounts: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.RETURN_COLLECTION)
        .countDocuments()
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },

  refund: (orderId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              status: "Refunded",
            },
          }
        )
        .then((data) => {
          resolve();
        });
    });
  },

  addTowallet: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let order = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .findOne({ _id: objectId(orderId) });

      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(order.userId) });

      let walletAmount = user.walletAmount;

      walletAmount = parseInt(walletAmount + order.totalAmount);

      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(order.userId) },
          {
            $set: {
              walletAmount: walletAmount,
            },
          }
        );

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: {
              addTowallet: true,
            },
          }
        )
        .then((data) => {
          resolve();
        });
    });
  },

  walletAmountReduce: (userId, amount) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) });

      let walletAmount = user.walletAmount;

      walletAmount = parseInt(walletAmount - amount);

      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: {
              walletAmount: walletAmount,
            },
          }
        );

      resolve();
    });
  },

  changeOrderStatus: (details) => {
    let orderId = details.orderId;
    let orderStatus = details.status;
    console.log(orderStatus);
    console.log("orderStatus");

    if (orderStatus == "Delivered") {
      return new Promise(async (resolve, reject) => {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: orderStatus,
                delivereyStatus: true,
              },
            }
          )
          .then((data) => {
            resolve();
          });
      });
    } else {
      console.log("orderStatus else");
      return new Promise(async (resolve, reject) => {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: orderStatus,
              },
            }
          )
          .then((data) => {
            resolve();
          });
      });
    }
  },

  addUserAdderss: (details) => {
    details.userId = objectId(details.userId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .insertOne(details)
        .then((data) => {
          resolve();
        });
    });
  },

  getUserAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let address = await db
        .get()
        .collection(collection.ADDRESS_COLLECTION)
        .find({ userId: objectId(userId) })
        .toArray();
      resolve(address);
    });
  },

  deleteAddress: (id) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .deleteOne({ _id: objectId(id) })
        .then((data) => {
          resolve(data);
        });
    });
  },

  findAddress: (id) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .findOne({ _id: objectId(id) })
        .then((data) => {
          resolve(data);
        });
    });
  },

  editAddress: (data) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.ADDRESS_COLLECTION)
        .updateOne(
          { _id: objectId(data.addressId) },
          {
            $set: {
              firstname: data.firstname,
              lastname: data.lastname,
              address: data.address,
              city: data.city,
              state: data.state,
              pincode: data.pincode,
              phone: data.phone,
              email: data.email,
            },
          }
        )
        .then((data) => {});
    });
  },

  editUserDetails: (details) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      let userMbile = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({
          $and: [
            { mobile: details.mobile },
            { _id: { $ne: objectId(details.userId) } },
          ],
        });
      let useremail = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({
          $and: [
            { email: details.email },
            { _id: { $ne: objectId(details.userId) } },
          ],
        });
      console.log("useremail");
      console.log(useremail);

      if (userMbile) {
        response.mobileExist = true;
        response.message = "Mobile Number already in use";
        resolve(response);
      } else if (useremail) {
        response.mobileExist = false;
        response.emailExist = true;
        response.message = "Email  already in use";
        resolve(response);
      } else {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(details.userId) },
            {
              $set: {
                name: details.name,
                email: details.email,
                mobile: details.mobile,
              },
            }
          )
          .then((data) => {
            response.mobileExist = false;
            response.emailExist = false;
            response.message = "";
            resolve(response);
          });
      }
    });
  },

  checkOldPassword: (details) => {
    return new Promise(async (resolve, reject) => {
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(details.userId) });

      bcrypt.compare(details.password, user.password).then((status) => {
        resolve(status);
      });
    });
  },

  changePassword: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.password = userData.password.toString();
      userData.password = await bcrypt.hash(userData.password, 10);

      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userData.userId) },
          {
            $set: {
              password: userData.password,
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },

  filteredProducts: (id) => {
    let { brand } = id;

    return new Promise((resolve, reject) => {
      let newArr;
      console.log(Array.isArray(id.brand));
      console.log("heu");

      if (Array.isArray(brand)) {
        newArr = brand.map(myFunction);
        function myFunction(num) {
          return objectId(num);
        }
        console.log(newArr);
      } else {
        console.log("hai");
        console.log(brand);
        brand = Object.values(id);
        console.log(brand);
        newArr = brand.map(myFunction);

        function myFunction(num) {
          return objectId(num);
        }

        console.log(newArr);
      }

      console.log("new array");
      console.log(newArr);
      db.get()
        .collection(collection.PRODUCT_COLLLECTION)
        .aggregate([
          { $match: { brandId: { $in: newArr } } },
          {
            $lookup: {
              from: collection.CATEGORY_COLLECTION,
              localField: "brandId",
              foreignField: "_id",
              as: "brands",
            },
          },
          {
            $project: {
              name: 1,
              price: 1,
              brandId: 1,
              img: 1,
              visiblity: 1,
              stock: 1,
              brand: { $arrayElemAt: ["$brands", 0] },
            },
          },
          {
            $project: {
              name: 1,
              price: 1,
              brandId: 1,
              img: 1,
              visiblity: 1,
              stock: 1,
              brand: "$brand.brand",
            },
          },
        ])
        .toArray()
        .then((data) => {
          console.log(data);
          resolve(data);
        });
    });
  },

  getSearchResults: (name) => {
    return new Promise((resolve, reject) => {
      console.log("hai");

      db.get()
        .collection(collection.PRODUCT_COLLLECTION)
        .find({ name: { $regex: new RegExp("^" + name + ".*", "i") } })
        .limit(5)
        .toArray()
        .then((data) => {
          console.log("kkkkkkkkkkkkkkkkk");

          resolve(data);
        });
    });
  },
};
