$(function() {
    $('#register-submit').on('click', function() {
      $('#response').html('');
        const email = $('#email').val();
        const password = $('#password').val();

        const email_regex = new RegExp('^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$');
        const password_regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_-])');

        if(!email_regex.test(email)) {
            $('#response').html('Invalid email');
            $('#response').css('color', 'red');
            return;
        }

        if(!password_regex.test(password)) {
            $('#response').html('Invalid password');
            $('#response').css('color', 'red');
            return;
        }
    })
    

    $('#showpass').change(function() {
      if (this.checked) {
        $('#password').attr('type', 'text');
        $('#password-confirm').attr('type', 'text');
        $('#label-showpass').html('<b>Hide passwords</b>');
      } else {
        $('#password').attr('type', 'password');
        $('#password-confirm').attr('type', 'password');
        $('#label-showpass').html('<b>Show passwords</b>');
      }

    });
})