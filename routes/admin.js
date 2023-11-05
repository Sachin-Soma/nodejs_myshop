const path = require('path');

const {check} =  require('express-validator');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth, [check('title').notEmpty().withMessage('Title cannot be empty').isLength({min:3}).withMessage('Minimum 3 characters to be added in title').isString().withMessage('Please remove invalid characters from title')
,
check('price').trim().isFloat().withMessage('Please enter a valid currency number'),
check('description').trim().isLength({min:3,max:400}).withMessage('Description should be greater than 3 and smaller than 400  characters')],adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth,adminController.getEditProduct);

router.post('/edit-product', isAuth, [check('title').notEmpty().withMessage('Title cannot be empty').isLength({min:3}).withMessage('Minimum 3 characters to be added in title').isString().withMessage('Please remove invalid characters from title')
,
check('price').trim().isFloat().withMessage('Please enter a valid currency number'),
check('description').trim().isLength({min:3,max:400}).withMessage('Description should be between 3 - 400  characters')], adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
