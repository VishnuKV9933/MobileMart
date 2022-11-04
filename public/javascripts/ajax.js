
function addToCart(proid){

    $.ajax({
        url:"/add-to-cart/"+proid,
        method:"get",
        
        success:(response)=>{

           if(response.status){
            swal("Good job!", "Product added to cart", "success");
      
            let count=$("#cart-count").html()
            count=parseInt(count)+1
            $("#cart-count").html(count)
          
           }
           else
           {
            
            swal("Out of stock!");
           }
            
        }
    })

}




function addToCartWishlist(proid){
    
    $.ajax({
        url:"/add-to-cart-wishlist/"+proid,
        method:"get",
        
        success:(response)=>{
console.log('kkkkkkkkkkkkkkkkkkkkkkkkkk');
           if(response.status){
            alert('Item added to cart')
      
            let count=$("#cart-count").html()
            count=parseInt(count)+1
            $("#cart-count").html(count)

            location.href='/delete-from-WishList'

           }else{
            
            alert('out of stock')
           }
        
        }
    })
}



function removeProduct(cartId,productId){
    console.log(productId)
    console.log(cartId)

    $.ajax({
        url:"/remove-product",
        data:{
            cart:cartId,
            product:productId,
        },
        type:'post',
        method:'post',
        success:(response)=>{
         
            alert('Product removed from the cart ')
            location.reload()
        
        }

    })

}


function changeProductQuantity(cartId,proId,userId,count){


    console.log(userId)
    let quantity = parseInt(document.getElementById('quantity'+proId).innerHTML)

    
    $.ajax({
        url:"/change-product-quantity",  
        data:{
            userId:userId,
            cart:cartId,
            product:proId,
            count:count,
            quantity:quantity
        },
        method:'post',
        success:(response)=>{
            console.log(response);
        if(response.removeProduct){
           alert('Product removed from the cart')
           location.reload()
           }else if(response.status){
            document.getElementById('outOfStock'+proId).style.display='none'
             quantity=document.getElementById('quantity'+proId).innerHTML=quantity+count
            let price=document.getElementById('price'+proId).innerHTML

            let totalPrice=document.getElementById('total'+proId).innerHTML=price*quantity

             document.getElementById('grandTotal').innerHTML=response.total[0].grandTotal
            console.log(totalPrice);
        }else{
            document.getElementById('outOfStock'+proId).style.display='block'
        
            setTimeout(()=>{
                document.getElementById('outOfStock'+proId).style.display='none'
            },2000 )
        }
        }
      
    })
}
 


$("#checkout-form").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/place-order',
        method:'post',
        data:$('#checkout-form').serialize(),
        success:(response)=>{
            if(response.codSuccess){
                location.href='/order-placed'
            }else if(response.wallet){
               
                if(response.amount){

                    location.href='/order-placed'

                }else{

                    document.getElementById('wallet_message').style.display='block'

                    setTimeout(() => {
                        document.getElementById('wallet_message').style.display='none'
                    }, 3000);

                }


            }else if(response.razorpay){
                razorpayPayment(response)
            }else{
            
                paypalPayment(response);

            }

        }
    })

})

//---------------------------------------------coopon-------------------------------------------------------




$("#coopon-form").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/apply-coopon',
        method:'post',
        data:$('#coopon-form').serialize(),
        success:(response)=>{
         if(response.status){
           
            // let totalAmount=document.getElementById('totalAmount').innerHTML

            // let discount=Math.round((response.coopon.percentage*totalAmount)/100)
            // let amount=totalAmount-discount
          
            //  document.getElementById('discountTotalAmount').innerHTML=amount
             
            //  document.getElementById('cooponMessage').innerHTML=response.message
            //  document.getElementById('cooponApplied').style.display="block"
            // // document.getElementById('cooponMessage').style.display='block'

            //  document.getElementById('diacountTotalTag').style.display='block'
        location.reload()

         }else {
            document.getElementById('cooponMessage').innerHTML=response.message
            document.getElementById('cooponMessage').style.color="red"
            document.getElementById('cooponMessage').style.display='block'
            // document.getElementById('diacountTotalTag').style.display='none'
              
            setTimeout(()=>{
                document.getElementById('cooponMessage').style.display='none'
            },2000 )

         }
          
        }
    })

})

//--------------------------------------------razorpay------------------------------------------------

function razorpayPayment(order){

    var options = {
        "key":"rzp_test_7bizOs9oIerHdK", 
        "amount": order.amount,
        "currency": "INR",
        "name": "Mobile Mart",
        "description": "Test Transaction",
        "image": "assets/images/logo.png",
        "order_id": order.id, 
        "handler": function (response){
     
            verifyPayment(response,order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };

    var rzp1 = new Razorpay(options);
    rzp1.open();
}


function verifyPayment(payment,order){
  $.ajax({
    url:'verify-payment',
    data:{payment,
         order
        },
    method:'post',
    success:(response)=>{
        if(response.status){
            location.href='/order-placed'
        }else{
            alert("Payment Failed")
        }

    }   
  })
}
//------------------------------------------------------------paypal----------------------------------------------------------

function paypalPayment(details){
    console.log(details);
    // details.total=details.total*0.012
    
$.ajax({

    url:'/pay',
    method:'post',
    data:details,
    success:(response)=>{
    
     location.href=response
    }
}) 
}  
//----------------------------------------------------------------------------------------------------------------------

    
    function adminOrderCancel(orderId){
        console.log('hai');
        
        $.ajax({
            url:"/admin/order-cancel/",
            data:{
                orderId:orderId
            },
            method:"post",
            
            success:(response)=>{
                if(response.status){
                    alert('ordered cancelled')
                    location.reload()
                }
          
                
            }
        })
    }
     
    
        
    $('#h').submit((e)=>{

        e.preventDefault()
        $.ajax({
            url:'/return-order',
            method:'post',
            data:$('#h').serialize(),
            success:(response)=>{
                 alert('response')

            }
        })
    })
       


    
// function returnOrder(orderId){
    
//     $.ajax({
//         url:"/order-return/",
//         data:{
//             orderId:orderId
//         },
//         method:"post",
        
//         success:(response)=>{
//             if(response.status){
//                 alert('ordered cancelled')
//                 location.reload()
//             }
      
//         }
//     })
// }



   function changeStatus(orderId){
  
    console.log(orderId);
    let status=document.getElementById('changestatus').value
    console.log(status);


    $.ajax({
        url:'/admin/changeOrderStatus',
        data:{
            orderId:orderId,
            status:status
        },
        method:"post",
        success:(response)=>{
       location.href='/admin/orders'
        }   
       })
    
   }

   function changeReturnStatus(orderId){
  
    console.log(orderId);
    let status=document.getElementById('changeReturnstatus').value
    console.log(status);


    $.ajax({
        url:'/admin/changeReturnStatus',
        data:{
            orderId:orderId,
            status:status
        },
        method:"post",
        success:(response)=>{
            alert('response')

       }
    
       })
    
   }



   function orderCancel(orderId) { 
    swal({
        title: "Are you sure?",
        text: "Once cancelled you will not be able to recover this order!",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    })

        .then((willDelete) => {
            if (willDelete) {
          
                $.ajax({
                    url: "/order-cancel",
                    data: {
                        orderId:orderId
                    },
                    method: 'post',
                    success: (response) => {
                 
                         swal("Poof! Your order has been cancelled!", {
                            icon: "success",
                            
                        }).then(function(){
                            location.reload();
                        })
                       
                        
                       
                    }

                })

            } else {
                swal("Your order is safe!");
            }
        });
}

//--------------------------------------------------------------------------------

// function sendData(e){
//     let searchReaults=document.getElementById('searchReaults')
//     fetch('getProducts',{
//         method:'post',
//         headers:{'Content-type':'application/json'},
//         body:JSON.stringify({'payload':e.value})
//     }).then(res => res.json()).then(data =>{
//         let payload=data.payload
//         console.log('hai');
//         console.log(payload);
//         searchReaults.innerHTML=""
//         if(payload.length < 1){
//             searchReaults.innerHTML='<p>sorry nouthing found</p>'
//              return;
//         }

//     })
// }




function sendData(e) {
  
    const searchResutls = document.getElementById('searchResults')
    let match = e.value.match(/^[a-zA-Z ]*/)
    let match2 = e.value.match(/\s*/)
    if (match2[0] === e.value) {
        searchResutls.innerHTML = ''
        searchResutls.style.display = 'none'
        return
    }
    if (match[0] === e.value) {
        searchResutls.style.display = 'block'
        fetch('/getProducts', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'payload': e.value })
        }).then(res => res.json()).then(data => {
            let payload = data.payload
            searchResutls.innerHTML = ''
            if (payload.length < 1) {

                searchResutls.innerHTML = '<p>Sorry nothing found</p>'
                return 
            }
            payload.forEach((item, index) => {
                console.log('===================', item.name)
                if (index > 0) searchResutls.innerHTML += '<hr>'
                searchResutls.innerHTML += `<a  href="/product/${item._id}"><img src="/images/product/${item.img[0]}" style="height:25px;width:30px;display:inline;margin-left:50px"alt=""></a>`;
                searchResutls.innerHTML += `<a  href="/product/${item._id}" style="display:inline;color:black">${item.name}</a>`
            })
            return
        })
    }

}

