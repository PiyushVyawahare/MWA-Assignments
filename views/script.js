var popup = document.getElementById("popup");
var productsNode = document.getElementById("products");
var loadBtn = document.getElementById("loadBtn");
var flag = true;

var count = 2;

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

    var descriptionBtn = document.createElement("button");
    descriptionBtn.innerHTML = "View Description";
    descriptionBtn.addEventListener("click", togglePopup(product));
    productNode.appendChild(descriptionBtn);

    return productNode;
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