App = {
  web3Provider: null,
  contracts: {},
  emptyAddress: "0x0000000000000000000000000000000000000000",
  metamaskAccountID: "0x0000000000000000000000000000000000000000",
  airlineRegistrationAddress: "0x0000000000000000000000000000000000000000",
  currentFlights: [],

  init: async function () {
      App.readForm();
      /// Setup access to blockchain
      return await App.initWeb3();
  },

  readForm: function () {
      App.airlineRegistrationAddress = $("#airlineRegistrationAddress").val();
      App.purchaseInsuranceFlight = $("#purchaseInsuranceFlight option:selected").val();

      // console log all values
      console.log(
          App.airlineRegistrationAddress,
          App.purchaseInsuranceFlight
      );
  },

  initWeb3: async function () {
      /// Find or Inject Web3 Provider
      /// Modern dapp browsers...
      if (window.ethereum) {
          App.web3Provider = window.ethereum;
          try {
              // Request account access
              await window.ethereum.enable();
          } catch (error) {
              // User denied account access...
              console.error("User denied account access")
          }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
          App.web3Provider = window.web3.currentProvider;
      }
      // If no injected web3 instance is detected, fall back to Ganache
      else {
          App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      }

      App.getMetaskAccountID();

      return App.initAirlineApp();
  },

  getMetaskAccountID: function () {
      web3 = new Web3(App.web3Provider);

      // Retrieving accounts
      web3.eth.getAccounts(function(err, res) {
          if (err) {
              console.log('Error:',err);
              return;
          }
          console.log('getMetaskID:',res);
          App.metamaskAccountID = res[0];

      })
  },

  initAirlineApp: function () {
      /// Source the truffle compiled smart contracts
      var jsonAirlineApp='../../build/contracts/FlightSuretyApp.json';
      
      /// JSONfy the smart contracts
      $.getJSON(jsonAirlineApp, function(data) {
          console.log('data',data);
          var AirlineAppArtifact = data;
          App.contracts.AirlineApp = TruffleContract(AirlineAppArtifact);
          App.contracts.AirlineApp.setProvider(App.web3Provider);
          
          App.fetchCurrentFlights();
          App.fetchEvents();

      });

      return App.bindEvents();
  },

  bindEvents: function() {
      $(document).on('click', App.handleButtonClick);
  },
  populateFormFields: function(set, data) {
      if(set === 1) {
          $('#sku').val(data[0]);
          $('#ownerID').val(data[2]);
          $('#originFarmerID').val(data[3]);
          $('#originFarmName').val(data[4]);
          $('#originFarmInformation').val(data[5]);
          $('#originFarmLatitude').val(data[6]);
          $('#originFarmLongitude').val(data[7]);
      } else if(set === 2) {
          $('#sku').val(data[0]);
          $('#productNotes').val(data[3]);
          $('#productPrice').val(web3.fromWei(data[4], "ether"));
          $('#distributorID').val(data[6]);
          $('#retailerID').val(data[7]);
          $('#consumerID').val(data[8]);
      }
  },

  handleButtonClick: async function(event) {
      event.preventDefault();

      App.getMetaskAccountID();
      App.readForm();

      var processId = parseInt($(event.target).data('id'));
      console.log('processId',processId);

      switch(processId) {
          case 1:
              return await App.registerAirline(event);
              break;
          case 2:
              return await App.fundAirline(event);
              break;
          case 3:
              return await App.buyFlightInsurance(event);
              break;
          case 4:
              return await App.checkFlightStatus(event);
              break;
          case 5:
              return await App.requestWithdraw(event);
              break;
          case 6:
              return await App.setOperationalStatus(event);
              break;
          case 7:
              return await App.authorizeCaller(event);
              break;
          }
  },

  

  // GET EVENTS AND INITIATE AT END

  fetchEvents: function () {
      if (typeof App.contracts.AirlineApp.currentProvider.sendAsync !== "function") {
          App.contracts.AirlineApp.currentProvider.sendAsync = function () {
              return App.contracts.AirlineApp.currentProvider.send.apply(
              App.contracts.AirlineApp.currentProvider,
                  arguments
            );
          };
      }

      App.contracts.AirlineApp.deployed().then(function(instance) {
      var events = instance.allEvents(function(err, log){
        if (!err)
          $("#flightsurety-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
      });
      }).catch(function(err) {
        console.log(err.message);
      });
      
  }
};

$(function () {
  $(window).load(function () {
      App.init();
  });
});