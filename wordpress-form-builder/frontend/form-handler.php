
<?php
// Form submission handler

add_action('wp_ajax_afb_submit_form', 'afb_handle_form_submission');
add_action('wp_ajax_nopriv_afb_submit_form', 'afb_handle_form_submission');

function afb_handle_form_submission() {
    check_ajax_referer('afb_submit_form', 'afb_nonce');
    
    $form_id = intval($_POST['form_id']);
    $form_data = $_POST['form_data'];
    
    if (!$form_id || empty($form_data)) {
        wp_send_json_error('Invalid form data');
        return;
    }
    
    global $wpdb;
    
    // Get form details
    $form = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}afb_forms WHERE id = %d AND is_active = 1",
        $form_id
    ));
    
    if (!$form) {
        wp_send_json_error('Form not found or inactive');
        return;
    }
    
    // Get form fields for validation
    $fields = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}afb_form_fields WHERE form_id = %d AND enabled = 1",
        $form_id
    ));
    
    // Validate required fields
    $validation_errors = array();
    foreach ($fields as $field) {
        if ($field->required && (empty($form_data[$field->name]) || $form_data[$field->name] === '')) {
            $validation_errors[] = $field->label . ' is required';
        }
        
        // Email validation
        if ($field->field_type === 'email' && !empty($form_data[$field->name])) {
            if (!is_email($form_data[$field->name])) {
                $validation_errors[] = 'Please enter a valid email address for ' . $field->label;
            }
        }
    }
    
    if (!empty($validation_errors)) {
        wp_send_json_error(implode('<br>', $validation_errors));
        return;
    }
    
    // Sanitize form data
    $sanitized_data = array();
    foreach ($form_data as $key => $value) {
        if (is_array($value)) {
            $sanitized_data[$key] = array_map('sanitize_text_field', $value);
        } else {
            $sanitized_data[$key] = sanitize_text_field($value);
        }
    }
    
    // Save submission to database
    $result = $wpdb->insert(
        $wpdb->prefix . 'afb_form_submissions',
        array(
            'form_id' => $form_id,
            'data' => json_encode($sanitized_data),
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'],
            'submitted_at' => current_time('mysql')
        )
    );
    
    if (!$result) {
        wp_send_json_error('Failed to save submission');
        return;
    }
    
    // Send notification email
    afb_send_notification_email($form, $sanitized_data);
    
    wp_send_json_success('Form submitted successfully!');
}

function afb_send_notification_email($form, $form_data) {
    $to = $form->notification_email;
    $subject = 'New Form Submission: ' . $form->title;
    
    $message = "You have received a new form submission.\n\n";
    $message .= "Form: " . $form->title . "\n";
    $message .= "Submitted: " . current_time('mysql') . "\n\n";
    $message .= "Submission Details:\n";
    $message .= str_repeat('-', 30) . "\n";
    
    foreach ($form_data as $key => $value) {
        $label = ucwords(str_replace('_', ' ', $key));
        if (is_array($value)) {
            $message .= $label . ": " . implode(', ', $value) . "\n";
        } else {
            $message .= $label . ": " . $value . "\n";
        }
    }
    
    $headers = array('Content-Type: text/plain; charset=UTF-8');
    
    wp_mail($to, $subject, $message, $headers);
}

