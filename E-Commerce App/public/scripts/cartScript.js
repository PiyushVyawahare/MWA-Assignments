var goToHomeBtn = document.getElementById("goToHomeBtn");
var removeFromCartNodes = document.querySelectorAll(".removeFromCart");
var addBtnNodes = document.querySelectorAll(".add");
var subBtnNodes = document.querySelectorAll(".sub");

goToHomeBtn.addEventListener("click", function(){
    window.location.href = "/home";
})


removeFromCartNodes.forEach(function(element){
    
    element.addEventListener("click", function(event){
        var productDiv = event.target.parentNode;
        removeFromCart(productDiv.getAttribute("id"));
    })
})

addBtnNodes.forEach(function(element){

    element.addEventListener("click", function(event){
        var productDiv = event.target.parentNode;
        changeQuantity(productDiv.getAttribute("id"), true);
    })
})

subBtnNodes.forEach(function(element){

    element.addEventListener("click", function(event){
        var productDiv = event.target.parentNode;
        changeQuantity(productDiv.getAttribute("id"), false);
    })
})

function changeQuantity(id, flag){
    var request = new XMLHttpRequest();
    request.open("POST", "/changeQuantity");
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify({id: id, flag: flag}));

    request.addEventListener("load", function(){
        var divToChange = document.getElementById(id);
        console.log(request.responseText);
        divToChange.children[4].innerHTML = request.responseText;
    })
}

function removeFromCart(id){
    
    var request = new XMLHttpRequest();
    request.open("POST", "/removeFromCart");
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify({id: id}));

    request.addEventListener("load", function(){
        if(request.status === 200){
            var divToDelete = document.getElementById(id);
            // console.log(1);
            var parent = divToDelete.parentNode;
            // console.log(parent);
            parent.removeChild(divToDelete);
        }
    })
}