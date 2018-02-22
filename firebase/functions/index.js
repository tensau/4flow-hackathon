'use strict';

// Ergänzung zur Einbindung von firebae
const firebaseAdmin = require('firebase-admin');
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.applicationDefault()
});
var db = firebaseAdmin.firestore();
// Ende Ergänzung

const functions = require('firebase-functions'); // Cloud Functions for Firebase library
const DialogflowApp = require('actions-on-google').DialogflowApp; // Google Assistant helper library
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  if (request.body.message){
    //Die Nachricht kommt von Telegram, wir sagen dass wir tippen
    var http = require('request');
    var sendChatActionURL='https://api.telegram.org/bot518599700:AAGQknfPNOhHNQFNSWuNpFYKlZfS7kAGwO0/sendChatAction?chat_id='
    + request.body.message.chat.id
    + '&action=typing';
    console.log('Sending typing Action '+ sendChatActionURL);
    http.get(sendChatActionURL,
      function(error, response, body){
        if (!error) {
          console.log("typing action body body: " +  JSON.stringify(body));
        } else {
          console.log("bad response from typing action");
          console.log(error);
        }
    });

    return setTimeout(function(){
        processTelegramRequest (request, response)
      } ,200); //2 Sekunden Wartezeit bevor wir antworten

  } else if (request.body.result) {
    processV1Request(request, response);
  } else if (request.body.queryResult) {
    processV2Request(request, response);
  } else if (request.body.callback_query){
    processTelegramRequest (request, response);
  } else {
    console.log('Invalid Request');
    console.log(request);
    return response.status(400).end('Invalid Webhook Request (expecting v1 or v2 webhook request)');
  }
});

function processTelegramRequest (request, response) {
      var http = require('request');
      if (request.body.message && request.body.message.photo){
        console.log('Image reveived')

        let maxwidth = 0;
        for (var i=0; i<request.body.message.photo.length; i++) {
          if (request.body.message.photo[i].width && maxwidth < request.body.message.photo[i].width){
            maxwidth = request.body.message.photo[i].width;
          }
        }

        //Namen Nach Bildgröße
        if (maxwidth>=400){
          var userName = 'Erkan';
        } else if (maxwidth < 400 && maxwidth > 0) {
          var userName = 'Heike';
        } else {
          var userName = 'Mensch';
        }

        console.log('User is ' + userName);


        //Wir müssen den Body neu zusammen setzen
        var newBody = {
          "update_id": request.body.update_id,
          "message": {
            "message_id": request.body.message.message_id,
            "from": request.body.message.from,
            "chat": request.body.message.chat,
            "date": request.body.message.date,
            "text": "Ich bin " + userName
          }
        };

        console.log('Forwarding ' + JSON.stringify(newBody) );
        http.post({
          headers: {
                    // "scheme": "https",
                    // "host": "bots.api.ai",
                    // "path": "/telegram/6aa0ce12-38dd-4786-880f-ce8500a82c3f/webhook",
                    "user-agent": "Go-http-client/1.1",
                    "transfer-encoding": "chunked",
                    "content-type": "application/json",
                    "function-execution-id": "y8u2hr4zrqc9",
                    "x-appengine-api-ticket": "da0eacafdd25cb91",
                    "x-appengine-city": "?",
                    "x-appengine-citylatlong": "0.000000,0.000000",
                    "x-appengine-country": "GB",
                    "x-appengine-https": "on",
                    "x-appengine-region": "?",
                    "x-appengine-user-ip": "149.154.167.226",
                    "x-cloud-trace-context": "4fc6bb1a5e75384bdc2fd24b3191c8c1/558913387969322366;o=1",
                    "x-forwarded-for": "149.154.167.226",
                    "accept-encoding": "gzip"
                  },
          url:     'https://bots.api.ai/telegram/6aa0ce12-38dd-4786-880f-ce8500a82c3f/webhook',
          body:   newBody,
          json: true
        }, function(error, response, body){
          if (!error) {
            console.log("telegram body: " +  JSON.stringify(body));
          } else {
            console.log("bad response from dialogflow webhook");
            console.log(error);
          }
        });

        return response.status(200).end('file upload erfolgreich');
      } else if (request.body.callback_query || request.body.message.chat ){
        console.log('chat reveived')

        http.post({
          headers: {
                    // "scheme": "https",
                    // "host": "bots.api.ai",
                    // "path": "/telegram/6aa0ce12-38dd-4786-880f-ce8500a82c3f/webhook",
                    "user-agent": "Go-http-client/1.1",
                    "transfer-encoding": "chunked",
                    "content-type": "application/json",
                    "function-execution-id": "y8u2hr4zrqc9",
                    "x-appengine-api-ticket": "da0eacafdd25cb91",
                    "x-appengine-city": "?",
                    "x-appengine-citylatlong": "0.000000,0.000000",
                    "x-appengine-country": "GB",
                    "x-appengine-https": "on",
                    "x-appengine-region": "?",
                    "x-appengine-user-ip": "149.154.167.226",
                    "x-cloud-trace-context": "4fc6bb1a5e75384bdc2fd24b3191c8c1/558913387969322366;o=1",
                    "x-forwarded-for": "149.154.167.226",
                    "accept-encoding": "gzip"
                  },
          url:     'https://bots.api.ai/telegram/6aa0ce12-38dd-4786-880f-ce8500a82c3f/webhook',
          body:    request.body,
          json: true
        }, function(error, response, body){
          if (!error) {
            console.log("telegram body: " + body);
          } else {
            console.log("bad response from dialogflow webhook");
            console.log(error);
          }
        });

        return response.status(200).end('chat received erfolgreich');
      }
}

/*
* Function to handle v1 webhook requests from Dialogflow
*/
function processV1Request (request, response) {
  let action = request.body.result.action; // https://dialogflow.com/docs/actions-and-parameters
  let parameters = request.body.result.parameters; // https://dialogflow.com/docs/actions-and-parameters
  let inputContexts = request.body.result.contexts; // https://dialogflow.com/docs/contexts
  let requestSource = (request.body.originalRequest) ? request.body.originalRequest.source : undefined;
  const googleAssistantRequest = 'google'; // Constant to identify Google Assistant requests
  const app = new DialogflowApp({request: request, response: response});
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      } else {
        sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
      }
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        sendGoogleResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      } else {
        sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
      }
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      if (requestSource === googleAssistantRequest) {
        let responseToUser = {
          //googleRichResponse: googleRichResponse, // Optional, uncomment to enable
          //googleOutputContexts: ['weather', 2, { ['city']: 'rome' }], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendGoogleResponse(responseToUser);
      } else {
        let responseToUser = {
          //data: richResponsesV1, // Optional, uncomment to enable
          //outputContexts: [{'name': 'weather', 'lifespan': 2, 'parameters': {'city': 'Rome'}}], // Optional, uncomment to enable
          speech: 'This message is from Dialogflow\'s Cloud Functions for Firebase editor!', // spoken response
          text: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :-)' // displayed response
        };
        sendResponse(responseToUser);
      }
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
    // Function to send correctly formatted Google Assistant responses to Dialogflow which are then sent to the user
  function sendGoogleResponse (responseToUser) {
    if (typeof responseToUser === 'string') {
      app.ask(responseToUser); // Google Assistant response
    } else {
      // If speech or displayText is defined use it to respond
      let googleResponse = app.buildRichResponse().addSimpleResponse({
        speech: responseToUser.speech || responseToUser.displayText,
        displayText: responseToUser.displayText || responseToUser.speech
      });
      // Optional: Overwrite previous response with rich response
      if (responseToUser.googleRichResponse) {
        googleResponse = responseToUser.googleRichResponse;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.googleOutputContexts) {
        app.setContext(...responseToUser.googleOutputContexts);
      }
      console.log('Response to Dialogflow (AoG): ' + JSON.stringify(googleResponse));
      app.ask(googleResponse); // Send response to Dialogflow and Google Assistant
    }
  }
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {};
      responseJson.speech = responseToUser; // spoken response
      responseJson.displayText = responseToUser; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
      // If speech or displayText is defined, use it to respond (if one isn't defined use the other's value)
      responseJson.speech = responseToUser.speech || responseToUser.displayText;
      responseJson.displayText = responseToUser.displayText || responseToUser.speech;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      responseJson.data = responseToUser.data;
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      responseJson.contextOut = responseToUser.outputContexts;
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson); // Send response to Dialogflow
    }
  }
}
// Construct rich response for Google Assistant (v1 requests only)
const app = new DialogflowApp();
const googleRichResponse = app.buildRichResponse()
  .addSimpleResponse('This is the first simple response for Google Assistant')
  .addSuggestions(
    ['Suggestion Chip', 'Another Suggestion Chip'])
    // Create a basic card and add it to the rich response
  .addBasicCard(app.buildBasicCard(`This is a basic card.  Text in a
 basic card can include "quotes" and most other unicode characters
 including emoji 📱.  Basic cards also support some markdown
 formatting like *emphasis* or _italics_, **strong** or __bold__,
 and ***bold itallic*** or ___strong emphasis___ as well as other things
 like line  \nbreaks`) // Note the two spaces before '\n' required for a
                        // line break to be rendered in the card
    .setSubtitle('This is a subtitle')
    .setTitle('Title: this is a title')
    .addButton('This is a button', 'https://assistant.google.com/')
    .setImage('https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
      'Image alternate text'))
  .addSimpleResponse({ speech: 'This is another simple response',
    displayText: 'This is the another simple response 💁' });
// Rich responses for Slack and Facebook for v1 webhook requests
const richResponsesV1 = {
  'slack': {
    'text': 'This is a text response for Slack.',
    'attachments': [
      {
        'title': 'Title: this is a title',
        'title_link': 'https://assistant.google.com/',
        'text': 'This is an attachment.  Text in attachments can include \'quotes\' and most other unicode characters including emoji 📱.  Attachments also upport line\nbreaks.',
        'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
        'fallback': 'This is a fallback.'
      }
    ]
  },
  'facebook': {
    'attachment': {
      'type': 'template',
      'payload': {
        'template_type': 'generic',
        'elements': [
          {
            'title': 'Title: this is a title',
            'image_url': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
            'subtitle': 'This is a subtitle',
            'default_action': {
              'type': 'web_url',
              'url': 'https://assistant.google.com/'
            },
            'buttons': [
              {
                'type': 'web_url',
                'url': 'https://assistant.google.com/',
                'title': 'This is a button'
              }
            ]
          }
        ]
      }
    }
  }
};
/*
* Function to handle v2 webhook requests from Dialogflow
*/
function processV2Request (request, response) {
  // An action is a string used to identify what needs to be done in fulfillment
  let action = (request.body.queryResult.action) ? request.body.queryResult.action : 'default';
  // Parameters are any entites that Dialogflow has extracted from the request.
  let parameters = request.body.queryResult.parameters || {}; // https://dialogflow.com/docs/actions-and-parameters
  // Contexts are objects used to track and store conversation state
  let inputContexts = request.body.queryResult.contexts; // https://dialogflow.com/docs/contexts
  // Get the request source (Google Assistant, Slack, API, etc)
  let requestSource = (request.body.originalDetectIntentRequest) ? request.body.originalDetectIntentRequest.source : undefined;
  // Get the session ID to differentiate calls from different users
  let session = (request.body.session) ? request.body.session : undefined;
  // Create handlers for Dialogflow actions as well as a 'default' handler
  const actionHandlers = {
    // The default welcome intent has been matched, welcome the user (https://dialogflow.com/docs/events#default_welcome_intent)
    'input.welcome': () => {
      sendResponse('Hello, Welcome to my Dialogflow agent!'); // Send simple response to user
    },
    // Wenn eine Frage zu einem Versicherungsthema gestellt wurde, hole die Antwort aus der Datenbank und gib sie aus
    'input.versicherungsfrage': () => {
        let begriff = request.body.queryResult.parameters.Versicherungsthema;
        if ( begriff === '' ) {
            // Wenn in der Benutzereingabe die gesuchte Entity nicht erkannt wurde, macht die Suche in der DB keinen Sinn
            sendResponse('Diese Frage kann ich zum glück nicht beantworten :)');
            console.log('Begriff nicht vorgesehen: ' + request.body.queryResult.queryText);
        } else {
        var document = db.collection('Begriffe').doc(begriff);
        var getDoc = document.get()
            .then(doc => {
                if (doc.exists) {
                    // Begriff wurde in DB gefunden, Beschreibung ausgeben
                    sendResponse(doc.data().Beschreibung );
                    console.log( 'Begriff gefunden: ', doc.data() );
                } else {
                    // Begriff wurde nicht in DB gefunden, Meldung ausgeben
                    sendResponse('Den Begriff ' + begriff + ' kann ich leider nicht erklären.');
                    console.log('Begriff nicht gefunden: ' + begriff);
                }
            });
        }
    },
    'input.kontaktdaten': () => {
      let begriff = request.body.queryResult.parameters.Kontaktmedium;
      if (begriff === '') {
        sendResponse('Bitte gebe an, welche Art von Kontaktdaten Du wissen willst.');
      } else {
        let person = 'Erkan'
        var document = db.collection('Kontaktmedien').doc(person);

        var getDoc = document.get()
            .then(doc => {
              if (!doc.exists) {
                sendResponse('Zu diesem Namen wurde leider nichts gefunden.');
                console.log('Document nicht gefunden: ' + person);
              } else {
                console.log('Begriff gefunden: ' + begriff);
                if (begriff === 'Mailadresse') {
                  sendResponse('Die uns bekannte E-Mailadresse lautet: ' + doc.data().Mailadresse);
                } else if (begriff === 'Adresse') {
                  sendResponse('Die uns bekannte Adresse lautet: ' + doc.data().Adresse);
                } else if (begriff === 'Telefon') {
                  sendResponse('Die uns bekannte Rufnummer lautet: ' + doc.data().Telefon);
                }
              }
            }
          );
      }
      //sendResponse('42');
      //console.log('42');
    },
    //Wenn der Kundenname angegeben wurde, dann springe abhängig vom Alter des Kunden zu verschiedenen weiteren Intents
    // 'input.kundenname': () => {
    //     let alter = '';
    //     let c = request.body.queryResult.outputContexts;
    //     if ( c ) {
    //         for (var i=0; i<c.length; i++) {
    //             if (c[i].parameters.Alter > 0) {
    //                 alter = c[i].parameters.Alter;
    //             }
    //         }
    //     }
    //     let event = '';
    //     if ( alter >= 30 ) {
    //         event = 'Event_ab_30';
    //     } else {
    //         event = 'Event_unter_30';
    //     }
    //     let res = {
    //         followupEventInput: {
    //             name: event,
    //             languageCode: "de"
    //         }
    //     };
    //     sendResponse( res );
    // },
    'input.laufleistung_aktuell': () => {
      //Die Laufleistung des Kunden ist aktuell wir suchen nach einer anderen Lösung
      //für die Preissenkung
      let event = 'Event_laufleistung_aktuell';
      let res = {
          followupEventInput: {
              name: event,
              languageCode: "de"
          }
      };

      sendResponse( res );
    },
    // The default fallback intent has been matched, try to recover (https://dialogflow.com/docs/intents#fallback_intents)
    'input.unknown': () => {
      // Use the Actions on Google lib to respond to Google requests; for other requests use JSON
      sendResponse('I\'m having trouble, can you try that again?'); // Send simple response to user
    },
    // Default handler for unknown or undefined actions
    'default': () => {
      let responseToUser = {
        //fulfillmentMessages: richResponsesV2, // Optional, uncomment to enable
        //outputContexts: [{ 'name': `${session}/contexts/weather`, 'lifespanCount': 2, 'parameters': {'city': 'Rome'} }], // Optional, uncomment to enable
        fulfillmentText: 'This is from Dialogflow\'s Cloud Functions for Firebase editor! :---)' // displayed response
      };
      sendResponse(responseToUser);
    }
  };
  // If undefined or unknown action use the default handler
  if (!actionHandlers[action]) {
    action = 'default';
  }
  // Run the proper handler function to handle the request from Dialogflow
  actionHandlers[action]();
  // Function to send correctly formatted responses to Dialogflow which are then sent to the user
  function sendResponse (responseToUser) {
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {fulfillmentText: responseToUser}; // displayed response
      response.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {};
        // ergänzt Drawehn 12.01.2018
        if (responseToUser.followupEventInput) {
            responseJson.followupEventInput = responseToUser.followupEventInput;
        }
      // Define the text response
      responseJson.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        responseJson.outputContexts = responseToUser.outputContexts;
      }
      // Send the response to Dialogflow
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson));
      response.json(responseJson);
    }
  }
}
const richResponseV2Card = {
  'title': 'Title: this is a title',
  'subtitle': 'This is an subtitle.  Text can include unicode characters including emoji 📱.',
  'imageUri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  'buttons': [
    {
      'text': 'This is a button',
      'postback': 'https://assistant.google.com/'
    }
  ]
};
const richResponsesV2 = [
  {
    'platform': 'ACTIONS_ON_GOOGLE',
    'simple_responses': {
      'simple_responses': [
        {
          'text_to_speech': 'Spoken simple response',
          'display_text': 'Displayed simple response'
        }
      ]
    }
  },
  {
    'platform': 'ACTIONS_ON_GOOGLE',
    'basic_card': {
      'title': 'Title: this is a title',
      'subtitle': 'This is an subtitle.',
      'formatted_text': 'Body text can include unicode characters including emoji 📱.',
      'image': {
        'image_uri': 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png'
      },
      'buttons': [
        {
          'title': 'This is a button',
          'open_uri_action': {
            'uri': 'https://assistant.google.com/'
          }
        }
      ]
    }
  },
  {
    'platform': 'FACEBOOK',
    'card': richResponseV2Card
  },
  {
    'platform': 'SLACK',
    'card': richResponseV2Card
  }
];
