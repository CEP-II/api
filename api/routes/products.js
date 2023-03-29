const express = require('express')
const router = express.Router()


const ProductsController = require('../controller/products')

const checkAuth = require('../middleware/checkAuth')

// package for processing files.
const multer = require('multer')

// multer storage strategy
const storageStrategy = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // callback
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + file.originalname);
    }
})

const limitStrategy = {
    fileSize: 1024 * 1024 * 5 // 5 MB
}

const fileFilterStrategy = (req, file, cb) => {
    // accept or reject incoming file.
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true) // <--- store file, null is that no error occured. 
    } else {
        cb(null, false) // <--- dont store file
    }
}

const upload = multer({storage: storageStrategy, limits: limitStrategy, fileFilter: fileFilterStrategy}) // <-- initializes multer


// first parameter is the subroutes to handle, 2nd paramter is handler
router.get('/', ProductsController.get_products)


// can pass multiple middlewares, from left to right order
router.post('/', checkAuth, upload.single('productImage'), ProductsController.create_product)

// a single product
router.get('/:productId', ProductsController.get_product)





// How to format patch requests to a specific item. 
// [
//     {"propName": "name", "value": "HarryPotter 5"}
// ]
router.patch('/:productId', checkAuth, ProductsController.patch_product)

router.delete('/:productId', checkAuth, ProductsController.delete_product)


module.exports = router
