document.addEventListener('DOMContentLoaded', () => {
  // setup event listeners
  const donateNowRoute = document.getElementById('donate-now-route-button');
  donateNowRoute.addEventListener('click', handleClickDonateNow);
});

function handleClickDonateNow(e) {
  e.preventDefault();
  $('html, body').animate(
    {
      scrollTop: $('#donate-section').offset().top,
    },
    1250
  );
}
