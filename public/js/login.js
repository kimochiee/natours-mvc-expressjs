import { showAlert } from './alerts.js';

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:8001/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Log in successfully!');

      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:8001/api/v1/users/logout',
    });

    console.log(res);

    if ((res.data.status = 'success')) {
      location.reload(true);
    }
  } catch (error) {
    showAlert('error', 'There is some error when logging out');
  }
};

const loginForm = document.querySelector('.form--login');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

const logoutBtn = document.querySelector('.nav__el--logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    logout();
  });
}
