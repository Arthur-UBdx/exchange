$(function() {
    $('#register-submit').on('click', function() {
      $('#response').html('');
        const email = $('#email').val();
        const username = $('#username').val();
        const password = $('#password').val();
        const password_confirm = $('#password-confirm').val();
        const response = $('#response');

        const email_regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
        const password_regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;

        if(!email_regex.test(email)) {
          response.html('Invalid email');
          response.css('color', 'red');
          return;
        }

        if(email.length > 64) {
          response.html('Email must be at most 64 characters long');
          response.css('color', 'red');
          return;
        }

        if(!username) {
          response.html('Invalid username');
          response.css('color', 'red');
          return;
        }

        if(username.length < 3) {
          response.html('Username must be at least 3 characters long');
          response.css('color', 'red');
          return;
        }

        if(username.length > 64) {
          response.html('Username must be at most 64 characters long');
          response.css('color', 'red');
          return;
        }
        
        if(!password_regex.test(password) || password.length < 8) {
          response.html('Invalid password, must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character (!@#\$%\^&\*_-)');
          response.css('color', 'red');
          return;
        }

        if(password.length > 64) {
          response.html('Password must be at most 64 characters long');
          return;
        }
        
        if(password != password_confirm) {
          response.html('Passwords do not match');
          return;
        }

        $.ajax({
          url: '/register',
          type: 'POST',
          data: JSON.stringify({
            email: email,
            username: username,
            password: password,
            remember_me: $('#remember').is(':checked')
          }),
          contentType: 'application/json',
          success: function(data) {
            console.log(data);
            if(data.success === 'true') {
              response.html('Account created successfully');
              response.css('color', 'green');
              setTimeout(function() {
                window.location.href = '/';
              }, 2000);
            } else {
              response.html(`error when creating account:<br>${data.message}`);
              response.css('color', 'red');
            }
          },
          error: function(data) {
            console.log(data);
            response.html(`error when creating account:<br>${data.responseJSON.message}`);
            response.css('color', 'red');
          }
        });
    })
    

    $('#showpass').click(function() {
      if ($('#password').attr('type') == 'password') {
        $('#password').attr('type', 'text');
        $('#password-confirm').attr('type', 'text');
        $('#showpass').html('<b>Hide passwords</b>');
      } else {
        $('#password').attr('type', 'password');
        $('#password-confirm').attr('type', 'password');
        $('#showpass').html('<b>Show passwords</b>');
      }
    });
})