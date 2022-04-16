var popup = document.getElementById("popup");
var productsNode = document.getElementById("products");
var loadBtn = document.getElementById("loadBtn");
var goToCartBtn = document.getElementById("goToCartBtn");
var flag = true;

var count = 2;

goToCartBtn.addEventListener("click", function(){
    window.location.href = "/viewCart";
})

loadBtn.addEventListener("click", function(){
    productsNode.innerHTML = "";
    onLoad(count);
    count++;
})

function onLoad(page){
    var request = new XMLHttpRequest();
    request.open("POST", "/getProducts");
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify({page: page}));

    request.addEventListener("load", function(){
        var products = JSON.parse(request.responseText);
        products.forEach(function(product) {
            var productNode = createProductNode(product);
            productsNode.appendChild(productNode);
        });
    });
}

onLoad(1);

function createProductNode(product){
    var productNode = document.createElement("div");
    productNode.setAttribute("class", "productDiv");

    var nameNode = document.createElement("h4");
    nameNode.innerHTML = product.name;
    productNode.appendChild(nameNode);

    var priceNode = document.createElement("h4");
    priceNode.innerHTML = product.price;
    productNode.appendChild(priceNode);

    var addToCartButton = document.createElement("button");
    addToCartButton.setAttribute("id", "addToCartBtn");
    addToCartButton.innerHTML = "Add to Cart";
    addToCartButton.setAttribute("class", "buttons");
    addToCartButton.addEventListener("click", addTocart(product));
    productNode.appendChild(addToCartButton);

    var descriptionBtn = document.createElement("button");
    descriptionBtn.setAttribute("id", "descBtn");
    descriptionBtn.innerHTML = "View Desc";
    descriptionBtn.setAttribute("class", "buttons");
    descriptionBtn.addEventListener("click", togglePopup(product));
    productNode.appendChild(descriptionBtn);
    
    productNode.style = "display: inline-block"
    return productNode;
}

function addTocart(product){
    return function(event){
        var request = new XMLHttpRequest();
        request.open("POST", "/cart");
        request.setRequestHeader("Content-type", "application/json");
        request.send(JSON.stringify({id: product._id}));

        request.addEventListener("load", function(){
            if(request.status === 401){
                alert("Please Login");
                window.location.href = "/login";
            }
            else if(request.status === 200){
                console.log("added to cart");
                console.log(event.target);
                event.target.disabled = true;
                event.target.innerHTML = "Added to Cart";
            }
            else if(request.status === 409){
                alert("Item already in cart");
                window.location.href = "/home";
            }
        })
    }
}

function togglePopup(product){
    return function(){
        popup.innerHTML = ""

        var closeBtn = document.createElement("button");
        closeBtn.innerHTML = "×";
        closeBtn.addEventListener("click", closePopup);

        var name = document.createElement("h3");
        var price = document.createElement("h3");
        var description = document.createElement("p");

        name.innerHTML = product.name;
        price.innerHTML = product.price;
        description.innerHTML = product.description;

        popup.appendChild(closeBtn);
        popup.appendChild(name);
        popup.appendChild(price);
        popup.appendChild(description);
        popup.style = "display: block;";
    }
}

function closePopup(){
    popup.style = "display: none;";
}