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

// --- Helper functions for form element creation ---
function createInput(type, id, name, options = {}) {
    const { step, required, value, placeholder, ariaLabel } = options;
    return `<input type="${type}" id="${id}" name="${name}" ${step ? `step="${step}"` : ''} ${required ? 'required' : ''} ${value ? `value="${value}"` : ''} ${placeholder ? `placeholder="${placeholder}"` : ''} ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>`;
}

function createLabel(htmlFor, text) {
    return `<label for="${htmlFor}">${text}</label>`;
}

function createSelect(name, options, selectedValue) {
    let optionsHtml = '';
    for (const value in options) {
        optionsHtml += `<option value="${value}" ${value === selectedValue ? 'selected' : ''}>${options[value]}</option>`;
    }
    return `<select name="${name}" aria-label="${name}">${optionsHtml}</select>`;
}

// --- Ingredient Cost Form Creation Functions ---
function createIngredientCostFormWithUnits(amount, unit, ingredient) {
    const formId = `form-${ingredient.replace(/\s+/g, '-')}`; // Create a unique ID
    const form = document.createElement('div');
    form.classList.add('ingredient-cost-form');
    form.id = formId;
    form.dataset.originalIngredient = `${amount} ${unit} ${ingredient}`;
    form.dataset.amount = parseAmount(amount); // Store the parsed numeric amount


    const unitsOptions = {
        g: "g", kg: "kg", ml: "ml", l: "l", oz: "oz",
        lb: "lb", tsp: "tsp", tbsp: "tbsp", cup: "cup",
        pint: "pint", quart: "quart", gallon: "gallon"
    };


    form.innerHTML = `
    <h3>Ingredient Costs</h3>
    <div class="ingredient-data">${amount} ${unit} ${ingredient}</div>
    ${createLabel(`package-cost-${ingredient}`, 'Package Cost:')}
    ${createInput('number', `package-cost-${ingredient}`, 'package-cost', { step: '0.01', required: true, ariaLabel: 'Package Cost' })}

    ${createLabel(`package-size-${ingredient}`, 'Package Size:')}
    <div class="input-group">
        ${createInput('number', `package-size-${ingredient}`, 'package-size', { required: true, ariaLabel: 'Package Size' })}
        ${createSelect('package-unit', unitsOptions, unit)}
    </div>
`;  // Removed Ingredient Price label and div
    return form;
}

function createIngredientCostFormWithoutUnits(amount, ingredient, amountValue) {
    const form = document.createElement('div');
    form.classList.add('ingredient-cost-form');
    const formId = `form-${ingredient.replace(/\s+/g, '-')}`; //Unique ID
    form.id = formId;

    form.dataset.originalIngredient = `${amount} ${ingredient}`; // Original for display
    form.dataset.amount = amountValue; // Store parsed amount

    form.innerHTML = `
      <h3>Ingredient Costs</h3>
      <div class="ingredient-data">${amount} ${ingredient}</div>

      ${createLabel(`package-cost-${ingredient}`, 'Package Cost:')}
      ${createInput('number', `package-cost-${ingredient}`, 'package-cost', { step: '0.01', required: true, ariaLabel: 'Package Cost' })}

      ${createLabel(`quantity-${ingredient}`, 'Quantity (No. of items):')}
      <div class="input-group">
        ${createInput('number', `quantity-${ingredient}`, 'quantity', { required: true, ariaLabel: 'Quantity' })}
        <span>Per Pack</span>
      </div>
    `; // Removed Ingredient Price label and div

    return form;
}

// --- Unit Conversion (Simplified - Consider a Library!) ---  (Still needed for parsing ingredients)
const unitConversions = {
    g: { kg: 0.001 },
    kg: { g: 1000 },
    ml: { l: 0.001 },
    l: { ml: 1000 },
    oz: { lb: 0.0625 }, //Simplified, not accurate for fluid vs weight
    lb: { oz: 16 },
    tsp: { tbsp: 1 / 3, ml: 4.92892 },  // US teaspoon conversions
    tbsp: { tsp: 3, ml: 14.7868 },
    cup: { tbsp: 16, ml: 236.588, oz: 8 }, // US cup
    pint: { cup: 2, ml: 473.176, oz: 16 }, // US liquid pint
    quart: { pint: 2, ml: 946.353, oz: 32 }, // US liquid quart
    gallon: { quart: 4, ml: 3785.41, oz: 128 } // US liquid gallon
};

function convertUnits(amount, fromUnit, toUnit) {
    if (fromUnit === toUnit) {
        return amount;
    }

    if (unitConversions[fromUnit] && unitConversions[fromUnit][toUnit]) {
        return amount * unitConversions[fromUnit][toUnit];
    }
    // Handle more complex conversions (e.g., tsp to kg) through intermediate units.
    // This is where a dedicated library becomes much more valuable.
    console.warn(`Cannot convert from ${fromUnit} to ${toUnit}`);
    return NaN; // Indicate an error
}
// --- Amount Parsing (Handles Fractions) --- (Still needed)
function parseAmount(amountString) {
    try {
        // Handle simple fractions (e.g., "1/2") and mixed numbers (e.g., "1 1/2")
        const parts = amountString.trim().split(/\s+/); // Split by spaces
        let total = 0;

        for (const part of parts) {
            if (part.includes('/')) {
                const [numerator, denominator] = part.split('/').map(Number);
                if (denominator === 0) {
                    throw new Error("Division by zero in fraction.");
                }
                total += numerator / denominator;
            } else {
                total += parseFloat(part);
            }
        }

        return isNaN(total) ? NaN : total; //Handle cases like "."
    } catch (error) {
        console.error("Error parsing amount:", amountString, error);
        return NaN; // Indicate an error
    }
}

// --- Error Handling ---
function showError(form, message) {
    //Since we don't have priceDisplay now, we will add error message div
    const errorDiv = document.createElement('div');
    errorDiv.textContent = message;
    errorDiv.classList.add('error');
    form.appendChild(errorDiv); // Append error message directly to the form
}


// --- Price Calculation --- REMOVED, no longer needed

// --- Ingredient Parsing ---
function parseIngredients() {
    ingredientCostsContainer.innerHTML = '';
    const ingredientsText = ingredientsTextarea.value;
    const lines = ingredientsText.split('\n').filter(line => line.trim() !== '');
    const recognizedUnits = [
        "g", "kg", "ml", "l", "oz", "lb",
        "tsp", "tbsp", "cup", "pint", "quart", "gallon"
    ];
    lines.forEach(line => {
        const match = line.match(/^([\d./\s]+)\s*([a-zA-Z]*)?\s*(.+)$/);

        if (match) {
            let amount = match[1];
            let unit = match[2];
            let ingredient = match[3].trim();
            const amountValue = parseAmount(amount); // Get the numeric value

            if (!unit || !recognizedUnits.includes(unit.toLowerCase())) {
                // If the unit isn't recognized, combine it with the ingredient name.
                ingredient = (unit ? unit + " " : "") + ingredient;
                unit = undefined; // Clear the unit, so it goes to the quantity-based form.
                const costForm = createIngredientCostFormWithoutUnits(amount, ingredient, amountValue);
                ingredientCostsContainer.appendChild(costForm);

            } else {
                // Unit is recognized
                const costForm = createIngredientCostFormWithUnits(amount, unit, ingredient);
                ingredientCostsContainer.appendChild(costForm);
            }
        } else {
            //Handle no match
            const errorForm = document.createElement('div');
            errorForm.textContent = "Invalid Input: " + line;
            errorForm.classList.add('error');
            ingredientCostsContainer.appendChild(errorForm);
        }
    });
}

// --- Event Listeners ---
addRecipeButton.addEventListener('click', switchToRecipePage);

cancelButton.addEventListener('click', () => {
    switchToMainPage();
    resetRecipeForm();
});

// --- Ingredient Input Event Listener ---
ingredientsTextarea.addEventListener('input', parseIngredients);

// --- Menu Item Click Listener ---
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        if (!item.classList.contains('add-recipe')) {
            alert(`You clicked on: ${item.querySelector('span').textContent}`);
        }
    });
});

// --- Next Button Event Listener ---
nextButton.addEventListener('click', () => {
    // Call parseIngredients() to ensure forms are created:
    parseIngredients();

    // Input Validation
    const title = document.getElementById('recipe-title').value.trim();
    const servings = document.getElementById('recipe-servings').value;
    const units = document.getElementById('recipe-units').value;
    const ingredients = document.getElementById('recipe-ingredients').value.trim();
    let isFormValid = true; // Flag for form validity

    if (!title || !ingredients) {
        alert('Please fill in all required fields.');
        isFormValid = false; // Set flag
        return; // Stop if basic fields are empty.
    }

    if (isNaN(parseInt(servings)) || parseInt(servings) <= 0) {
        alert('Please enter a valid number for servings.');
        isFormValid = false;
        return;
    }

    // Ingredient Cost Data Collection
    const ingredientCosts = [];
    const costForms = ingredientCostsContainer.querySelectorAll('.ingredient-cost-form');

    costForms.forEach(form => {
        const ingredientData = form.dataset.originalIngredient;
        const packageCost = form.querySelector('[name="package-cost"]').value;
        // Removed: const ingredientPrice = form.querySelector('.ingredient-price').textContent;


        let packageSize = null;
        let packageUnit = null;
        let quantity = null;

        const packageSizeInput = form.querySelector('[name="package-size"]');
        if (packageSizeInput) {
            packageSize = packageSizeInput.value;
            packageUnit = form.querySelector('[name="package-unit"]').value;
             if (!packageCost || !packageSize) { //Removed ingredient price check
                alert(`Please fill in cost and size for ${ingredientData}`);
                isFormValid = false;
                return;
            }
        } else {
            quantity = form.querySelector('[name="quantity"]').value;
            if (!packageCost || !quantity) { // Removed ingredient price check.
                alert(`Please fill in cost and quantity for ${ingredientData}`);
                isFormValid = false;
                return;
            }
        }

        ingredientCosts.push({
            ingredient: ingredientData,
            packageCost,
            packageSize,
            packageUnit,
            quantity,
            // Removed ingredientPrice
        });
    });

    // Data Submission (Simulated) - ONLY if the form is valid
    if (isFormValid) {
        alert(`Recipe Data:\n${JSON.stringify({ title, servings, units, ingredients, ingredientCosts }, null, 2)}`);
        resetRecipeForm();
        switchToMainPage();
    } // No else needed - if it's not valid, we've already shown alerts.
});