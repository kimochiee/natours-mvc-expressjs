import { showAlert } from './alerts.js';

const updateData = async (name, email) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:8001/api/v1/users/updateMe',
      data: {
        name,
        email,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Update data successfully!');

      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

const updatePassword = async (passwordCurrent, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://localhost:8001/api/v1/users/updateMyPassword',
      data: {
        passwordCurrent,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Update password successfully!');

      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://localhost:8001/api/v1/users/updateMyPassword'
        : 'http://localhost:8001/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `Update ${type} successfully!`);

      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

const userDataForm = document.querySelector('.form-user-data');
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    // updateData(name, email)
    updateSettings({ name, email }, 'data');
  });
}

const userPasswordForm = document.querySelector('.form-user-settings');
if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Udating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // await updatePassword(passwordCurrent, password, passwordConfirm)
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
  });
}
