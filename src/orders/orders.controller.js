const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: orders })
}

function validBodyProperties(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    let errMessage = "";
  
    if (!deliverTo) {
        errMessage = `Order must include a deliverTo`;
    } else if (!mobileNumber) {
        errMessage = `Order must include a mobileNumber`;
    } else if (!dishes) {
        errMessage = `Order must include a dish`;
    } else if (!Array.isArray(dishes) || dishes.length === 0) {
        errMessage = `Order must include at least one dish`;
    };
  
    if (errMessage !== "")
        next({
            status: 400,
            message: errMessage,
        });
    
    next();
};

function validDishQuantity (req, res, next) {
    const { data: { dishes } = {} } = req.body;
    
    // respond with error if 'quantity' is not an integer greater than zero
    dishes.map((dish) => {
        const { id, quantity } = dish;
        if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
            next({
                status: 400,
                message: `Dish ${id} must have a quantity that is an integer greater than 0`,
            });  
        }
    })
    next();
}

function create(req,res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo, mobileNumber, status, dishes
    }
    
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
};

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId)
    if (foundOrder) {
        res.locals.order = foundOrder;
        next();
    };
    next({ status: 404, message: `Order ${orderId} not found.`});
}

function read(req, res) {
    res.json({ data: res.locals.order })
}

function correctIdProperty (req, res, next) {
    const order = res.locals.order;
    const { data: { id } = {} } = req.body;
    // respond with error if 'id' exists in req.body but not equal to order.id
    if (id && id !== order.id) {
        next({
            status: 400,
            message: `Id Update not allowed! Trying to update 'id' ${order.id} to ${id}`,
        });
    };
    
    next();
};

function validStatusProperty (req, res, next) {
    const order = res.locals.order;
    const { data: { status } = {} } = req.body;
    if (status === "pending" ||
       status === "preparing" ||
       status === "out-for-delivery") {
        next();
    };
    next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
}

function update(req,res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    
    res.json({ data: order })
};

function statusPropertyNotPending(req, res, next) {
    const order = res.locals.order;
    if (order.status === "pending") next();
    next({ 
        status: 400,
        message: `An order cannot be deleted unless it is pending`
    });
};

function destroy (req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    orders.splice(index, 1);
    res.sendStatus(204);
};

module.exports = {
    list,
    create: [validBodyProperties, validDishQuantity, create],
    read: [orderExists, read],
    update: [orderExists, validBodyProperties, validDishQuantity, correctIdProperty, validStatusProperty, update],
    delete: [orderExists, statusPropertyNotPending, destroy]
};