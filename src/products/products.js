import { products } from '../../data.js';
import { elements } from '../shared/ui.js';
import { state } from '../shared/state.js';

export function renderProductsCarousel(report) {
  if (!elements.resultsProductsCarousel) return;
  elements.resultsProductsCarousel.innerHTML = "";
  
  let productsToRender = report.products || [];
  let isPrescribed = false;
  
  if (state.profile && state.profile.productOverrides && state.profile.productOverrides.length > 0) {
    const allProds = [...products.hair, ...products.skin];
    const overrides = allProds.filter(p => state.profile.productOverrides.includes(p.id));
    if (overrides.length > 0) {
      productsToRender = overrides;
      isPrescribed = true;
    }
  }
  
  if (productsToRender.length === 0) {
    elements.resultsProductsCarousel.innerHTML = "<p style='color: var(--text-muted); font-size: 13px;'>No matching products in database.</p>";
  } else {
    productsToRender.forEach(prod => {
      const card = document.createElement('div');
      card.className = "product-card";
      card.innerHTML = `
        <img class="product-image" src="${prod.image}" alt="${prod.name}">
        ${isPrescribed ? `<span class="product-category" style="background: rgba(92, 77, 74, 0.1); color: var(--primary-brown); font-weight: bold; border: 1px solid rgba(92, 77, 74, 0.2);">Specialist Prescribed</span>` : `<span class="product-category">${prod.category}</span>`}
        <h5 class="product-name">${prod.name}</h5>
        <div class="product-price-row">
          <span class="product-price">${prod.price}</span>
          <button class="product-buy-btn" onclick="alert('Proceeding to checkout for ${prod.name}...')">
            <i class="material-symbols-outlined" style="font-size: 16px;">shopping_bag</i>
          </button>
        </div>
      `;
      elements.resultsProductsCarousel.appendChild(card);
    });
  }
}
