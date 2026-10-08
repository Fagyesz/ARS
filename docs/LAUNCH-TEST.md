# Launch test checklist

Run on https://arsmosoris.art while production is still private (log in with your Shopify account when the
site asks). Do it once on a desktop browser and once on a phone. Tick each box; anything that fails goes
to the bottom with what you saw.

**Before you start**
- [ ] kosR return URL is set to `https://arsmosoris.art/koszonjuk` (needed for section 6)
- [ ] Tax status checked: the 9th digit of the tax number is 1 (alanyi adómentes). Otherwise stop: the
      invoices would carry the wrong VAT code (AAM)
- [ ] One real card (or kosR's test mode) for a cheap order, e.g. the Cápali szatyor (3 000 Ft)

## 1. Home and browsing
- [ ] Home: hero clothesline animation starts after the first mouse move or scroll; text stays readable
- [ ] Scrolling down: the print studio appears beside "Válogatott sorozataink", the artist tees beside
      "Alkotóink", the folded stack by the newsletter
- [ ] Header menu: Bolt, Kollekciók, Alkotók, Események, Rólunk, Kapcsolat all open the right page
- [ ] `/collections`: Táskák is listed with the bag photo
- [ ] Catalogue (`/collections/all`): type chips (incl. Táskák), size chips and sorting change the list;
      the page keeps its scroll position
- [ ] Footer: Táskák link works; "Süti beállítások" reopens the cookie banner

## 2. Product page
- [ ] Title reads "<termék> – <alkotó teljes neve>" in the browser tab (e.g. "Bika póló – Kéringer Dóri")
- [ ] Choosing size and colour updates price, photo and stock ("Már csak N db" on low stock)
- [ ] A sold-out size can be picked and offers the back-in-stock e-mail form
- [ ] "Ha ma megrendeled, várható átvétel: …" shows a sensible date window (working days only)
- [ ] Share button: on the phone it opens the share sheet; on desktop it copies the link ("Link másolva")
- [ ] Size guide opens for tees; hoodies and one-offs show the note instead
- [ ] Sticky add-to-cart bar appears when scrolling past the button and asks for a size first
- [ ] Cserebogár póló: black M offers both Digitális nyomat (7 500 Ft) and Linómetszet (7 000 Ft)

## 3. Search and wishlist
- [ ] Search drawer: typing shows suggestions; Enter opens the results page; an empty search asks for a term
- [ ] Heart on a product card adds it to `/wishlist`; it is still there after a reload

## 4. Cart
- [ ] Add two different items; the cart drawer opens with both
- [ ] +/- changes quantity; going over stock shows a toast instead of a wrong number
- [ ] Changing the size in the cart swaps the line (no duplicate line)
- [ ] "Van kuponkódod?": a wrong code shows an error; a real code (if one exists) reduces the total
- [ ] If an automatic discount is running, its banner and cart nudge show; the discount appears in the total

## 5. Checkout (kosR)
- [ ] "Tovább a pénztárhoz" goes to kosR with the same items and total
- [ ] FoxPost parcel point picker works and the 1 300 Ft shipping is added
- [ ] Payment completes

## 6. After the order
- [ ] You land on `/koszonjuk`; the cart badge on the site is empty
- [ ] Order confirmation e-mail arrives
- [ ] Invoice e-mail arrives: note has the order number, lines show AAM, the FoxPost shipping line is there
- [ ] The order shows in Shopify admin with the tag "Billed" (or "Számlázva" if renamed)
- [ ] FoxPost label can be created from the order

## 7. Cancel test (same order)
- [ ] Cancel the order in Shopify admin (with refund)
- [ ] Storno invoice e-mail arrives
- [ ] If a FoxPost label was made: delete the parcel in the FoxPost portal (or kosR) before drop-off,
      and check it is not on the next weekly FoxPost bill

## 8. Account
- [ ] "Bejelentkezés": type the e-mail, "Kódot kérek" lands directly on Shopify's 6-digit code screen
- [ ] After the code you are back on the site, logged in (account icon leads to the account page)
- [ ] Orders list shows the test order; its page shows status, and after fulfilment the
      "Csomag követése →" link and parcel number
- [ ] Addresses: add, edit, delete (Hungarian error messages on bad input)
- [ ] Logout works; opening `/account` while logged out sends you to the login page

## 9. Forms and consent
- [ ] Newsletter: subscribing needs the consent checkbox; a second signup with the same e-mail shows a
      Hungarian message
- [ ] Contact form sends (message arrives by e-mail / Discord)
- [ ] Cookie banner: accept and decline both close it and are remembered after a reload

## 10. Phone specifics (390 px wide)
- [ ] Bottom navigation, menu drawer and cart drawer open and close; focus does not get lost
- [ ] No sideways scrolling on any page
- [ ] Cookie banner does not hide the sticky add-to-cart bar
- [ ] Phone browser menu → "Add to home screen": the icon and name "Ars Mosoris" look right

## 11. Odds and ends
- [ ] A made-up URL (`/nincs-ilyen`) shows the branded Hungarian 404 page
- [ ] About page: ink-line animation in the header
- [ ] Policy pages (shipping, returns, privacy, terms) show FoxPost / 1 300 Ft and the right e-mail

## At launch
- [ ] Shopify admin → Hydrogen → Production → URL privacy: **Public**
- [ ] Search Console: verify `arsmosoris.art`, submit `https://arsmosoris.art/sitemap.xml`
- [ ] Google & YouTube channel in Shopify for free Shopping listings
- [ ] Rich Results Test on one tee and one one-off piece (Product / ProductGroup, breadcrumbs)

## Found problems
| Section | What happened | Device / browser |
|---|---|---|
| | | |
