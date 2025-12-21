<?php

use App\Controllers\AdminExamController;

// Admin Exam Routes
// Assuming some auth middleware check is done before dispatching or inside controller

$router->post('/api/admin/exams/import', [AdminExamController::class, '@import']);
