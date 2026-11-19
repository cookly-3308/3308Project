
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

    // Temporarily display the recognized ingredients
    if (result.ingredients.length === 0) {
      uploadStatus.textContent =
        'No recognizable ingredients found. Try another photo.';
    } else {
      uploadStatus.textContent =
        `Gemini found: ${result.ingredients.join(', ')}`;
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
