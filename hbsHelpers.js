module.exports={
    ifEquals:(value1,value2,value3,options)=>{

        if(value1==value2){
            if(value3){
                return options.fn(value3)
            }
           return options.fn()
        }else{  
            if(value3)
            {   
                return options.inverse(value3);      
            }

            return options.inverse();   
        }
    },
    indexing:(index)=>{
        return parseInt(index)+1;
    },
    statusColor:(value)=>{
        if(value==='cancelled'){
            return 'text-danger'
        }else if(value==='placed'){
            return 'text-success'
        }
    },
    wishlistHeartIcon:(productId,wishlistArray,options)=>{
        if(wishlistArray){
            function doesAnyWishlistIdMatch(wishlist){
                return productId == wishlist._id
            }
            if(wishlistArray.some(doesAnyWishlistIdMatch)){
                return options.fn()
            }else{
                return options.inverse();   
            }
        }else{
            return options.inverse();   
        }
        
    },
    
    calculation:(value)=>{
         return value *2
    },

    list:(value, options)=>{
         return "<h1>" + options.fn({test:value})+ "</h1>"
    },

    Offer:(offer,product)=>{
      if(offer){
        
        if(brandOffer){
            

        }else{


        }

      }else{


      }

    },

    equals:(value1,value2,options)=>{

        if(value1==value2){
            return options.fn()
        }else{
            return options.inverse()
        }

    },


    brandFilterboxChecked:(filteredProducts,brands,options)=>{
        console.log(brands);
        console.log('2222222222222222222222222222');
        console.log(filteredProducts);

        let brandId=filteredProducts.map((element)=>{
            return  element.brandId
            
        })
        console.log(brandId);
       
       let boolean=brandId.some((elements)=>{ 
        return elements.toString()==brands.toString()
           
       }) 
       if(boolean){
        return options.fn()
       }else{
        return options.inverse();
       }
    },

    orderInvoiceStatus:(orderStatus,options)=>{

     if(orderStatus =='pending'||orderStatus =='canceled'){ 
      
        return options.fn()
    }else{
        return options.inverse()
    }
    
    } ,

    hidePending:(orderStatus,options)=>{

        if(orderStatus =='pending'){ 
         
           return options.fn()
       }else{
           return options.inverse()
       }
       
       } 

}