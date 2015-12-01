/*global defaultBaseUrl*/
(function() {
  'use strict';

  angular
    .module('vtPortal')
    .controller('SubscriptionsCtrl', SubscriptionsCtrl)
    .constant('defaultBaseUrl', defaultBaseUrl);

  SubscriptionsCtrl.$inject = ['$scope', '$http', 'APIService', 'AlertService'];

  function SubscriptionsCtrl($scope, $http, APIService, AlertService) {
    var vm = this;

    vm.addSubscription = addSubscription;
    vm.removeSubscription = removeSubscription;
    vm.resetAddSubscriptionForm = resetAddSubscriptionForm;

    (function init() {
      vm.defaultBaseUrl = defaultBaseUrl;

      vm.form = {};
      vm.form.subscription = {};

      APIService.call('subscriptionsGet', [])
        .then(subscriptionsGetResponse);

      APIService.call('applicationsGet', [100, 0, null, 'application/json'])
        .then(applicationsGetResponse);

      APIService.call('apisGet', [100, 0, null, 'application/json'])
        .then(aPIsGetResponse);
    })();

    function subscriptionsGetResponse(response) {
      if (response.status === 200) {
        vm.subscriptions = response.data.list;
      } else {
        AlertService.error('Problem att hämta listan över prenumerationer');
      }
    }

    function applicationsGetResponse(response) {
      if (response.status === 200) {
        vm.applications = response.data.list;
      } else {
        AlertService.error('Problem att hämta listan över applikationer');
      }
    }

    function aPIsGetResponse(response) {
      if (response.status === 200) {
        // Only possible to create a subscription towards a published api
        vm.apis = response.data.list.filter(function(el) {
          return el.status.toUpperCase() === 'PUBLISHED';
        });

      } else {
        AlertService.error('Problem att hämta listan över APIer');
      }
    }

    function addSubscription() {
      vm.dataLoadingAddSubscription = true;

      var apiDef = vm.form.subscription.add.api.split('/');

      APIService.call('subscriptionsPost', [{
          application: {
            id: vm.form.subscription.add.application
          },
          api: {
            name: apiDef[0],
            version: apiDef[1],
            provider: apiDef[2]
          }
        }, 'application/json'])
        .then(subscriptionsPostResponse)
        .catch(function(response) {
          AlertService.error('Problem att skapa ny prenumeration');
        });

      function subscriptionsPostResponse(response) {
        if (response.status === 201) {
          vm.subscriptions.push(response.data);

          AlertService.success('Prenumerationen skapad!');

          resetAddSubscriptionForm();

        } else {
          AlertService.error('Problem att skapa ny prenumeration');
        }
        vm.dataLoadingAddSubscription = false;
      }
    }

    function removeSubscription(subscriptionId) {

      var i = 0;
      for (i; i < vm.subscriptions.length; i++) {
        if (vm.subscriptions[i].id === subscriptionId) {
          if (confirm('Är du säker på att du vill ta bort prenumerationen mellan applikation ' +
              vm.subscriptions[i].application.name + ' och API ' + vm.subscriptions[i].api.name + ' ' + vm.subscriptions[i].api.version) === true) {
            APIService.call('subscriptionsSubscriptionIdDelete', [vm.subscriptions[i].id])
              .then(subscriptionsSubscriptionIdDeleteResponse);
            break;
          }
        }
      }

      function subscriptionsSubscriptionIdDeleteResponse(response) {
        if (response.status === 200) {

          AlertService.success('Prenumerationen mellan applikation ' +
            vm.subscriptions[i].application.name + ' och API ' + vm.subscriptions[i].api.name + ' ' + vm.subscriptions[i].api.version + ' borttagen!');

          vm.subscriptions.splice(i, 1);

        } else {
          AlertService.error('Problem att ta bort prenumerationen');
        }
      }

    }

    function resetAddSubscriptionForm() {
      vm.form.subscription.add.api = null;
      vm.form.subscription.add.application = null;

      $scope.addSubscriptionForm.$setPristine();
    }

  }

})();
