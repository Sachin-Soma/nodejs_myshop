const express = require('express');
const {check,body} = require('express-validator')
const authController = require('../controllers/auth');
const User = require('../models/user');
const e = require('connect-flash');
const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',[check('email').isEmail().withMessage('Please enter a valid email address').normalizeEmail().custom((value,{req})=>{
    return  User.findOne({ email: value })
    .then(user => {
      if (!user) {
       return Promise.reject('Invalid email or password.');
      }
      return true;
    });
}),
body('password').trim().notEmpty().withMessage('Password cannot be empty')
], authController.postLogin);

router.post('/signup',[check('email').normalizeEmail().isEmail().withMessage('Please enter a valid email address').custom((value,{req})=>{
   return User.findOne({ email: value })
    .then(userDoc => {
      if (userDoc) {
       return Promise.reject('E-Mail exists already, please pick a different one.');
      }});


}),
body('password','Please enter a password greater than 5 digit with only alphanumeric characters').trim().isLength({min:5})
// .isAlphanumeric(),
,body('confirmPassword').trim().custom((value,{req})=>{
    if(value !== req.body.password){
        throw new Error('Passwords should match');
    }
    return true;

})
], authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset',authController.getReset);

router.post('/reset',authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;