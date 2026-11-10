import { getCurrentYear } from './functions';

document.addEventListener('DOMContentLoaded', function () {
	const yearSpan = document.querySelector('.year');
	const currentYear = getCurrentYear();
	if (yearSpan) {
		yearSpan.textContent = currentYear.toString();
	}
});
