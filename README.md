# Tropos: men's supplement storefront

Static site with no build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

- `index.html`: page structure (hero, quiz, shop, stacks, subscriptions, labels, FAQ)
- `styles.css`: all styling, mobile-first breakpoints
- `app.js`: product catalog, quiz scoring, cart and product modal

Product data (doses, prices, label facts) lives at the top of `app.js` in `PRODUCTS` and `STACKS`.
Product images are in `img/` (3D studio renders, see `tools/render/`). Replace them with real photos at the same filenames.
Checkout is a placeholder. Hook `#checkoutBtn` up to Shopify, Stripe or similar.

## Launching on Netlify (waitlist mode)

Checkout is a **waitlist**: "Reserve my order" collects first name, email, the cart (products, doses, plan) and
the price at launch. No payment is taken. Reservations and newsletter sign-ups are stored by
[Netlify Forms](https://docs.netlify.com/forms/setup/) via the hidden `waitlist` and `newsletter` forms in `index.html`.

2. In Netlify: **Add new site → Import an existing project → GitHub**, pick this repo and the `main` branch.
   `netlify.toml` at the repo root already sets the publish folder to the repo root; there is no build command.
3. Deploy. In the site's **Forms** tab, enable form detection if asked, then redeploy once so Netlify registers the forms.
4. Submit a test reservation on the live URL and check it appears under **Forms → waitlist**.
5. Optional: **Forms → Form notifications** to get an email for every reservation, and **Domain management** to add your own domain.

Netlify's free plan includes 100 form submissions a month.
