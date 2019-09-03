document.addEventListener('DOMContentLoaded', () => {
  // setup event listeners
  const donationForm = document.getElementById('donation-pledge');
  donationForm.addEventListener('submit', handleSubmit);
  const submitButton = document.getElementById('donation-pledge-button');
  submitButton.addEventListener('click', handleSubmit);
  const closeModalButton = document.getElementById('donation-pledge-modal-close');
  closeModalButton.addEventListener('click', handleClickClose);
});

function handleClickClose(e) {
  e.preventDefault();
  const modal = document.getElementById('donation-pledge-modal');
  modal.setAttribute('class', 'vh-100 dn w-100 bg-black-80 absolute--fill absolute z-999');
}

function handleSubmit(e) {
  e.preventDefault();
  const modal = document.getElementById('donation-pledge-modal');
  modal.setAttribute('class', 'vh-100 dt w-100 bg-black-80 absolute--fill absolute z-999');
}