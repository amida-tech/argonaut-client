'use strict';

angular.module('angularPassportApp')
.directive('bootstrapSwitch', [
    function() {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, element, attrs, ngModel) {
                element.bootstrapSwitch();

                element.on('switchChange.bootstrapSwitch', function(event, state) {
                    if (ngModel) {
                        scope.$apply(function() {
                            ngModel.$setViewValue(state);
                        });
                    }
                });

                scope.$watch(attrs.ngModel, function(newValue, oldValue) {
                    if (newValue) {
                        element.bootstrapSwitch('state', true, true);
                        if (newValue !== oldValue) {
                            scope.switchOn(scope.client);
                        }
                    } else {
                        element.bootstrapSwitch('state', false, true);
                        if (newValue !== oldValue) {
                            scope.switchOff();
                        }
                    }
                });
            }
        };
    }
]);