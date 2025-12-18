<?php

namespace App\Routes;

use App\Core\RestApi;

/**
 * Router class
 * Xử lý routing cho API requests
 */
class Router
{
    private $routes = [];
    private $requestUri;
    private $requestMethod;

    public function __construct()
    {
        $this->requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        // Normalize URI: remove trailing slash (except root)
        if ($this->requestUri !== '/' && substr($this->requestUri, -1) === '/') {
            $this->requestUri = rtrim($this->requestUri, '/');
        }
        $this->requestMethod = $_SERVER['REQUEST_METHOD'];
    }

    public function get($path, $handler)
    {
        $this->routes[] = ['method' => 'GET', 'path' => $path, 'handler' => $handler];
    }

    public function post($path, $handler)
    {
        $this->routes[] = ['method' => 'POST', 'path' => $path, 'handler' => $handler];
    }

    public function put($path, $handler)
    {
        $this->routes[] = ['method' => 'PUT', 'path' => $path, 'handler' => $handler];
    }

    public function delete($path, $handler)
    {
        $this->routes[] = ['method' => 'DELETE', 'path' => $path, 'handler' => $handler];
    }

    public function dispatch()
    {
        foreach ($this->routes as $route) {
            if ($route['method'] === $this->requestMethod && $route['path'] === $this->requestUri) {
                $handler = $route['handler'];

                try {
                    if (is_array($handler)) {
                        // [Controller::class, '@method']
                        $className = $handler[0];
                        $methodName = str_replace('@', '', $handler[1]);
                        
                        // Kiểm tra class có tồn tại không
                        if (!class_exists($className)) {
                            throw new \Exception("Controller class not found: $className");
                        }
                        
                        $controller = new $className();
                        
                        // Kiểm tra method có tồn tại không
                        if (!method_exists($controller, $methodName)) {
                            throw new \Exception("Method not found: $className::$methodName");
                        }
                        
                        $controller->$methodName();
                        return;
                    } elseif (is_string($handler) && strpos($handler, '@') !== false) {
                        // 'Controller@method'
                        list($className, $methodName) = explode('@', $handler);
                        
                        // Kiểm tra class có tồn tại không
                        if (!class_exists($className)) {
                            throw new \Exception("Controller class not found: $className");
                        }
                        
                        $controller = new $className();
                        
                        // Kiểm tra method có tồn tại không
                        if (!method_exists($controller, $methodName)) {
                            throw new \Exception("Method not found: $className::$methodName");
                        }
                        
                        $controller->$methodName();
                        return;
                    } elseif (is_callable($handler)) {
                        // Closure
                        call_user_func($handler);
                        return;
                    }
                } catch (\Throwable $e) {
                    error_log('Route handler error: ' . $e->getMessage());
                    error_log('Stack trace: ' . $e->getTraceAsString());
                    error_log('File: ' . $e->getFile() . ':' . $e->getLine());
                    
                    // Clean output buffer
                    if (ob_get_level() > 0) {
                        ob_clean();
                    }
                    
                    RestApi::setHeaders();
                    RestApi::apiError('Đã xảy ra lỗi khi xử lý request', 500);
                    return;
                }
            }
        }

        // No route found - return 404
        RestApi::setHeaders();
        RestApi::apiError('Endpoint không tồn tại', 404);
    }
}

