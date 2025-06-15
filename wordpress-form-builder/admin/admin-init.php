<?php
// This file contains AJAX handlers for the admin area.
// Menu registration and page callbacks are handled in the main plugin file.

// AJAX handlers for admin
add_action('wp_ajax_afb_save_form', 'afb_save_form');
add_action('wp_ajax_afb_delete_form', 'afb_delete_form');
add_action('wp_ajax_afb_toggle_form', 'afb_toggle_form');

function afb_save_form() {
    check_ajax_referer('afb_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    $form_data = json_decode(stripslashes($_POST['form_data']), true);
    $fields_data = json_decode(stripslashes($_POST['fields_data']), true);
    
    // Validation: Form name is required
    if (empty($form_data['name'])) {
        wp_send_json_error('Form name is required');
        return;
    }
    
    // Validation: At least one field is required
    if (empty($fields_data)) {
        wp_send_json_error('At least one field is required');
        return;
    }
    
    global $wpdb;
    
    $forms_table = $wpdb->prefix . 'afb_forms';
    $fields_table = $wpdb->prefix . 'afb_form_fields';
    
    // Start transaction
    $wpdb->query('START TRANSACTION');
    
    try {
        if (isset($_POST['form_id']) && !empty($_POST['form_id'])) {
            // Update existing form
            $form_id = intval($_POST['form_id']);
            
            $wpdb->update(
                $forms_table,
                array(
                    'name' => sanitize_text_field($form_data['name']),
                    'title' => sanitize_text_field($form_data['title']),
                    'description' => sanitize_textarea_field($form_data['description']),
                    'notification_email' => sanitize_email($form_data['notification_email']),
                    'recaptcha_enabled' => intval($form_data['recaptcha_enabled']),
                    'is_active' => intval($form_data['is_active']),
                    'updated_at' => current_time('mysql')
                ),
                array('id' => $form_id)
            );
            
            // Delete existing fields
            $wpdb->delete($fields_table, array('form_id' => $form_id));
            
        } else {
            // Create new form
            $wpdb->insert(
                $forms_table,
                array(
                    'name' => sanitize_text_field($form_data['name']),
                    'title' => sanitize_text_field($form_data['title']),
                    'description' => sanitize_textarea_field($form_data['description']),
                    'notification_email' => sanitize_email($form_data['notification_email']),
                    'recaptcha_enabled' => intval($form_data['recaptcha_enabled']),
                    'is_active' => intval($form_data['is_active'])
                )
            );
            
            $form_id = $wpdb->insert_id;
        }
        
        // Insert fields
        foreach ($fields_data as $index => $field) {
            $wpdb->insert(
                $fields_table,
                array(
                    'form_id' => $form_id,
                    'field_type' => sanitize_text_field($field['field_type']),
                    'label' => sanitize_text_field($field['label']),
                    'name' => sanitize_text_field($field['name']),
                    'placeholder' => sanitize_text_field($field['placeholder']),
                    'required' => intval($field['required']),
                    'enabled' => intval($field['enabled']),
                    'options' => isset($field['options']) ? json_encode($field['options']) : null,
                    'sort_order' => $index
                )
            );
        }
        
        $wpdb->query('COMMIT');
        wp_send_json_success(array('form_id' => $form_id));
        
    } catch (Exception $e) {
        $wpdb->query('ROLLBACK');
        wp_send_json_error('Failed to save form');
    }
}

function afb_delete_form() {
    check_ajax_referer('afb_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    global $wpdb;
    $form_id = intval($_POST['form_id']);
    
    $result = $wpdb->delete($wpdb->prefix . 'afb_forms', array('id' => $form_id));
    
    if ($result) {
        wp_send_json_success();
    } else {
        wp_send_json_error();
    }
}

function afb_toggle_form() {
    check_ajax_referer('afb_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    global $wpdb;
    $form_id = intval($_POST['form_id']);
    $is_active = intval($_POST['is_active']);
    
    $result = $wpdb->update(
        $wpdb->prefix . 'afb_forms',
        array('is_active' => $is_active),
        array('id' => $form_id)
    );
    
    if ($result !== false) {
        wp_send_json_success();
    } else {
        wp_send_json_error();
    }
}
