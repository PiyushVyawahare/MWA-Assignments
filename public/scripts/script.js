// var popup = document.getElementById("popup");
// var productsNode = document.getElementById("products");
// var loadBtn = document.getElementById("loadBtn");
// var addProductBtn = document.getElementById("addProductBtn");





// var flag = true;

// var count = 2;




// loadBtn.addEventListener("click", function(){
//     productsNode.innerHTML = "";
//     onLoad(count);
//     count++;
// })

// function onLoad(page){
//     var request = new XMLHttpRequest();
//     request.open("POST", "/home");
//     request.setRequestHeader("Content-type", "application/json");
//     request.send(JSON.stringify({page: page}));

//     request.addEventListener("load", function(){
//         // var products = JSON.parse(request.responseText);
//         // products.forEach(function(product) {
//         //     var productNode = createProductNode(product);
//         //     productsNode.appendChild(productNode);
//         // });
//     });
// }

// onLoad(1);

// function createProductNode(product){
//     var productNode = document.createElement("div");
//     productNode.setAttribute("class", "productDiv");

//     var imageNode = document.createElement("img");
//     imageNode.src = product.product_pic;
//     // imageNode.width = "100px";
//     // imageNode.height = "100px";
//     imageNode.setAttribute("width", "100px");
//     productNode.appendChild(imageNode);

//     var nameNode = document.createElement("h4");
//     nameNode.innerHTML = product.product_name;
//     productNode.appendChild(nameNode);

//     var priceNode = document.createElement("h4");
//     priceNode.innerHTML = product.product_price;
//     productNode.appendChild(priceNode);

//     var addToCartButton = document.createElement("button");
//     addToCartButton.setAttribute("id", "addToCartBtn");
//     addToCartButton.innerHTML = "Add to Cart";
//     addToCartButton.setAttribute("class", "buttons");
//     addToCartButton.addEventListener("click", addTocart(product));
//     productNode.appendChild(addToCartButton);

//     var descriptionBtn = document.createElement("button");
//     descriptionBtn.setAttribute("id", "descBtn");
//     descriptionBtn.innerHTML = "View Desc";
//     descriptionBtn.setAttribute("class", "buttons");
//     descriptionBtn.addEventListener("click", togglePopup(product));
//     productNode.appendChild(descriptionBtn);
    
//     productNode.style = "display: inline-block"
//     return productNode;
// }

// function addTocart(product){
//     return function(event){
//         var request = new XMLHttpRequest();
//         request.open("POST", "/cart");
//         request.setRequestHeader("Content-type", "application/json");
//         request.send(JSON.stringify({id: product._id}));

//         request.addEventListener("load", function(){
//             if(request.status === 401){
//                 alert("Please Login");
//                 window.location.href = "/login";
//             }
//             else if(request.status === 200){
//                 console.log("added to cart");
//                 console.log(event.target);
//                 event.target.disabled = true;
//                 event.target.innerHTML = "Added to Cart";
//             }
//             else if(request.status === 409){
//                 alert("Item already in cart");
//                 window.location.href = "/home";
//             }
//         })
//     }
// }

var descBtnNodes = document.querySelectorAll(".descBtn");
var closeBtnNodes = document.querySelectorAll(".closeBtn");
var addToCartBtnNodes = document.querySelectorAll(".addToCartBtn");
var goToCartBtn = document.getElementById("goToCartBtn");
var addProductBtn = document.getElementById("addProductBtn");
var updateProductBtnNodes = document.querySelectorAll(".updateProductBtn");
var deleteProductBtnNodes = document.querySelectorAll(".deleteProductBtn");

if(goToCartBtn){
    goToCartBtn.addEventListener("click", function(){
        window.location.href = "/viewCart";
    })
}

if(addProductBtn){
    addProductBtn.addEventListener("click", function(){
        window.location.href = "/addProduct";
    })
}

if(updateProductBtnNodes){
    updateProductBtnNodes.forEach(function(element){
        element.addEventListener("click", function(event){
            var productDiv = event.target.parentNode;
            console.log(productDiv);
            updateProduct(productDiv.getAttribute("id"));
        })
    });
}


if(deleteProductBtnNodes){
    deleteProductBtnNodes.forEach(function(element){
        element.addEventListener("click", function(event){
            var productDiv = event.target.parentNode;
            deleteProduct(productDiv.getAttribute("id"));
        });
    });
}

function updateProduct(id){
    // console.log(id);
    var url = "/updateProduct/"+id;
    window.location.href = url;
}


function deleteProduct(id){

    var request = new XMLHttpRequest();
    request.open("POST", "/deleteProduct");
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify({id: id}));

    request.addEventListener("load", function(){
        var productToDelete = document.getElementById(id);
        parentNode = productToDelete.parentNode;
        if(request.status === 200)
            parentNode.removeChild(productToDelete);
        else
            console.log("error occured");
    })
}


if(descBtnNodes){
    descBtnNodes.forEach(function(element){
        element.addEventListener("click", function(event){
            var productDiv = event.target.parentNode;
            console.log(productDiv);
            togglePopup(productDiv);
        })
    })
}


closeBtnNodes.forEach(function(element){
    element.addEventListener("click", function(event){
        var popupDiv = event.target.parentNode;
        closePopup(popupDiv);
    })
})


if(addToCartBtnNodes){
    addToCartBtnNodes.forEach(function(element){
        element.addEventListener("click", function(event){
            var productDiv = event.target.parentNode;
            console.log(productDiv.getAttribute("id"));
            addToCart(productDiv.getAttribute("id"));
        })
    })
}


function togglePopup(productDiv){
    console.log(1);
    productDiv.children[0].style = "display: block";
}

function closePopup(popupDiv){
    popupDiv.style = "display: none";
}

function addToCart(id){
    var request = new XMLHttpRequest();
    request.open("POST", "/cart");
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify({id: id}));

    request.addEventListener("load", function(){
        if(request.status === 401){
            alert("Please Login");
            window.location.href = "/login";
        }
        else if(request.status === 200){
            alert("Item addded to Cart successfully!!")
        }
        else if(request.status === 409){
            alert("Item already in cart");
            window.location.href = "/home";
        }
    })
}