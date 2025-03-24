const express = require('express');
const router = express.Router();
const userRoutes = require('../modules/user/user.routes');
const courseRoutes = require('../modules/course/course.routes');
const quizRoutes = require('../modules/quiz/quiz.routes');
const enrollmentRoutes = require('../modules/enrollment/enrollment.routes');

const modulesRoutes = [
    {
        path: '/users',
        route: userRoutes
    },
    {
        path: '/courses',
        route: courseRoutes
    },
    {
        path: '/quizzes',
        route: quizRoutes
    },
    {
        path: '/enrollments',
        route: enrollmentRoutes
    }
];

modulesRoutes.forEach(route => {
    router.use(route.path, route.route);
});

module.exports = router;
