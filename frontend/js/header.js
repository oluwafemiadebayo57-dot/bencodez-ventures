// ============================================================
// SHARED HEADER — Bencodez-Ventures
// Injects consistent nav + mobile hamburger menu
// ============================================================

(function () {
    const path = window.location.pathname;
    const isAdminPage = path.includes('/admin/');
    const base = isAdminPage ? '..' : '.';

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    let user = null;
    try { user = (token && userStr) ? JSON.parse(userStr) : null; } catch (e) { user = null; }

    // --- Desktop right side ---
    let rightNav = '';
    let mobileMenuItems = '';

    if (user) {
        rightNav = `
            <a href="${base}/cart.html">🛒 Cart <span id="cart-count" style="background: var(--gold); color: var(--navy); padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">0</span></a>
            ${user.isAdmin ? `<a href="${base}/admin/dashboard.html" class="btn btn-sm" style="background: var(--gold); color: var(--navy); font-weight: 700;">⚙️ Admin</a>` : ''}
            <a href="${base}/account.html" style="display: flex; align-items: center; gap: 6px; font-weight: 600;">
                <span style="width: 28px; height: 28px; background: var(--navy); color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">${user.username.charAt(0).toUpperCase()}</span>
                ${user.username}
            </a>
            <button onclick="logoutUser()" class="btn btn-ghost btn-sm">Logout</button>
        `;

        mobileMenuItems = `
            <a href="${base}/index.html">🏠 Home</a>
            <a href="${base}/shop.html">🛍️ Shop All</a>
            <div class="menu-divider"></div>
            <a href="${base}/shop.html?category=clothes">👕 Clothes</a>
            <a href="${base}/shop.html?category=gadgets">📱 Gadgets</a>
            <a href="${base}/shop.html?category=cosmetics">💄 Cosmetics</a>
            <a href="${base}/shop.html?category=deodorants">🧴 Deodorants</a>
            <a href="${base}/shop.html?category=jewellery">💎 Jewellery</a>
            <div class="menu-divider"></div>
            <a href="${base}/cart.html">🛒 Cart</a>
            <a href="${base}/account.html">👤 My Account</a>
            ${user.isAdmin ? `<a href="${base}/admin/dashboard.html" style="color: var(--gold);">⚙️ Admin Dashboard</a>` : ''}
            <div class="menu-divider"></div>
            <button onclick="logoutUser()" class="btn btn-ghost">Logout</button>
        `;
    } else {
        rightNav = `
            <a href="${base}/cart.html">🛒 Cart <span id="cart-count" style="background: var(--gold); color: var(--navy); padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;">0</span></a>
            <a href="${base}/login.html" class="btn btn-primary btn-sm">Login</a>
            <a href="${base}/register.html" class="btn btn-outline btn-sm">Sign Up</a>
        `;

        mobileMenuItems = `
            <a href="${base}/index.html">🏠 Home</a>
            <a href="${base}/shop.html">🛍️ Shop All</a>
            <div class="menu-divider"></div>
            <a href="${base}/shop.html?category=clothes">👕 Clothes</a>
            <a href="${base}/shop.html?category=gadgets">📱 Gadgets</a>
            <a href="${base}/shop.html?category=cosmetics">💄 Cosmetics</a>
            <a href="${base}/shop.html?category=deodorants">🧴 Deodorants</a>
            <a href="${base}/shop.html?category=jewellery">💎 Jewellery</a>
            <div class="menu-divider"></div>
            <a href="${base}/cart.html">🛒 Cart</a>
            <a href="${base}/login.html" class="btn btn-primary">Login</a>
            <a href="${base}/register.html" class="btn btn-outline">Sign Up</a>
        `;
    }

    const headerHTML = `
        <div class="header-inner">
            <a href="${base}/index.html" class="logo">Bencodez<span>.</span></a>
            <nav class="nav">
                <a href="${base}/index.html">Home</a>
                <a href="${base}/shop.html">Shop</a>
                <a href="${base}/shop.html?category=clothes">Clothes</a>
                <a href="${base}/shop.html?category=gadgets">Gadgets</a>
                <a href="${base}/shop.html?category=cosmetics">Cosmetics</a>
                <a href="${base}/shop.html?category=jewellery">Jewellery</a>
            </nav>
            <div class="nav">
                ${rightNav}
            </div>
            <!-- Mobile hamburger -->
            <button class="hamburger" id="hamburger-btn" aria-label="Open menu">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    `;

    const mobileHTML = `
        <div class="mobile-overlay" id="mobile-overlay"></div>
        <nav class="mobile-menu" id="mobile-menu">
            ${mobileMenuItems}
        </nav>
    `;

    function injectHeader() {
        const header = document.querySelector("header.header");
        if (!header) return;

        header.innerHTML = headerHTML;

        // Append mobile menu to body (so it's not inside sticky header)
        const wrapper = document.createElement("div");
        wrapper.innerHTML = mobileHTML;
        document.body.appendChild(wrapper);

        updateCartCount();
        wireHamburger();
    }

    function updateCartCount() {
        const els = document.querySelectorAll("#cart-count");
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        els.forEach(el => el.textContent = count);
    }

    function wireHamburger() {
        const btn = document.getElementById("hamburger-btn");
        const menu = document.getElementById("mobile-menu");
        const overlay = document.getElementById("mobile-overlay");
        if (!btn || !menu || !overlay) return;

        const toggle = (open) => {
            btn.classList.toggle("open", open);
            menu.classList.toggle("open", open);
            overlay.classList.toggle("open", open);
            document.body.style.overflow = open ? "hidden" : "";
        };

        btn.addEventListener("click", () => {
            const isOpen = menu.classList.contains("open");
            toggle(!isOpen);
        });
        overlay.addEventListener("click", () => toggle(false));
        menu.querySelectorAll("a").forEach(a => {
            a.addEventListener("click", () => toggle(false));
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", injectHeader);
    } else {
        injectHeader();
    }
})();

function logoutUser() {
    if (!confirm("Log out of your account?")) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const isAdminPage = window.location.pathname.includes('/admin/');
    window.location.href = isAdminPage ? "../index.html" : "index.html";
}