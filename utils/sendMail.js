const mailjet = require ('node-mailjet');

const transporter = mailjet.connect(
    'e07d0cf9ce0c953447cf228848551f0e', 
    'f9c577c874fc35e7d91be7655040694d'
)

module.exports = function sendMail(email, title, html, callback){
    const request = transporter
    .post("send", {'version': 'v3.1'})
    .request({
    "Messages":[
        {
        "From": {
            "Email": "piyushvyawahare2001@gmail.com",
            "Name": "ECOM"
        },
        "To": [
            {
            "Email": email,
            "Name": "Piyush"
            }
        ],
        "Subject": title,
        "TextPart": "",
        "HTMLPart": html,
        "CustomID": "AppGettingStartedTest"
        }
    ]
    })
    request
    .then((result) => {
        console.log(result.body);
        callback(null);
    })
    .catch((err) => {
        console.log(err.statusCode);
        callback("error occured");
    })
}