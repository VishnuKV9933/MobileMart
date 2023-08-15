// const MongoClient=require('mongodb').MongoClient
// const state={db:null}

// module.exports.connect=function(done){
//     const url='mongodb+srv://vishnukv:Asmpvvaauatlas@cluster0.8juhmzx.mongodb.net/test'
//     const dbname='shopping2'
//     MongoClient.connect(url,(err,data)=>{
//         if(err) return done (err)
//         state.db=data.db(dbname)
//         done()
//     })
// }
// module.exports.get=function(){
//     return state.db
// }
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Define the state object outside of the connect function
const state = {
  db: null,
};

module.exports.connect = async function (done) {
  const url = process.env.Mongo_Url;
  const dbName = 'shopping2';
  
  try {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    state.db = client.db(dbName);
    done();
  } catch (error) {
    console.error('Error connecting to the database:', error);
    done(error);
  }
};

module.exports.get = function () {
  return state.db;
};
