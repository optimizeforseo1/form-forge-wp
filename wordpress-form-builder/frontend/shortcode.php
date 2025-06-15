
<?php
// Shortcode functionality

add_shortcode('form_builder', 'afb_form_shortcode');

function afb_form_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => 0,
    ), $atts);
    
    $form_id = intval($atts['id']);
    
    if (!$form_id) {
        return '<p>Please specify a form ID: [form_builder id="1"]</p>';
    }
    
    global $wpdb;
    
    // Get form data
    $form = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}afb_forms WHERE id = %d AND is_active = 1",
        $form_id
    ));
    
    if (!$form) {
        return '<p>Form not found or inactive.</p>';
    }
    
    // Get form fields
    $fields = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}afb_form_fields WHERE form_id = %d AND enabled = 1 ORDER BY sort_order",
        $form_id
    ));
    
    if (empty($fields)) {
        return '<p>No fields configured for this form.</p>';
    }
    
    ob_start();
    ?>
    
    <div class="afb-form-container">
        <div class="afb-form-wrapper">
            <h3 class="afb-form-title"><?php echo esc_html($form->title); ?></h3>
            
            <?php if ($form->description): ?>
                <p class="afb-form-description"><?php echo esc_html($form->description); ?></p>
            <?php endif; ?>
            
            <form class="afb-form" data-form-id="<?php echo esc_attr($form->id); ?>">
                <?php wp_nonce_field('afb_submit_form', 'afb_nonce'); ?>
                
                <div class="afb-form-messages"></div>
                
                <?php foreach ($fields as $field): ?>
                    <div class="afb-field-group">
                        <label for="<?php echo esc_attr($field->name); ?>" class="afb-field-label">
                            <?php echo esc_html($field->label); ?>
                            <?php if ($field->required): ?>
                                <span class="afb-required">*</span>
                            <?php endif; ?>
                        </label>
                        
                        <?php
                        switch ($field->field_type) {
                            case 'text':
                            case 'email':
                            case 'phone':
                                $input_type = $field->field_type === 'email' ? 'email' : ($field->field_type === 'phone' ? 'tel' : 'text');
                                ?>
                                <input 
                                    type="<?php echo esc_attr($input_type); ?>"
                                    id="<?php echo esc_attr($field->name); ?>"
                                    name="<?php echo esc_attr($field->name); ?>"
                                    placeholder="<?php echo esc_attr($field->placeholder); ?>"
                                    class="afb-field-input"
                                    <?php echo $field->required ? 'required' : ''; ?>
                                />
                                <?php
                                break;
                                
                            case 'textarea':
                                ?>
                                <textarea 
                                    id="<?php echo esc_attr($field->name); ?>"
                                    name="<?php echo esc_attr($field->name); ?>"
                                    placeholder="<?php echo esc_attr($field->placeholder); ?>"
                                    class="afb-field-textarea"
                                    rows="4"
                                    <?php echo $field->required ? 'required' : ''; ?>
                                ></textarea>
                                <?php
                                break;
                                
                            case 'dropdown':
                                $options = json_decode($field->options, true);
                                ?>
                                <select 
                                    id="<?php echo esc_attr($field->name); ?>"
                                    name="<?php echo esc_attr($field->name); ?>"
                                    class="afb-field-select"
                                    <?php echo $field->required ? 'required' : ''; ?>
                                >
                                    <option value=""><?php echo esc_html($field->placeholder ?: 'Select an option'); ?></option>
                                    <?php if ($options): ?>
                                        <?php foreach ($options as $option): ?>
                                            <option value="<?php echo esc_attr($option); ?>"><?php echo esc_html($option); ?></option>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </select>
                                <?php
                                break;
                                
                            case 'radio':
                                $options = json_decode($field->options, true);
                                if ($options):
                                ?>
                                    <div class="afb-radio-group">
                                        <?php foreach ($options as $index => $option): ?>
                                            <label class="afb-radio-label">
                                                <input 
                                                    type="radio"
                                                    name="<?php echo esc_attr($field->name); ?>"
                                                    value="<?php echo esc_attr($option); ?>"
                                                    <?php echo $field->required && $index === 0 ? 'required' : ''; ?>
                                                />
                                                <span><?php echo esc_html($option); ?></span>
                                            </label>
                                        <?php endforeach; ?>
                                    </div>
                                <?php
                                endif;
                                break;
                                
                            case 'checkbox':
                                ?>
                                <label class="afb-checkbox-label">
                                    <input 
                                        type="checkbox"
                                        id="<?php echo esc_attr($field->name); ?>"
                                        name="<?php echo esc_attr($field->name); ?>"
                                        value="1"
                                        <?php echo $field->required ? 'required' : ''; ?>
                                    />
                                    <span><?php echo esc_html($field->placeholder ?: $field->label); ?></span>
                                </label>
                                <?php
                                break;
                        }
                        ?>
                    </div>
                <?php endforeach; ?>
                
                <?php if ($form->recaptcha_enabled): ?>
                    <div class="afb-recaptcha-info">
                        <p><small>This form is protected by reCAPTCHA.</small></p>
                    </div>
                <?php endif; ?>
                
                <div class="afb-form-submit">
                    <button type="submit" class="afb-submit-btn">Submit Form</button>
                </div>
            </form>
        </div>
    </div>
    
    <?php
    return ob_get_clean();
}
