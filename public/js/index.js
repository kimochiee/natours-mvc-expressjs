// import '@babel/polyfill';
import { login } from './login.js';
import { displayMap } from './mapbox.js';

const locations = JSON.parse(document.getElementById('map').dataset.locations);
if (locations) {
  displayMap(locations);
}

document.querySelector('.form').addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  login(email, password);
});
