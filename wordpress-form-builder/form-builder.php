
<?php
/**
 * Plugin Name: Advanced Form Builder
 * Description: A powerful form builder with admin notifications and shortcode support
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct access
if (!defined('ABSPATH')) exit;

// Define plugin constants
define('AFB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('AFB_PLUGIN_PATH', plugin_dir_path(__FILE__));

register_activation_hook(__FILE__, 'afb_create_tables');

function afb_create_tables() {
    global $wpdb;

    $charset_collate = $wpdb->get_charset_collate();

    $forms_table = $wpdb->prefix . 'afb_forms';
    $forms_sql = "CREATE TABLE $forms_table (
        id int(11) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        description text,
        notification_email varchar(255) DEFAULT '',
        recaptcha_enabled tinyint(1) DEFAULT 0,
        is_active tinyint(1) DEFAULT 1,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";

    $fields_table = $wpdb->prefix . 'afb_form_fields';
    $fields_sql = "CREATE TABLE $fields_table (
        id int(11) NOT NULL AUTO_INCREMENT,
        form_id int(11) NOT NULL,
        field_type varchar(50) NOT NULL,
        label varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        placeholder varchar(255),
        required tinyint(1) DEFAULT 0,
        enabled tinyint(1) DEFAULT 1,
        options text,
        sort_order int(11) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (form_id) REFERENCES $forms_table(id) ON DELETE CASCADE
    ) $charset_collate;";

    $submissions_table = $wpdb->prefix . 'afb_form_submissions';
    $submissions_sql = "CREATE TABLE $submissions_table (
        id int(11) NOT NULL AUTO_INCREMENT,
        form_id int(11) NOT NULL,
        data longtext NOT NULL,
        ip_address varchar(45),
        user_agent text,
        submitted_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (form_id) REFERENCES $forms_table(id) ON DELETE CASCADE
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($forms_sql);
    dbDelta($fields_sql);
    dbDelta($submissions_sql);
}

// Add admin menus (backend)
add_action('admin_menu', 'afb_register_admin_menus');
function afb_register_admin_menus() {
    add_menu_page(
        'Form Builder',
        'Form Builder',
        'manage_options',
        'form-builder',
        'afb_forms_list_page',
        'dashicons-feedback'
    );
    add_submenu_page(
        'form-builder',
        'All Forms',
        'All Forms',
        'manage_options',
        'form-builder',
        'afb_forms_list_page'
    );
    add_submenu_page(
        'form-builder',
        'Add New Form',
        'Add New',
        'manage_options',
        'form-builder-new',
        'afb_form_builder_page'
    );
    add_submenu_page(
        'form-builder',
        'Form Submissions',
        'Submissions',
        'manage_options',
        'form-builder-submissions',
        'afb_submissions_page'
    );
}

// Page display callbacks (route to separate files)
function afb_forms_list_page() {
    require_once AFB_PLUGIN_PATH . 'admin/pages/forms-list.php';
}
function afb_form_builder_page() {
    require_once AFB_PLUGIN_PATH . 'admin/pages/form-builder.php';
}
function afb_submissions_page() {
    require_once AFB_PLUGIN_PATH . 'admin/pages/submissions.php';
}

if (is_admin()) {
    require_once AFB_PLUGIN_PATH . 'admin/admin-init.php';
}
require_once AFB_PLUGIN_PATH . 'frontend/shortcode.php';
require_once AFB_PLUGIN_PATH . 'frontend/form-handler.php';

add_action('wp_enqueue_scripts', 'afb_enqueue_frontend_scripts');
add_action('admin_enqueue_scripts', 'afb_enqueue_admin_scripts');

function afb_enqueue_frontend_scripts() {
    wp_enqueue_script('afb-frontend', AFB_PLUGIN_URL . 'assets/frontend.js', ['jquery'], '1.0.0', true);
    wp_enqueue_style('afb-frontend', AFB_PLUGIN_URL . 'assets/frontend.css', [], '1.0.0');
    wp_localize_script('afb-frontend', 'afb_ajax', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('afb_nonce')
    ]);
}
function afb_enqueue_admin_scripts($hook) {
    if (strpos($hook, 'form-builder') === false) return;
    wp_enqueue_script('afb-admin', AFB_PLUGIN_URL . 'assets/admin.js', ['jquery', 'jquery-ui-sortable'], '1.0.0', true);
    wp_enqueue_style('afb-admin', AFB_PLUGIN_URL . 'assets/admin.css', [], '1.0.0');
}
