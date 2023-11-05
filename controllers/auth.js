const bcrypt = require('bcryptjs');

const { query, validationResult } = require('express-validator');
const User = require('../models/user');
// const nodemailer = require('nodemailer');
// const sendgridTransport = require('nodemailer-sendgrid-transport');
// const mailchimp = require('@mailchimp/mailchimp_marketing');
//require('dotenv').config(); 
const mailchimp = require('@mailchimp/mailchimp_transactional')(
  "72a9c76265c234b3ee2bcdb95dd397d3-us21"
);


const crypto = require('crypto');


//mailchimp.setApiKey(process.env.MAILCHIMP_API_KEY);

// const transporter = nodemailer.createTransport(
//   sendgridTransport({
//     auth: {
//       api_key:
//         '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'
//     }
//   })
// );


// initializeMailchimp();
// callPing();

// async function initializeMailchimp() {
//   try {
//     mailchimp.setConfig({
//       apiKey: '7fb0dd71e600b772abd7f44f2069d13f-us17',
//       server: 'us17', // The last part of your Mailchimp API key (e.g., 'us1')
//     });
//     console.log('Mailchimp client initialized successfully!');
//   } catch (error) {
//     console.error('Error initializing Mailchimp:', error);
//   }
// }


// async function callPing() {
//   const response = await mailchimp.ping.get();
//   console.log(response);
// }

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput:{
      email: '',
      password: '',
      confirmPassword:''
    }
  , validationErrors: []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message,
    oldInput:{
      email: '',
      password: '',
      confirmPassword:''
    },
    validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors=  validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors.array());
   return res.status(422).render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: errors.array()[0].msg,
    oldInput:{
      email: email,
      password: password
    }
  , validationErrors: errors.array()
  });
 
  }
  User.findOne({ email: email })
    .then(user => {
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
       
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput:{
              email: email,
              password: password
            }
          , validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
 const errors=  validationResult(req);
 if(!errors.isEmpty()){
  console.log(errors.array());
  return res.status(422).render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: errors.array()[0].msg,
    oldInput:{
      email: email,
      password: password,
      confirmPassword:confirmPassword
    }
  , validationErrors: errors.array()
  });

 }
  bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
          // return transporter.sendMail({
          //   to: email,
          //   from: 'shop@node-complete.com',
          //   subject: 'Signup succeeded!',
          //   html: '<h1>You successfully signed up!</h1>'
          // });
        return  mailchimp.messages.send({
            message: {
              subject: {
                text: 'Signup succeeded!' // Add the subject text here
              }
              ,
              from_email: 'shop@node-complete.com',
              to: [{ email: email }],
              html: '<h1>You successfully signed up!</h1>',
            }
          });

        })
        .catch(err => {
          console.log(err);
        });  
  
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        res.redirect('/');
        // transporter.sendMail({
        //   to: req.body.email,
        //   from: 'shop@node-complete.com',
        //   subject: 'Password reset',
        //   html: `
        //     <p>You requested a password reset</p>
        //     <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
        //   `
        // });
        // mailchimp.messages.send({
        //   message: {
        //     subject: 'Password reset',
        //     from_email: 'shop@node-complete.com',
        //     to: [{ email: req.body.email }],
        //     html: `
        //     <p>You requested a password reset</p>
        //     <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
        //   `,
        //   },
        // });
        sendEmail(req.body.email,token);
      })
      .catch(err => {
        console.log(err);
      });
  });
};



async function sendEmail(recipientEmail,token) {
  try {
    const response = await mailchimp.messages.send({
      message: {
        subject: {
          text: 'Password reset'
        },
        from_email: 'shop@node-complete.com',
        to: [{ email: recipientEmail }],
        html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
      `,
      }
    });


    console.log('Email sent successfully!');
    console.log('Response:', response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
