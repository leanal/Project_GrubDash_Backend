const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: dishes })
}

function priceIsIntegerMoreThanZero (req, res, next) {
    const { data: { price } = {} } = req.body;
    let errMessage = "";

    if (!price) {
        errMessage = `Dish must include a price`;
    } else if (typeof price === 'string' || price < 0) {
        errMessage = `Dish must have a price that is an integer greater than 0`;
    } else {
        next();
    };
    
    next({
       status: 400,
       message: errMessage,
    });
};

// middleware function to validate the request body
function checkBodyProperties(req, res, next) {
    const { data: { name, description, image_url, price } = {} } = req.body;
    let errMessage = "";

    // Call `next()` without an error message if name, description, image_url exists and not empty
    name && description && image_url && next();
    
    if (!name) {
        errMessage = `Dish must include a name`;
    } else if (!description) {
        errMessage = `Dish must include a description`;
    } else if (!image_url) {
        errMessage = `Dish must include a image_url`;
    };

    next({
        status: 400,
        message: errMessage,
    });
};

function create(req,res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name, description, price, image_url
    }
    
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`,
    });
}

function read(req, res) {
    res.json({ data: res.locals.dish });
};

function correctIdProperty (req, res, next) {
    const dish = res.locals.dish;
    const { data: { id } = {} } = req.body;
    // respond with error if 'id' exists in req.body but not equal to dish.id
    if (id && id !== dish.id) {
        next({
            status: 400,
            message: `Id Update not allowed! Trying to update 'id' ${dish.id} to ${id}`,
        });
    }
    next();
}

function update(req, res, next) {
    const dish = res.locals.dish;
    const { data: { id, name, description, price, image_url } = {} } = req.body;
    
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    
    res.json({ data: dish })
}

module.exports = {
    list,
    create: [priceIsIntegerMoreThanZero, checkBodyProperties, create],
    read: [dishExists, read],
    update: [dishExists, priceIsIntegerMoreThanZero, checkBodyProperties, correctIdProperty, update]
};