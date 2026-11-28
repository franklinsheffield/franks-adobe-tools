import { test } from "node:test";
import assert from "node:assert/strict";
import { micSupported } from "../activity/src/micinput.js";
test("the mic only shows where speech recognition exists and the frame allows the microphone", () => {
  assert.equal(micSupported({}), false);
  assert.equal(micSupported({ webkitSpeechRecognition: function () {}, document: {} }), true);
  assert.equal(micSupported({ SpeechRecognition: function () {}, document: { permissionsPolicy: { allowsFeature: (f) => f !== "microphone" } } }), false);
  assert.equal(micSupported({ SpeechRecognition: function () {}, document: { featurePolicy: { allowsFeature: () => true } } }), true);
});
