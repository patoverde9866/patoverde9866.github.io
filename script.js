// --- DOM Element Selection ---
const addRecipeButton = document.querySelector('.add-recipe');
const mainPage = document.getElementById('main-page');
const recipePage = document.getElementById('recipe-page');
const nextButton = document.getElementById('next-button');
const cancelButton = document.getElementById('cancel-button');
const ingredientsTextarea = document.getElementById('recipe-ingredients');
const ingredientCostsContainer = document.getElementById('ingredient-costs-container');
const menuItems = document.querySelectorAll('.menu-item');

// --- Utility Functions ---
function switchToMainPage() {
    recipePage.style.display = 'none';
    mainPage.style.display = 'block';
}

function switchToRecipePage() {
    mainPage.style.display = 'none';
    recipePage.style.display = 'block';
}

function resetRecipeForm() {
    document.getElementById('recipe-form').reset();
    ingredientCostsContainer.innerHTML = '';
}

// --- Event Listeners ---
addRecipeButton.addEventListener('click', switchToRecipePage);

cancelButton.addEventListener('click', () => {
    switchToMainPage();
    resetRecipeForm();
});

// --- Ingredient Cost Form Creation Functions ---
function createIngredientCostFormWithUnits(amount, unit, ingredient) {
    const form = document.createElement('div');
    form.classList.add('ingredient-cost-form');

    form.innerHTML = `
    <h3>Ingredient Costs</h3>
    <div class="ingredient-data">${amount} ${unit} ${ingredient}</div>
    
    <label for="package-cost-${ingredient}">Package Cost:</label>
    <input type="number" id="package-cost-${ingredient}" name="package-cost" step="0.01" required>

    <label for="package-size-${ingredient}">Package Size:</label>
    <div class="input-group">
      <input type="number" id="package-size-${ingredient}" name="package-size" required>
      <select name="package-unit">
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="ml">ml</option>
        <option value="l">l</option>
        <option value="oz">oz</option>
        <option value="lb">lb</option>
        <option value="tsp">tsp</option>
        <option value="tbsp">tbsp</option>
        <option value="cup">cup</option>
        <option value="pint">pint</option>
        <option value="quart">quart</option>
        <option value="gallon">gallon</option>
      </select>
    </div>
    <label>Ingredient Price:</label>
    <div class="ingredient-price"></div>
  `;
    form.dataset.originalIngredient = `${amount} ${unit} ${ingredient}`; // Store the original
    return form;
}

function createIngredientCostFormWithoutUnits(amount, ingredient) {
    const form = document.createElement('div');
    form.classList.add('ingredient-cost-form');

    form.innerHTML = `
      <h3>Ingredient Costs</h3>
      <div class="ingredient-data">${amount} ${ingredient}</div>

      <label for="package-cost-${ingredient}">Package Cost:</label>
      <input type="number" id="package-cost-${ingredient}" name="package-cost" step="0.01" required>

      <label for="quantity-${ingredient}">Quantity (No. of items):</label>
      <div class="input-group">
        <input type="number" id="quantity-${ingredient}" name="quantity" required>
        <span>Per Pack</span>
      </div>
        <label>Ingredient Price:</label>
      <div class="ingredient-price"></div>
    `;
    form.dataset.originalIngredient = `${amount} ${ingredient}`; //Store the original
    return form;
}

// --- Price Calculation (CORRECTED) ---
function updateIngredientPrices(form) {
    const ingredientData = form.dataset.originalIngredient; // Get from data attribute
    const priceDisplay = form.querySelector('.ingredient-price');

    // Check if it's unit-based or not
    const packageSizeInput = form.querySelector('[name="package-size"]');
    if (packageSizeInput) {
        // Unit-based
        const packageCost = parseFloat(form.querySelector('[name="package-cost"]').value);
        const packageSize = parseFloat(packageSizeInput.value);
        const packageUnit = form.querySelector('[name="package-unit"]').value;

        const match = ingredientData.match(/^([\d./\s]+)\s*([a-zA-Z]+)?/); // Get amount and unit
        if (!match) {
            priceDisplay.textContent = "Error parsing ingredient";
            return; // Stop if we can't parse the ingredient line.
        }
        const amount = parseFloat(match[1]);
        const unit = match[2] || ''; // Unit might be undefined

        if (isNaN(packageCost) || isNaN(packageSize) || isNaN(amount)) {
            priceDisplay.textContent = '';
            return;
        }
        let convertedAmount = amount;

        // Unit Conversions
        if (unit === 'kg' && packageUnit === 'g') {
            convertedAmount *= 1000;
        } else if (unit === 'g' && packageUnit === 'kg') {
            convertedAmount /= 1000;
        } else if (unit === 'l' && packageUnit === 'ml') {
            convertedAmount *= 1000;
        } else if (unit === 'ml' && packageUnit === 'l') {
            convertedAmount /= 1000;
        }
        // Add more unit conversions as needed


        const price = (packageCost / packageSize) * convertedAmount;
        priceDisplay.textContent = `${ingredientData} @ ${price.toFixed(2)}`;


    } else {
        // Quantity-based - CORRECTED
        const packageCost = parseFloat(form.querySelector('[name="package-cost"]').value);
        const quantity = parseFloat(form.querySelector('[name="quantity"]').value); // Moved inside
        const match = ingredientData.match(/^([\d./\s]+)\s*/);

        if (!match) {
            priceDisplay.textContent = "Error parsing ingredient";
            return;
        }

        const amount = parseFloat(match[1]); // Get the amount

        if (isNaN(packageCost) || isNaN(quantity) || isNaN(amount)) {
            priceDisplay.textContent = '';
            return;
        }

        const price = (packageCost / quantity) * amount;
        priceDisplay.textContent = `${ingredientData} @ ${price.toFixed(2)}`;
    }
}

// --- Ingredient Parsing ---
function parseIngredients() {
    ingredientCostsContainer.innerHTML = ''; // Clear previous forms
    const ingredientsText = ingredientsTextarea.value;
    const lines = ingredientsText.split('\n').filter(line => line.trim() !== ''); // Split and remove empty lines

    const recognizedUnits = [
        "g", "kg", "ml", "l", "oz", "lb",
        "tsp", "tbsp", "cup", "pint", "quart", "gallon"
    ];

    lines.forEach(line => {
        // IMPROVED REGEX:
        const match = line.match(/^([\d./\s]+)\s*([a-zA-Z]*)?\s*(.+)$/);

        if (match) {
            const amount = match[1];
            let unit = match[2];
            const ingredient = match[3].trim();

            if (unit && recognizedUnits.includes(unit.toLowerCase())) {
                // --- Unit-Based Ingredient ---
                const costForm = createIngredientCostFormWithUnits(amount, unit, ingredient);
                ingredientCostsContainer.appendChild(costForm);

                // Attach event listeners *AFTER* appending to the DOM:
                const packageCostInput = costForm.querySelector('[name="package-cost"]');
                const packageSizeInput = costForm.querySelector('[name="package-size"]');
                const packageUnitSelect = costForm.querySelector('[name="package-unit"]');
                packageCostInput.addEventListener('input', () => updateIngredientPrices(costForm));
                packageSizeInput.addEventListener('input', () => updateIngredientPrices(costForm));
                packageUnitSelect.addEventListener('change', () => updateIngredientPrices(costForm));


            } else {
                // --- Quantity-Based Ingredient ---
                const displayText = unit ? `${amount} ${unit} ${ingredient}` : `${amount} ${ingredient}`;
                const costForm = createIngredientCostFormWithoutUnits(amount, displayText);
                ingredientCostsContainer.appendChild(costForm);

                // Attach event listeners *AFTER* appending to the DOM:
                const packageCostInput = costForm.querySelector('[name="package-cost"]');
                const quantityInput = costForm.querySelector('[name="quantity"]');
                packageCostInput.addEventListener('input', () => updateIngredientPrices(costForm));
                quantityInput.addEventListener('input', () => updateIngredientPrices(costForm));
            }
        }
    });
}

// --- Event Listener for Ingredient Input ---
ingredientsTextarea.addEventListener('input', parseIngredients);

// --- Menu Item Click Listener ---
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        if (!item.classList.contains('add-recipe')) {
            alert(`You clicked on: ${item.querySelector('span').textContent}`);
        }
    });
});

// --- Next Button Event Listener --- (CORRECTED)
nextButton.addEventListener('click', () => {
    // Input Validation (Same as before)
    const title = document.getElementById('recipe-title').value.trim();
    const servings = document.getElementById('recipe-servings').value;
    const units = document.getElementById('recipe-units').value;
    const ingredients = document.getElementById('recipe-ingredients').value.trim();

    if (!title || !ingredients) {
        alert('Please fill in all required fields.');
        return;
    }

    if (isNaN(parseInt(servings)) || parseInt(servings) <= 0) {
        alert('Please enter a valid number for servings.');
        return;
    }

    // Ingredient Cost Data Collection (CORRECTED)
    const ingredientCosts = [];
    const costForms = ingredientCostsContainer.querySelectorAll('.ingredient-cost-form');

    costForms.forEach(form => {
        // Use data-original-ingredient:
        const ingredientData = form.dataset.originalIngredient; // CORRECT
        const packageCost = form.querySelector('[name="package-cost"]').value;
        const ingredientPrice = form.querySelector('.ingredient-price').textContent; // Get calculated price

        let packageSize = null;
        let packageUnit = null;
        let quantity = null;

        const packageSizeInput = form.querySelector('[name="package-size"]');
        if (packageSizeInput) {
            packageSize = packageSizeInput.value;
            packageUnit = form.querySelector('[name="package-unit"]').value;
            if (!packageCost || !packageSize || !ingredientPrice) { // Check ingredientPrice
                alert(`Please fill in cost and size for ${ingredientData}`);
                return;
            }
        } else {
            quantity = form.querySelector('[name="quantity"]').value;
            if (!packageCost || !quantity || !ingredientPrice) {  // Check ingredientPrice
                alert(`Please fill in cost and quantity for ${ingredientData}`);
                return;
            }
        }

        ingredientCosts.push({
            ingredient: ingredientData, // Use the correct ingredient data
            packageCost,
            packageSize,
            packageUnit,
            quantity,
            ingredientPrice,
        });
    });

    // Data Submission (Simulated) - Now includes ingredientPrices
    alert(`Recipe Data:\n${JSON.stringify({ title, servings, units, ingredients, ingredientCosts }, null, 2)}`);

    resetRecipeForm();
    switchToMainPage();
});