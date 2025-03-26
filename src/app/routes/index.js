const express = require('express');
const router = express.Router();
const userRoutes = require('../modules/user/user.routes');
const courseRoutes = require('../modules/course/course.routes');
const quizRoutes = require('../modules/quiz/quiz.routes');
const enrollmentRoutes = require('../modules/enrollment/enrollment.routes');
const courseGroupRoutes = require('../modules/courseGroup/courseGroup.routes');
const courseSubGroupRoutes = require('../modules/courseSubGroup/courseSubGroup.routes');
const courseSubSubGroupRoutes = require('../modules/courseSubSubGroup/courseSubSubGroup.routes');
const subscriptionRoutes = require('../modules/subscription/subscription.routes');

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
    },
    {
        path: '/course-groups',
        route: courseGroupRoutes
    },
    {
        path: '/course-sub-groups',
        route: courseSubGroupRoutes
    },
    {
        path: '/course-sub-sub-groups',
        route: courseSubSubGroupRoutes
    },
    {
        path: '/subscriptions',
        route: subscriptionRoutes
    }
];

modulesRoutes.forEach(route => {
    router.use(route.path, route.route);
});

module.exports = router;
