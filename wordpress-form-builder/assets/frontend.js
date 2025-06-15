
// Frontend Form Handling
jQuery(document).ready(function($) {
    $('.afb-form').on('submit', function(e) {
        e.preventDefault();
        
        var $form = $(this);
        var $submitBtn = $form.find('.afb-submit-btn');
        var $messages = $form.find('.afb-form-messages');
        var formId = $form.data('form-id');
        
        // Disable submit button
        $submitBtn.prop('disabled', true).text('Submitting...');
        
        // Clear previous messages
        $messages.empty();
        
        // Collect form data
        var formData = {};
        $form.find('input, textarea, select').each(function() {
            var $field = $(this);
            var name = $field.attr('name');
            var value = $field.val();
            
            if (name && name !== 'afb_nonce' && name !== '_wp_http_referer') {
                if ($field.attr('type') === 'checkbox') {
                    formData[name] = $field.is(':checked') ? value : '';
                } else if ($field.attr('type') === 'radio') {
                    if ($field.is(':checked')) {
                        formData[name] = value;
                    }
                } else {
                    formData[name] = value;
                }
            }
        });
        
        // Submit via AJAX
        $.ajax({
            url: afb_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'afb_submit_form',
                form_id: formId,
                form_data: formData,
                afb_nonce: $form.find('input[name="afb_nonce"]').val()
            },
            success: function(response) {
                if (response.success) {
                    $messages.html('<div class="afb-message success">' + response.data + '</div>');
                    $form[0].reset(); // Reset form
                } else {
                    $messages.html('<div class="afb-message error">' + response.data + '</div>');
                }
            },
            error: function() {
                $messages.html('<div class="afb-message error">An error occurred. Please try again.</div>');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).text('Submit Form');
                
                // Scroll to messages
                $('html, body').animate({
                    scrollTop: $messages.offset().top - 100
                }, 500);
            }
        });
    });
});
