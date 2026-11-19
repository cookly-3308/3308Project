
document.addEventListener('DOMContentLoaded', () => {

  // Get the HTML elements
  const addButton = document.getElementById('show-add-form');
  const addForm = document.getElementById('add-ingredient-form');
  const cancelButton = document.getElementById('cancel-add-ingredient');
  const ingredientContainer = document.querySelector('.pantry-ingredients');
  const analysisLoading = document.getElementById('analysis-loading');

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

  // AI Ingredient Photo Upload
  const photoInput = document.getElementById('fridge-photo');
  const previewContainer = document.getElementById('photo-preview-container');
  const photoPreview = document.getElementById('photo-preview');
  const analyzeButton = document.getElementById('analyze-photo-button');
  const uploadStatus = document.getElementById('upload-status');

  // AI Ingredient Confirmation Elements
  const ingredientConfirmation = document.getElementById('ingredient-confirmation');
  const detectedIngredientsList = document.getElementById('detected-ingredients-list');
  const missingIngredientInput = document.getElementById('missing-ingredient');
  const addMissingButton = document.getElementById('add-missing-ingredient');
  const confirmIngredientsButton = document.getElementById('confirm-ingredients');

  // Display editable ingredient rows returned by Gemini
  function displayDetectedIngredients(ingredients) {
    // Clear any results from a previous scan
    detectedIngredientsList.replaceChildren();

    ingredients.forEach((ingredient) => {
     // Create a row for each ingredient
      const row = document.createElement('div');
      row.className = 'detected-ingredient';

      // Allow the user to correct the ingredient name
      const input = document.createElement('input');
      input.type = 'text';
      input.value = ingredient;
      input.maxLength = 100;
      input.setAttribute('aria-label', 'Ingredient name');

      // Button to remove an incorrect detection
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'remove-detected-ingredient';
      removeButton.textContent = 'Remove';

      removeButton.addEventListener('click', () => {
        row.remove();
      });

      // Create a container for the ingredient name and remove button
      const nameRow = document.createElement('div');
      nameRow.className = 'detected-ingredient-name-row';

      nameRow.appendChild(input);
      nameRow.appendChild(removeButton);

      // Create quantity controls
      const quantityRow = document.createElement('div');
      quantityRow.className = 'detected-ingredient-quantity-row';

      // Quantity input
      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.className = 'detected-quantity';
      quantityInput.min = '0.01';
      quantityInput.step = 'any';
      quantityInput.value = '1';
      quantityInput.setAttribute('aria-label', `Quantity for ${ingredient}`);

      // Unit dropdown
      const unitSelect = document.createElement('select');
      unitSelect.className = 'detected-unit';
      unitSelect.setAttribute('aria-label', `Unit for ${ingredient}`);

      const units = [
        ['pieces', 'Pieces'],
        ['cups', 'Cups'],
        ['pounds', 'Pounds'],
        ['gallons', 'Gallons'],
        ['ounces', 'Ounces']
      ];

      units.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        unitSelect.appendChild(option);
      });

      // Labels
      const quantityLabel = document.createElement('label');
      quantityLabel.textContent = 'Quantity';

      const unitLabel = document.createElement('label');
      unitLabel.textContent = 'Unit';

      quantityLabel.appendChild(quantityInput);
      unitLabel.appendChild(unitSelect);

      quantityRow.appendChild(quantityLabel);
      quantityRow.appendChild(unitLabel);

      // Add everything to the ingredient card
      row.appendChild(nameRow);
      row.appendChild(quantityRow);

      detectedIngredientsList.appendChild(row);
    });

    // Show the confirmation section
    ingredientConfirmation.hidden = false;
  }

  // Add an ingredient that Gemini missed
  addMissingButton.addEventListener('click', () => {
    const name = missingIngredientInput.value.trim();

    if (!name) {
      missingIngredientInput.focus();
      return;
    }

    // Collect the existing ingredient names
    const existingIngredients = Array.from(
      detectedIngredientsList.querySelectorAll(
        '.detected-ingredient-name-row input'
      )
    ).map(input => input.value.trim().toLowerCase());

    // Prevent duplicate ingredient names
    if (existingIngredients.includes(name.toLowerCase())) {
      alert('This ingredient is already in the confirmation list.');
      return;
    }

    // Create another editable ingredient row
    const existingRows = Array.from(
      detectedIngredientsList.querySelectorAll('.detected-ingredient')
    );

    const currentIngredients = existingRows.map(row =>
      row.querySelector('.detected-ingredient-name-row input').value
    );

    currentIngredients.push(name);

    // Preserve any quantities and units already entered
    const savedValues = existingRows.map(row => ({
      quantity: row.querySelector('.detected-quantity').value,
      unit: row.querySelector('.detected-unit').value
    }));

    displayDetectedIngredients(currentIngredients);

    const updatedRows = detectedIngredientsList.querySelectorAll(
      '.detected-ingredient'
    );

    savedValues.forEach((values, index) => {
      updatedRows[index].querySelector('.detected-quantity').value =
        values.quantity;

      updatedRows[index].querySelector('.detected-unit').value =
        values.unit;
    });

    missingIngredientInput.value = '';
  });

  // Add confirmed ingredients to the Saved Ingredients section
  confirmIngredientsButton.addEventListener('click', () => {
    const rows = detectedIngredientsList.querySelectorAll(
      '.detected-ingredient'
    );

    const confirmedIngredients = [];

    // Read each ingredient's edited name, quantity, and unit
    for (const row of rows) {
      const name = row.querySelector(
        '.detected-ingredient-name-row input'
      ).value.trim();

      const quantity = Number(
        row.querySelector('.detected-quantity').value
      );

      const unit = row.querySelector('.detected-unit').value;

      // Validate each ingredient before saving anything
      if (!name || !Number.isFinite(quantity) || quantity <= 0) {
        alert('Please enter a valid name and quantity for every ingredient.');
        return;
      }

      confirmedIngredients.push({ name, quantity, unit });
    }

    if (confirmedIngredients.length === 0) {
      alert('Please add at least one ingredient before confirming.');
      return;
    }

    // Remove the empty pantry message, if present
    const emptyMessage = ingredientContainer.querySelector('.pantry-empty');

    if (emptyMessage) {
      emptyMessage.remove();
    }

    // Create pantry cards for the confirmed ingredients
    confirmedIngredients.forEach(({ name, quantity, unit }) => {
      const card = document.createElement('div');
      card.className = 'pantry-ingredient-card';

      const heading = document.createElement('h3');
      heading.textContent = name;

      const description = document.createElement('p');
      description.textContent = `${quantity} ${unit}`;

      card.appendChild(heading);
      card.appendChild(description);

      ingredientContainer.appendChild(card);
    });

    // Clear the confirmation screen
    ingredientConfirmation.hidden = true;
    detectedIngredientsList.replaceChildren();
    missingIngredientInput.value = '';

    uploadStatus.textContent =
      `Successfully added ${confirmedIngredients.length} ingredients to your pantry!`;

    // Scroll to the Saved Ingredients section
    ingredientContainer.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
   });
  });

  // Maximum image size: 5 MB
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  let previewUrl = null;

  // Handle selecting a fridge photo
  photoInput.addEventListener('change', () => {

    // Reset the previous selection
    analyzeButton.disabled = true;
    previewContainer.hidden = true;
    photoPreview.removeAttribute('src');
    uploadStatus.textContent = '';
    ingredientConfirmation.hidden = true;
    detectedIngredientsList.replaceChildren();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }

    const file = photoInput.files[0];

    // User canceled the file selection
    if (!file) {
      return;
    }

    // Validate image format
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      uploadStatus.textContent = 'Please select a JPG, PNG, or WebP image.';
      photoInput.value = '';
      return;
    }

    // Validate image size
    if (file.size > MAX_IMAGE_SIZE) {
      uploadStatus.textContent = 'Image must be smaller than 5 MB.';
      photoInput.value = '';
      return;
    }

    // Display the selected image
    previewUrl = URL.createObjectURL(file);
    photoPreview.src = previewUrl;
    previewContainer.hidden = false;

    // Enable the Analyze button
    analyzeButton.disabled = false;
    uploadStatus.textContent = 'Photo ready for analysis.';

  });

  // Send the selected fridge photo to Gemini for analysis
analyzeButton.addEventListener('click', async () => {
  const file = photoInput.files[0];

  if (!file || analyzeButton.disabled) {
    return;
  }

  // Prepare the image for upload
  const formData = new FormData();
  formData.append('photo', file);

  // Prevent repeated requests while Gemini is analyzing
  analyzeButton.disabled = true;
  analyzeButton.textContent = 'Analyzing Photo...';
  uploadStatus.textContent = '';
  analysisLoading.hidden = false;

  try {
    const response = await fetch('/api/pantry/analyze', {
      method: 'POST',
      body: formData,
    });

    // Handle expired login sessions
    if (response.redirected) {
      throw new Error('Your session has expired. Please log in again.');
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Photo analysis failed.');
    }

    if (result.ingredients.length === 0) {
      ingredientConfirmation.hidden = true;
      uploadStatus.textContent =
        'No recognizable ingredients found. Try another photo.';
    } else {
      displayDetectedIngredients(result.ingredients);
      uploadStatus.textContent =
        `Gemini detected ${result.ingredients.length} ingredients. Review them below.`;
    }

    console.log('Detected ingredients:', result.ingredients);

  } catch (error) {
    uploadStatus.textContent = error.message;
    console.error('Photo analysis error:', error);

  } finally {
    analysisLoading.hidden = true;
    analyzeButton.disabled = false;
    analyzeButton.textContent = 'Analyze Photo with AI';
    analysisLoading.hidden = true;
  }
});

  // Release the temporary preview URL when leaving the page
  window.addEventListener('pagehide', () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  });

});
