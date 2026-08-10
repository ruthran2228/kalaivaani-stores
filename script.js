const cart = [];

// Change this to your father's WhatsApp number.
// Write country code + phone number. Do not use +, spaces, or dashes.
const shopWhatsAppNumber = "917667771101";

const addToCartButtons = document.querySelectorAll(".product-card button");
const cartItemsBox = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const clearCartButton = document.getElementById("clear-cart");
const whatsappOrderButton = document.getElementById("whatsapp-order");

addToCartButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const productCard = button.closest(".product-card");

    const productName = productCard.querySelector("h3").textContent;
    const productPriceText = productCard.querySelector(".price").textContent;
    const productPrice = Number(productPriceText.replace(/[^\d]/g, ""));

    const existingProduct = cart.find(function (product) {
      return product.name === productName;
    });

    if (existingProduct) {
      existingProduct.quantity = existingProduct.quantity + 1;
    } else {
      cart.push({
        name: productName,
        price: productPrice,
        quantity: 1
      });
    }

    showCart();
  });
});

function showCart() {
  cartItemsBox.innerHTML = "";

  let total = 0;
  let totalItems = 0;

  cart.forEach(function (product) {
    const productTotal = product.price * product.quantity;

    total = total + productTotal;
    totalItems = totalItems + product.quantity;

    cartItemsBox.innerHTML += `
      <div class="cart-item">
        <span>${product.name} × ${product.quantity}</span>
        <strong>₹${productTotal}</strong>
      </div>
    `;
  });

  if (cart.length === 0) {
    cartItemsBox.innerHTML = "<p>Your cart is empty.</p>";
  }

  cartCount.textContent = totalItems;
  cartTotal.textContent = `₹${total}`;
}

clearCartButton.addEventListener("click", function () {
  cart.length = 0;
  showCart();
});

whatsappOrderButton.addEventListener("click", function () {
  const customerName = document.getElementById("customer-name").value.trim();
  const customerPhone = document.getElementById("customer-phone").value.trim();
  const deliveryPlace = document.getElementById("delivery-place").value.trim();

  if (cart.length === 0) {
    alert("Please add at least one product to your cart.");
    return;
  }

  if (!customerName || !customerPhone || !deliveryPlace) {
    alert("Please enter your name, phone number, and delivery location.");
    return;
  }

  let total = 0;

  const orderItems = cart.map(function (product) {
    const productTotal = product.price * product.quantity;
    total = total + productTotal;

    return `• ${product.name} × ${product.quantity} = ₹${productTotal}`;
  }).join("\n");

  const message = `*New Order - Kalaivani Stores*

*Customer name:* ${customerName}
*Phone:* ${customerPhone}
*Delivery location:* ${deliveryPlace}

*Order items:*
${orderItems}

*Total amount: ₹${total}*

Please confirm this order.`;

  const whatsappLink = `https://wa.me/${shopWhatsAppNumber}?text=${encodeURIComponent(message)}`;

  window.open(whatsappLink, "_blank");
});