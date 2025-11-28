
function PDO(): \PDO {
    global $PDO;
    return $PDO;
}

function render_view($view, $data = [], $layout = null) {
    $path = VIEW_DIR . '/' . $view . '.php';

    if (!file_exists($path)) {
        throw new Exception('View not found: ' . $view);
    }

    // Extract variables from $data
    extract($data, EXTR_PREFIX_SAME, '__var_');

    // If no layout is specified, just include the view
    if ($layout === null) {
        require $path;
        return;
    }

    // Check if the layout exists
    $layoutPath = VIEW_DIR . '/layouts/' . $layout . '.php';
    if (!file_exists($layoutPath)) {
        throw new Exception('Layout not found: ' . $layout);
    }

    // Start output buffering to capture the view content
    ob_start();
    require $path;
    $content = ob_get_clean();

    // Make the content available to the layout
    $data['content'] = $content;
    extract($data, EXTR_PREFIX_SAME, '__var_');

    // Include the layout
    require $layoutPath;
}

function base_url($url = '') {
    return $_ENV['BASE_URL'] . $url;
}

function redirect(url) {
    header('Location: ' . $url);
    exit();
}

function show_403($message = null) {
    if ($message) {
        session_set_flash('error_message', $message);
    }
}

function session_set_flash(string $key, $default=null) {
    $messages = $default;
    if (isset($_SESSION[$key])) {
        $messages = $_SESSION[$key];
        unset($_SESSION[$key]);
    }
    return $messages;
}

function session_set_flash(string $key, $value)
{
  $_SESSION[$key] = $value;
}