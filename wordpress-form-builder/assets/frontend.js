
/* Minimal JS for AJAX submit of the form builder */
jQuery(document).ready(function($) {
  $(document).on('submit', '.afb-form', function(e) {
    e.preventDefault();
    var $form = $(this);
    var formId = $form.data('form-id');
    var formData = {};
    $form.find('input, select, textarea').each(function() {
      var $field = $(this);
      var name = $field.attr('name');
      if (!name) return;

      if ($field.is(':checkbox')) {
        formData[name] = $field.is(':checked') ? 1 : 0;
      } else if ($field.is(':radio')) {
        if ($field.is(':checked')) {
          formData[name] = $field.val();
        }
      } else {
        formData[name] = $field.val();
      }
    });
    // Only one value per radio group
    $form.find('input[type=radio]').each(function() {
      var name = $(this).attr('name');
      if (typeof formData[name] === 'undefined') {
        formData[name] = '';
      }
    });

    var $messages = $form.find('.afb-form-messages');
    $messages.html('');

    $.ajax({
      url: afb_ajax.ajax_url,
      type: 'POST',
      dataType: 'json',
      data: {
        action: 'afb_submit_form',
        afb_nonce: $form.find('input[name="afb_nonce"]').val(),
        form_id: formId,
        form_data: formData
      },
      success: function(res) {
        if (res.success) {
          $messages.css('color', 'green').html(res.data);
          $form[0].reset();
        } else {
          $messages.css('color', '#d91818').html(res.data);
        }
      },
      error: function() {
        $messages.css('color', '#d91818').html('An error occurred!');
      }
    });
  });
});
