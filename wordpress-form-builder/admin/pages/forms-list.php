
<?php
global $wpdb;
$forms_table = $wpdb->prefix . 'afb_forms';
$forms = $wpdb->get_results("SELECT * FROM $forms_table ORDER BY created_at DESC");
?>

<h2>All Forms</h2>
<table class="widefat fixed striped">
    <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created At</th>
        </tr>
    </thead>
    <tbody>
    <?php if (!empty($forms)): ?>
        <?php foreach ($forms as $form): ?>
        <tr>
            <td><?php echo esc_html($form->id); ?></td>
            <td><?php echo esc_html($form->name); ?></td>
            <td><?php echo esc_html($form->title); ?></td>
            <td><?php echo $form->is_active ? '<span style="color:green">Active</span>' : '<span style="color:red">Inactive</span>'; ?></td>
            <td><?php echo esc_html($form->created_at); ?></td>
        </tr>
        <?php endforeach; ?>
    <?php else: ?>
        <tr><td colspan="5" style="text-align:center;">No forms found. <a href="admin.php?page=form-builder-new">Add a new form</a></td></tr>
    <?php endif; ?>
    </tbody>
</table>
