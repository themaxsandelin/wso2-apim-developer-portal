/*
Handles authentication of the user.
*/

(function() {
  'use strict';

  angular
    .module('vtPortal')
    .factory('AuthenticationService', AuthenticationService);

  AuthenticationService.$inject = ['$http', '$location', 'UserService', '$httpParamSerializer'];

  function AuthenticationService($http, $location, UserService, $httpParamSerializer) {
    var service = {};
    var apiClient = new API.Client.DefaultApi($http, null, $httpParamSerializer);

    service.Login = Login;
    service.Logout = Logout;
    service.Create = Create;

    return service;

    function Login(username, password, callback, refreshToken) {

      var action = 'login';

      if (refreshToken !== null) {
        action = 'refreshToken';
      }

      var response;

      apiClient.securityPost(action, refreshToken, {
          userName: username,
          credential: password
        })
        .then(function(authenticatedUserObject) {
          if (authenticatedUserObject.status === 200 || authenticatedUserObject.status === 201) {
            response = {
              success: true,
              user: authenticatedUserObject.data
            };

            apiClient.usersUserIdGet(authenticatedUserObject.data.userId)
            .then(function(userAccountObject) {
              if(userAccountObject.status === 200) {
                response.user.claims = userAccountObject.data.claims;
                UserService.SetUser(response.user);
              }

            });

          } else {
            response = {
              success: false,
              message: authenticatedUserObject.data.message
            };
          }
          callback(response);
        });

    }

    function Create(username, password, email, callback) {

      var response;
      apiClient.usersPost({
          userName: username,
          credential: password,
          claims: [{
            claimURI: "http://wso2.org/claims/emailaddress",
            value: email
          },
          {
            claimURI: "http://wso2.org/claims/givenname",
            value: firstname
          },
          {
            claimURI: "http://wso2.org/claims/lastname",
            value: lastname
          }]
        })
        .then(function(userAccountObject) {
          if (userAccountObject.status === 201) {
            response = {
              success: true,
              user: userAccountObject.data
            };

          } else {
            response = {
              success: false,
              message: userAccountObject.data.message
            };
          }
          callback(response);
        });

    }

    function Logout(callback) {

      var response;
      apiClient.securityPost('logout', null, null)
        .then(function(apiResponse) {
          if (apiResponse.status === 204 || apiResponse.status === 200) {
            response = {
              success: true
            };
            UserService.ClearUser();
          } else {
            response = {
              success: false,
              message: apiResponse.data.message
            };
          }

          $location.path('/');

          if (callback != null) { // jshint ignore:line
            callback(response);
          }
        });

    }

  }

})();
