import axios from 'https://cdn.jsdelivr.net/npm/axios@1.3.5/+esm';
import { showAlert } from './alerts.js';

const stripe = Stripe(
  'pk_test_51OA3koIeL1lfhCQHlkBB463VWFRmkHyrBe2deiD6KRAAjBbHaK5zdsnupgAIvmFaBvu5k9HhGunAiILH2quBG8rk000D0ProAN'
);

const bookTour = async (tourId) => {
  try {
    const session = await axios(
      `http://localhost:8001/api/v1/bookings/checkout-session/${tourId}`
    );
    // console.log(session);

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (error) {
    console.log(error);
    showAlert('error', error);
  }
};

const bookBtn = document.getElementById('book-tour');
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
