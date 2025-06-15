
<?php
global $wpdb;
$form = ['name'=>'','title'=>'','description'=>''];
$editing = false;
$form_id = isset($_GET['edit']) ? intval($_GET['edit']) : 0;

if ($form_id) {
    $editing = true;
    $form_row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}afb_forms WHERE id = %d", $form_id));
    if ($form_row) {
        $form['name'] = $form_row->name;
        $form['title'] = $form_row->title;
        $form['description'] = $form_row->description;
    }
}

$notice = '';
if (!empty($_POST['afb-form-name'])) {
    $name = sanitize_text_field($_POST['afb-form-name']);
    $title = sanitize_text_field($_POST['afb-form-title']);
    $description = sanitize_text_field($_POST['afb-form-description']);

    if ($editing) {
        $wpdb->update(
            $wpdb->prefix . 'afb_forms',
            ['name' => $name, 'title' => $title, 'description' => $description],
            ['id' => $form_id]
        );
        $notice = 'Form updated successfully!';
    } else {
        $wpdb->insert(
            $wpdb->prefix . 'afb_forms',
            ['name' => $name, 'title' => $title, 'description' => $description]
        );
        $notice = 'Form created successfully!';
        $form_id = $wpdb->insert_id;
        $editing = true;
    }
    // Redirect to list
    echo "<script>window.location='admin.php?page=form-builder';</script>";
    exit;
}
?>
<h2><?php echo $editing ? 'Edit Form' : 'Add New Form'; ?></h2>
<?php if ($notice): ?>
    <div class="notice notice-success"><p><?php echo esc_html($notice); ?></p></div>
<?php endif; ?>
<form method="post" action="">
    <table class="form-table">
        <tr>
            <th><label for="afb-form-name">Name</label></th>
            <td><input name="afb-form-name" id="afb-form-name" type="text" class="regular-text" required value="<?php echo esc_attr($form['name']); ?>" /></td>
        </tr>
        <tr>
            <th><label for="afb-form-title">Title</label></th>
            <td><input name="afb-form-title" id="afb-form-title" type="text" class="regular-text" value="<?php echo esc_attr($form['title']); ?>" /></td>
        </tr>
        <tr>
            <th><label for="afb-form-description">Description</label></th>
            <td><textarea name="afb-form-description" id="afb-form-description" class="large-text" rows="3"><?php echo esc_textarea($form['description']); ?></textarea></td>
        </tr>
    </table>
    <p>
        <a href="admin.php?page=form-builder" class="button button-secondary">Back to list</a>
        <button type="submit" class="button button-primary"><?php echo $editing ? 'Update Form' : 'Create Form'; ?></button>
    </p>
</form>
