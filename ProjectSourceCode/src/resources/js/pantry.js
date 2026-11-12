
document.addEventListener('DOMContentLoaded', () => {

  // Get the HTML elements
  const addButton = document.getElementById('show-add-form');
  const addForm = document.getElementById('add-ingredient-form');
  const cancelButton = document.getElementById('cancel-add-ingredient');
  const ingredientContainer = document.querySelector('.pantry-ingredients');

  // Show the Add Ingredient form
  addButton.addEventListener('click', () => {
    addForm.hidden = false;
    addButton.setAttribute('aria-expanded', 'true');
    document.getElementById('ingredient-name').focus();
  });

  // Hide the form when Cancel is clicked
  cancelButton.addEventListener('click', () => {
    addForm.hidden = true;
    addButton.setAttribute('aria-expanded', 'false');
    addForm.reset();
  });

  // Handle saving a new ingredient
  addForm.addEventListener('submit', (event) => {
    event.preventDefault();

    // Get the values entered by the user
    const name = document.getElementById('ingredient-name').value.trim();
    const quantity = Number(
      document.getElementById('ingredient-quantity').value
    );
    const unit = document.getElementById('ingredient-unit').value;

    // Validate the input
    if (!name || !Number.isFinite(quantity) || quantity <= 0) {
      alert('Please enter a valid ingredient and quantity.');
      return;
    }

    // Create a new ingredient card
    const card = document.createElement('div');
    card.className = 'pantry-ingredient-card';

    const heading = document.createElement('h3');
    heading.textContent = name;

    const description = document.createElement('p');
    description.textContent = `${quantity} ${unit}`;

    card.appendChild(heading);
    card.appendChild(description);

    // Remove the empty pantry message if present
    const emptyMessage = ingredientContainer.querySelector('.pantry-empty');
    if (emptyMessage) {
      emptyMessage.remove();
    }

    // Add the new card to the pantry
    ingredientContainer.appendChild(card);

    // Reset and hide the form
    addForm.reset();
    addForm.hidden = true;
    addButton.setAttribute('aria-expanded', 'false');
  });

});
