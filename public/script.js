"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("./functions");
document.addEventListener('DOMContentLoaded', function () {
    const yearSpan = document.querySelector('.year');
    const currentYear = (0, functions_1.getCurrentYear)();
    if (yearSpan) {
        yearSpan.textContent = currentYear.toString();
    }
});
