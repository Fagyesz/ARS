# Ars Mosoris: legal analysis of the webshop

Checked 2026-11-01 against the code on `main`. This is a technical compliance review, not legal advice. Have a lawyer or a webshop ÁSZF service check the final texts before launch.

**Limits of this check**

- The site is private, and this repo has no `.env`, so the values in the `shop_settings` metaobject and the live product descriptions could not be read. The kosR checkout was not reviewed either.
- Each finding says how it was checked:
  - **[read]**: checked against the current statute text.
  - **[secondary]**: from an authority's or adviser's summary.
  - **[memory]**: from general knowledge; confirm before relying on it.

## Short answer: must the sole trader's details be shown?

**Yes, assuming the seller is an egyéni vállalkozó. The site can't currently show them all.**

| Must be shown | Legal basis | Site today |
|---|---|---|
| Name exactly as registered, with "egyéni vállalkozó" or "e.v." | Ektv. 4. §; Evtv. 16. § (4) [read] | Depends on metaobject; falls back to the brand name "Ars Mosoris", which is not a legal name |
| Seat, full postal address | Ektv. 4. §; 45/2014. 11. § (1) c) [read] | Falls back to "Budapest, Magyarország" labelled "Székhely" |
| Registration number | Ektv. 4. §; Evtv. 16. § (4) [read] | **No field exists** |
| Registering body | Ektv. 4. § [read] | **No field exists** |
| Tax number | Ektv. 4. § applies if the seller is subject to VAT [read]; an AAM trader still counts as one [memory] | Field exists; empty means hidden |
| Regularly used e-mail address | Ektv. 4. §; 45/2014. 11. § (1) c) [read] | OK |
| Phone number | 45/2014. 11. § (1) c) [read] | Field exists; empty means hidden |
| Hosting provider: seat and contact details, with e-mail | Ektv. 4. § [read] (exception only where the type of hosting already makes them known; don't rely on it) | **Missing** |

Authorities do compare these details with the register. In one published case, a county office objected because a sole trader's name, seat and registering body on the site were not shown correctly [secondary]. Copy them character for character from the owner's register extract.

Points to settle:

- **The seat is public.** If the seller's seat is a home address, it appears on the site. The only way around that is a registered seat elsewhere.
- **Who is the seller?** The site says four artists founded the brand. Only the legal seller's details go here. If the four work under one person's registration, the artists' relationship with that person needs its own agreement.
- **Trade notification.** Webshop trading normally has to be notified to the jegyző at the seat [memory]. Confirm that this was done and that the registered activities cover clothing sales and, for the new page, customising customers' garments.

## Launch blockers

The status file gives 2026-11-01 as launch day, and the site is still private. **Keep it private until items 1–5 are done.**

### 1. Operator details are incomplete (see above)

`app/components/OperatorDetails.tsx` silently omits empty fields, and `app/lib/content.ts` holds a placeholder address. The status file also still lists these details as an open owner task.

Add registration number and registering body fields, show the hosting provider, remove the placeholder, and make a missing required field fail a pre-launch check. Also list the details on an easy-to-find footer link, such as "Impresszum".

The host is Shopify; take its legal entity and address from Shopify's own terms.

### 2. The mandatory withdrawal function is missing

Required since **19 June 2026**, and authorities are checking for it. The code contains no such function.

The law [read, 45/2014. 22. § (1a)–(1c)] requires:

- a function labelled **"elállás a szerződéstől"**, clearly visible and available throughout the withdrawal period;
- an online statement collecting the decision, the name, the contract details and where the confirmation should go;
- a confirm button labelled **"elállás megerősítése"**;
- an immediate receipt on a durable medium, with the content, date and time of the withdrawal.

A contact address or the general form is not enough [secondary]. The recommended build is a public `/elallas` page, linked from the footer and the order pages, that sends the receipt by e-mail. Check whether kosR already offers this; a function hidden in the checkout flow would not be enough on its own.

In 2025, authorities objected to 127 of the 248 sites they checked [secondary].

### 3. The withdrawal terms contradict the law

`app/routes/policies.refund-policy.tsx`, last updated 2025-01-01:

| Site says | Law says [read, 45/2014.] |
|---|---|
| Handmade or unique products cannot be withdrawn from | The exception covers only goods not pre-made and produced on the consumer's instruction (29. § c). **Ready-made stock, even one-of-a-kind pieces, can be returned** |
| Return must be posted within 14 days of purchase | Within 14 days of giving notice of withdrawal (24. §); the withdrawal period runs from receipt (20. §) |
| Refund within 14 days of receiving and inspecting the return | Within 14 days of learning of the withdrawal (23. §); the trader may hold the refund until the goods or proof of posting arrive [memory] |
| May refuse a return that isn't in its original state | Only a deduction for loss of value from excessive use is allowed (25. §); no right of refusal |

Also missing:

- the model withdrawal form (Annex 2), which must be provided under 11. § (1) i). If withdrawal information is missing, the deadline extends by **12 months** (21. §). The same section should be confirmed to cover the form;
- the full statutory warranty information (11. § (1) m).

### 4. The terms have wrong or risky clauses

`app/routes/policies.terms-of-service.tsx`:

- **VAT.** Prices are said to include ÁFA, but invoices are set up as AAM (`docs/STATUS.md`). Reword this to match the seller's real tax status.
- **Handmade claim.** It says products are hand-made, and the footer data says "Kézzel készül Budapesten", while the product sheet includes digital prints. Say what's true per product, because a false claim is a misleading practice.
- **Liability cap.** "Always limited to the purchase price" is very likely void against consumers, at least for intentional harm and harm to life or health [memory]. Delete it or narrow it.
- **Outdated warranty reference.** It cites 151/2003, which covers listed durable goods. Consumer goods warranty is under the Ptk. and 373/2021. Korm. rendelet [memory].
- **Conciliation.** Only the Budapest body is named, but the competent body normally follows the consumer's residence [secondary]. Keep the name and address required by 11. § (1) w) [read], and add a link to the list at bekeltetes.hu. Confirm the Budapest e-mail on bekeltet.bkik.hu, since sources differ.
- **Order steps.** Check the Ektv. 5. § pre-order information: language, whether the contract is stored and how to correct errors [memory]. Test that the acknowledgement arrives within 48 hours (Ektv. 6. §) [read].

### 5. Product pages may lack required information

- **Fibre composition.** It must be visible before purchase, including online [read, Reg. 1007/2011 Art. 16]. **None of the 42 products in the repo's CSV snapshot mention it**, and the product page has no dedicated field. The live descriptions couldn't be checked. The fix is a metafield shown on the product page.
- **Product safety.** Each listing needs the manufacturer's name, postal and e-mail address, a product identifier and any warnings [secondary, GPSR Art. 19]. Show this as a block on the product page, using the same operator data. Second-hand or third-party blanks may need separate review.

## Fix soon after launch

**Green claims.** Since 27 September 2026, claims must be specific and provable [read, Fttv. definitions and annex item 37; dates partly secondary].

- The copy in the owners' message says **"fenntartható divat"**. Don't use it on the new page. Write the concrete fact instead, such as "a meglévő ruhádat dolgozzuk át, nem új darabot gyártunk".
- `policies.shipping-policy.tsx` says "környezetbarát csomagolóanyagok". Name the material or remove the phrase.
- Emi's biography describes a personal direction and is lower risk. Make sure it isn't used to sell products as recycled.

**Privacy notice** (`policies.privacy-policy.tsx`) [memory, GDPR Art. 13]:

- Say which data goes outside the EU and on what safeguard (Shopify, Resend and Discord are the ones to check).
- Add the rights to restriction and to withdraw consent, and the right to go to court.
- List the cookies and their lifetimes.
- Add the newsletter and back-in-stock retention periods.
- Reconsider sending customer messages to Discord. It is disclosed, but a plain e-mail would avoid the transfer.

**Cookies.** Check on the live site that no analytics or marketing cookies are set before a choice is made. The code only applies a stored choice, so what happens before the first choice needs testing.

**Newsletter.** Consent via checkbox is good. I found no unsubscribe link in the confirmation e-mail or any leiratkozás handling in the code. Add both; every marketing mail must allow it [memory].

**Discounts.** When a crossed-out price is shown, the reference must be the lowest price of the previous 30 days [memory]. Agree this with whoever sets `compareAt` prices.

**Artists' rights.** The site sells works by named artists. Each one should have a written licence with the seller, covering use on products and in advertising [memory]. The ÁSZF's copyright clause assumes the seller holds those rights.

**Ideas from `text.md`.** The monthly free-garment draw and birthday discounts need their own terms and consent, and the draw may trigger promotional lottery rules. Review them before building.

## What the custom-order page changes

The customer's own garment makes this a **service**, not a product sale. The enquiry form itself creates little risk; the agreement that follows is what needs care.

| Topic | Requirement | Page or process |
|---|---|---|
| Pre-contract information | Applies even if agreed by e-mail: scope, total price, deadline, delivery, cost of returning the garment, withdrawal rights (45/2014. 11. §) [read] | Written quote template, sent before acceptance |
| Withdrawal | 14 days from contract. To start earlier, the customer must expressly ask on a durable medium and acknowledge that the right ends after full performance (19. §, 29. §) [read]; on earlier withdrawal they pay a proportionate fee (11. § (1) k) [read] | Fixed sentence in the customer's acceptance e-mail |
| Own design supplied | Customer's images may belong to someone else | Customer confirms they hold the rights; owners may refuse any request |
| Garment damage | Liability can't simply be waived. State the real risks (old, stained or fragile fabric) up front | Pre-work condition note and photos; agree the procedure with the lawyer |
| Personal data | Name, e-mail, message and any photos | Add a "custom order" line to the privacy notice, with a retention period |
| Claims | No "fenntartható" wording; state specific facts | See above |
| Fibre labelling | The tailor exemption may apply (Reg. 1007/2011 Art. 2(4)) [read]; whether it fits this work needs confirming | Lawyer question |
| Invoice | Goes outside the kosR flow | Issue by hand in Billingo, with correct tax treatment |

The ÁSZF also needs a short section on custom orders, since its scope currently covers purchases in the webshop only.

## What the owners need to provide

1. Who the seller is, plus the register extract: exact name, seat, registration number, registering body and tax number.
2. Phone number and contact e-mail for the legal pages.
3. Confirmation of AAM status and registered activities.
4. Fibre composition per product and manufacturer details for any blanks.
5. Written agreements with the artists.
6. How each product is actually made (hand, lino, digital).

## Sources

- [2001. évi CVIII. tv. (Ektv.)](https://net.jogtar.hu/jogszabaly?docid=a0100108.tv)
- [2009. évi CXV. tv. (Evtv.)](https://net.jogtar.hu/jogszabaly?docid=a0900115.tv)
- [45/2014. (II. 26.) Korm. rendelet](https://net.jogtar.hu/jogszabaly?docid=a1400045.kor)
- [2008. évi XLVII. tv. (Fttv.)](https://net.jogtar.hu/jogszabaly?docid=a0800047.tv)
- [Regulation (EU) 1007/2011](https://www.legislation.gov.uk/eur/2011/1007/body/data.html) (UK copy of the text; confirm against EUR-Lex)
- [Budapest Government Office on withdrawal function checks](https://kormanyhivatalok.hu/kormanyhivatalok/budapest/megye/hirek/hir/fogyasztovedelmi-hatosag-ellenorzi-webaruhazaknal-az)
- [Világgazdaság on the withdrawal button](https://www.vg.hu/vilaggazdasag-magyar-gazdasag/2026/06/elallas-gomb-magyar-webaruhaz)
- [County consumer protection decision on sole trader details](https://cdn.nkfh.gov.hu/static/uploads/BK_FGYV_00537_6_2025_www_vanbricollection_hu_3801309d25.pdf)
- [NKFH decision citing Ektv. 4. §](https://nkfh.gov.hu/uploads/KE_045_00081_6_2025_22c1c3911c.pdf)
- [GPSR Art. 19 summary (vimm.be)](https://www.vimm.be/en/blog/gpsr-article-19-product-information-webshop)
- [Taylor Wessing on the Hungarian green claims rules](https://www.taylorwessing.com/en/insights-and-events/insights/2026/04/greenwashing-in-the-crosshairs)
- [Conciliation bodies list, November 2025](https://www.dtkh.hu/dl/1580/bekelteto-testuletek-es-varmegyei-kormanyhivatalok-listaja-20251105.pdf)
- [Budapest Conciliation Board](https://bekeltet.bkik.hu)
