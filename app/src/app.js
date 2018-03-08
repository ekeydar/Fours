import angular from 'angular';
import 'angular-route';
import 'ng-file-upload';
import startPageTemplate from './pages/start/page.html';

import StartController from './pages/start/ctrl.js';

let app = angular.module('fours',['ngRoute','ngFileUpload']);

app.config($routeProvider => {
    'ngInject';
    $routeProvider
        .when('/start', {
            controller: 'StartController',
            controllerAs: 'main',
            template: startPageTemplate,
            resolve: {},
        })
        .otherwise({
            redirectTo: '/start'
        })
});

app.config($locationProvider => {
    $locationProvider.html5Mode(true);
})



app.controller('StartController', StartController);



