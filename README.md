# StockSync

Inventory and expiry tracking for multi-outlet Indonesian retailers, with a marketplace for selling near-expiry stock to nearby shops and warung.

A static web app: plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run it

Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000

To publish on GitHub Pages: push the folder to a repository, then Settings > Pages > Deploy from branch > `main` / root.

## What it does

## Visuals

- Maps: drawn in SVG (works offline, schematic, not to scale). Outlets map on Dashboard and Outlets, sellers-near-you map on Marketplace. Tap a pin to jump to its stock or listings.
- Product illustrations: `assets/products/*.svg`, picked by the `img` key in `js/data.js`.
- Shop fronts: generated per outlet or seller in `shop()` in `js/app.js`.

## Pages

| Page | Function |
| --- | --- |
| Dashboard | Stock value, near-expiry and low-stock counts, 7-day chart, categories, outlet status, activity |
| Inventory | Search, add, delete, adjust quantity, export CSV |
| Expiry watch | Products inside the alert window, with a Sell action |
| Marketplace | Buy nearby surplus (4% fee: 3% seller, 1% buyer, optional 1% insurance); list your own stock |
| Orders | Track sales and purchases; delivering a purchase adds it to stock |
| Outlets | Per-outlet stock position |
| Reports | Revenue recovered, food saved, CO2e avoided |
| Settings | ERP/POS connection, plan, alert window, WhatsApp alerts, reset |

Data is stored in the browser (`localStorage`). Nothing is sent anywhere.

## Files

    index.html        page shell
    css/style.css     all styling (colour tokens at the top)
    js/data.js        sample data, dates relative to today
    js/app.js         views, actions, chart
    assets/           logo, favicon, product illustrations (SVG)

## Notes

- All products, shops and prices are sample data.
- The 7-day chart is illustrative: only the latest point is computed from your data.
- Food-saved and CO2e figures use assumptions (0.5 kg per unit, 2.5 kg CO2e per kg). Edit them in `js/app.js`.
- Responsive: above 900px you get the sidebar layout; below it, a bottom tab bar, swipeable summary cards and table rows shown as cards. This is pure CSS (media query), so GitHub needs no special setup.
- The font (Schibsted Grotesk) loads from Google Fonts and falls back to the system font offline.
- Add a LICENSE file before publishing.
