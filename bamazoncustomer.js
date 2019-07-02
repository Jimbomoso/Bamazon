//import modules
const Table = require('cli-table');
const mysql = require('mysql');
const inquirer = require('inquirer');

// db connection 
let connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    user: "root",

    password: "",
    database: "bamazonDB"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    startPrompt();
});

// start of app
function startPrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "confirm",
        message: "Welcome to Bamazon! Would you like to view our inventory?",
        default: true

    }]).then(function(user) {
        if (user.confirm === true) {
            inventory();
        } else {
            end();
        }
    });
}

//table for inventory
function inventory() {

    let table = new Table({
        head: ['ID', 'Item', 'Department', 'Price', 'Stock'],
        colWidths: [10, 30, 30, 30, 30]
    });

    listInventory();

    // displays inventory
    function listInventory() {


        connection.query("SELECT * FROM products", function(err, res) {
            for (let i = 0; i < res.length; i++) {

                let itemId = res[i].item_id,
                    productName = res[i].product_name,
                    departmentName = res[i].department_name,
                    price = res[i].price,
                    stockQuantity = res[i].stock_quantity;

              table.push(
                  [itemId, productName, departmentName, price, stockQuantity]
            );
          }
            console.log("");
            console.log("$$$$$$$ Current Inventory $$$$$$$");
            console.log("");
            console.log(table.toString());
            console.log("");
            continuePrompt();
        });
    }
}


function end() {
    console.log("We're sorry to see you go, please come again!");
    connection.end();
}

function restart() {
    console.log("No worries, please try again.");
    setTimeout(function(){
        inventory();
    },3000);
}
// function for purchasing 
function continuePrompt() {

    inquirer.prompt([{

        type: "confirm",
        name: "continue",
        message: "Would you like to buy an item?",
        default: true

    }]).then(function(user) {
        if (user.continue === true) {
            selectionPrompt();
        } else {
            end();
        }
    });
}

//=================================Item selection and Quantity desired===============================

function selectionPrompt() {

    inquirer.prompt([{

            type: "input",
            name: "inputId",
            message: "Please enter the ID# of the item you would like to buy.",
        },
        {
            type: "input",
            name: "inputNumber",
            message: "How many would you like to buy?",

        }
    ]).then(function(userPurchase) {

        //searches database quantity and returns whether can complete order

        connection.query("SELECT * FROM products WHERE item_id=?", userPurchase.inputId, function(err, res) {
            for (var i = 0; i < res.length; i++) {

                if (userPurchase.inputNumber > res[i].stock_quantity) {

                    console.log("===================================================");
                    console.log("Sorry! Not enough in stock to complete the order. Please try again with a lower quantity or come back later.");
                    console.log("===================================================");
                    startPrompt();

                } else {
                    //sumarizes order information for confirmation
                    console.log("===================================");
                    console.log("We can fullfill your order!");
                    console.log("===================================");
                    console.log("You've selected:");
                    console.log("----------------");
                    console.log("Item: " + res[i].product_name);
                    console.log("Department: " + res[i].department_name);
                    console.log("Price: " + res[i].price);
                    console.log("Quantity: " + userPurchase.inputNumber);
                    console.log("----------------");
                    console.log("Total: " + res[i].price * userPurchase.inputNumber);
                    console.log("===================================");

                    var newStock = (res[i].stock_quantity - userPurchase.inputNumber);
                    var purchaseId = (userPurchase.inputId);
                    confirmPrompt(newStock, purchaseId);
                }
            }
        });
    });
}

// purchase confirm function
function confirmPrompt(newStock, purchaseId) {

    inquirer.prompt([{

        type: "confirm",
        name: "confirmPurchase",
        message: "Are you sure you want to make this purchase?.",
        default: true

    }]).then(function(userConfirm) {
        if (userConfirm.confirmPurchase === true) {

            //if user  purchases, updates mysql database with new quantity

            connection.query("UPDATE products SET ? WHERE ?", [{
                stock_quantity: newStock
            }, {
                item_id: purchaseId
            }], function(err, res) {});

            console.log("=================================");
            console.log("Your order has been submitted!  Thank you!");
            console.log("=================================");
            startPrompt();
        } else {
            restart();
        }
    });
}
