
<?php
global $wpdb;
$submissions_table = $wpdb->prefix . 'afb_form_submissions';
$forms_table = $wpdb->prefix . 'afb_forms';

$submissions = $wpdb->get_results("
    SELECT s.*, f.name as form_name 
    FROM $submissions_table s 
    LEFT JOIN $forms_table f ON s.form_id = f.id 
    ORDER BY s.submitted_at DESC 
    LIMIT 50
");
?>
<h2>Form Submissions</h2>
<table class="widefat fixed striped">
    <thead>
        <tr>
            <th>ID</th>
            <th>Form</th>
            <th>Submitted At</th>
            <th>IP Address</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
    <?php if (!empty($submissions)): ?>
        <?php foreach ($submissions as $sub): ?>
        <tr>
            <td><?php echo esc_html($sub->id); ?></td>
            <td><?php echo esc_html($sub->form_name ?: 'N/A'); ?></td>
            <td><?php echo esc_html($sub->submitted_at); ?></td>
            <td><?php echo esc_html($sub->ip_address); ?></td>
            <td><a href="#" onclick="alert('Submission data:\n<?php echo esc_js($sub->data); ?>')">View</a></td>
        </tr>
        <?php endforeach; ?>
    <?php else: ?>
        <tr><td colspan="5" style="text-align:center;">No submissions found.</td></tr>
    <?php endif; ?>
    </tbody>
</table>
