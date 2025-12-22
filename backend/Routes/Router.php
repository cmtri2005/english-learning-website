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
            $params = $this->matchRoute($route['path'], $this->requestUri);
            
            if ($route['method'] === $this->requestMethod && $params !== false) {
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
                        
                        // Gọi method với params nếu có
                        if (!empty($params)) {
                            call_user_func_array([$controller, $methodName], array_values($params));
                        } else {
                            $controller->$methodName();
                        }
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
                        
                        if (!empty($params)) {
                            call_user_func_array([$controller, $methodName], array_values($params));
                        } else {
                            $controller->$methodName();
                        }
                        return;
                    } elseif (is_callable($handler)) {
                        // Closure
                        if (!empty($params)) {
                            call_user_func_array($handler, array_values($params));
                        } else {
                            call_user_func($handler);
                        }
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

    /**
     * Match route pattern with URI and extract params
     * @return array|false - Returns params array if match, false if no match
     */
    private function matchRoute($pattern, $uri)
    {
        // Exact match
        if ($pattern === $uri) {
            return [];
        }

        // Convert :param patterns to regex
        $patternParts = explode('/', trim($pattern, '/'));
        $uriParts = explode('/', trim($uri, '/'));

        if (count($patternParts) !== count($uriParts)) {
            return false;
        }

        $params = [];
        for ($i = 0; $i < count($patternParts); $i++) {
            if (strpos($patternParts[$i], ':') === 0) {
                // This is a parameter
                $paramName = substr($patternParts[$i], 1);
                $params[$paramName] = $uriParts[$i];
            } elseif ($patternParts[$i] !== $uriParts[$i]) {
                return false;
            }
        }

        return $params;
    }
}

