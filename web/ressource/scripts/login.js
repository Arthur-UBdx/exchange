$(function() {
    $('#login-submit').click(function() {
        const username = $('#username').val();
        const password = $('#password').val();
        const response = $('#response');

        if (username.length < 3 || username.length > 64 || password.length < 8 || password.length > 64 || !/^[a-zA-Z0-9!@#$%^&*_-]+$/.test(password)) {
            response.html('Invalid username or password 1');
            response.css('color', 'red');
            return;
        }

        $.ajax({
            url: '/api/login',
            type: 'POST',
            data: JSON.stringify({
                username: username,
                password: password,
                remember_me: $('#remember').is(':checked')
            }),
            contentType: 'application/json',
            success: function(data) {
                console.log(data);
                if (data.success === 'true') {
                    response.html('Logged in successfully');
                    response.css('color', 'green');
                    setTimeout(function() {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    response.html(`error when logging in:<br>${data.message}`);
                    response.css('color', 'red');
                }
            },
            error: function(data) {
                console.log(data);
                response.html(`error when logging in:<br>${data.responseJSON.message}`);
                response.css('color', 'red');
            }
        });
    });


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