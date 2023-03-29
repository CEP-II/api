const express = require('express')
const app = express()
const morgan = require('morgan') // <--- we want all requests to be funneled through morgan to log it. 
const bodyParser = require('body-parser') // <--- parse the body of incoming requests, othwerwise not nicely formatted

const mongoose = require('mongoose')


const productRoutes = require('./api/routes/products')
const orderRoutes = require('./api/routes/orders')
const userRoutes = require('./api/routes/user')


const adminRoutes = require('./api/routes/admin')
const citizenRoutes = require('./api/routes/citizen')
const timestampRoutes = require('./api/routes/timestamps')



// 
mongoose.connect('mongodb+srv://nightassist:' + 
                process.env.MONGO_ATLAS_PW + 
                '@nightassist.ifgd2oi.mongodb.net/?retryWrites=true&w=majority')


// middleware below, sequential flow
app.use(morgan('dev')); // <-- log

// make folder publically available to get access to images. There are other ways of doing this, e.g. by introducing new routes.
app.use('/uploads', express.static('uploads')) // first parameter ensures we only parse requests to the '/uploads' path.

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// Our RESTful API should not run into CORS errors (cross-origin ressource sharing), which are caused by browsers. 
// We adjust the header of response to give access for different origin server/clients. 
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*') // give access to any origin '*'
    res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization') // which kind of headers may be sent with req/res

    // browser always sends option request first when sending post/put requests (to see what it is allowed to do basically)
    if(req.method === 'OPTIONS') {      
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
        return res.status(200).json({}) // we don't need to go to the routes. Option request is just to figure out "rights"/"options" 
    }

    // Currently locking incoming request
    next();
})

// Routes which should handle requests
app.use('/products', productRoutes)
app.use('/orders', orderRoutes)
app.use('/user', userRoutes)
app.use('/citizen', citizenRoutes)
app.use('/timestamps', timestampRoutes)
app.use('/admin', adminRoutes)



// If we get down here the request is different from what we want to / can handle. 
// We handle every request that reaches this line. 
app.use((req, res, next) => {
    const error = new Error('Not found');
    error.status = 404;
    next(error); // forward request (error request instead of original one)
})

// error handling from above but also errors from anywhere else in the application (i.e. database operations might fail, 500 erorrs)
app.use((error, req, res, next) => {
    res.status(error.status || 500)
    res.json({
        error: {
            message: error.message
        }
    })
})

module.exports = app
